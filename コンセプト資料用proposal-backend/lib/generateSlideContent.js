const Anthropic = require("@anthropic-ai/sdk");

let anthropic = null;
function getClient() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

const SYSTEM_PROMPT = `
あなたはプレゼンテーション構成の専門家です。
入力された案件情報をもとに、6枚構成のスライド資料の「見出し」と「本文」を作成します。

出力は必ず次のJSONスキーマに厳密に従い、JSON以外の文字（説明文やコードブロックの \`\`\` 等）を
一切含めないでください。

{
  "coverTitle": string,          // 表紙タイトル（案件名をそのまま、または軽微に整えたもの）
  "coverSubtitle": string,       // 表紙に添える一行キャッチコピー
  "slides": [
    {
      "id": "issue",
      "heading": string,         // 見出し（4〜10文字程度）
      "body": string             // 本文（120〜200文字目安。読みやすく整理する）
    },
    { "id": "approach", "heading": string, "body": string },
    { "id": "items", "heading": string, "body": string },
    { "id": "prototype", "heading": string, "body": string }
  ],
  "imageSlide": {
    "heading": string,           // イメージ写真スライドの見出し
    "caption": string            // 写真群に添える一行の説明
  },
  "moodHint": {
    // ユーザーがトーンを指定しなかった場合のみ、内容から推定して埋める。
    // トーン指定がある場合は null を返す。
    "layoutStyle": "text-based" | "shape-based" | null,
    "accentHex": string | null   // 内容の雰囲気に合う6桁HEXカラー、または null
  }
}
`.trim();

/**
 * @param {object} input
 * @param {string} input.projectName
 * @param {string} input.issue
 * @param {string} input.approach
 * @param {string} input.items
 * @param {string} input.prototype
 * @param {number} input.imageCount
 * @param {{ tags: string[], freeText: string }} input.tone
 */
async function generateSlideContent(input) {
  // MOCK_CLAUDE=true の場合、Claude APIを一切呼ばずにダミーJSONを返す。
  // フォーム→pptx変換の一連の流れを課金なしで確認するためのスイッチ。
  if (process.env.MOCK_CLAUDE === "true") {
    return buildMockResponse(input);
  }

  const toneInstruction = buildToneInstruction(input.tone);

  const userPrompt = `
【案件名】${input.projectName || "（未指定）"}
【施設の課題】${input.issue || "（未記入）"}
【アプローチ】${input.approach || "（未記入）"}
【アイテム】${input.items || "（未記入）"}
【試作・その他】${input.prototype || "（未記入）"}
【添付イメージ写真枚数】${input.imageCount}枚

【トーン&マナー指定】${toneInstruction}

上記スキーマに従ってJSONのみを出力してください。
`.trim();

  const response = await getClient().messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  return parseSlideJson(rawText);
}

function buildMockResponse(input) {
  const hasTone = (input.tone?.tags?.length ?? 0) > 0 || (input.tone?.freeText ?? "").trim().length > 0;

  return {
    coverTitle: input.projectName || "（案件名未入力）サンプル案件",
    coverSubtitle: "モック応答：Claude APIは呼び出されていません",
    slides: [
      {
        id: "issue",
        heading: "施設の課題（モック）",
        body: input.issue?.trim() || "施設の課題の入力内容がここに整形されて入ります。これはダミーの本文です。",
      },
      {
        id: "approach",
        heading: "アプローチ（モック）",
        body: input.approach?.trim() || "アプローチの入力内容がここに整形されて入ります。これはダミーの本文です。",
      },
      {
        id: "items",
        heading: "アイテム（モック）",
        body: input.items?.trim() || "アイテムの入力内容がここに整形されて入ります。これはダミーの本文です。",
      },
      {
        id: "prototype",
        heading: "試作・その他（モック）",
        body: input.prototype?.trim() || "試作・その他の入力内容がここに整形されて入ります。これはダミーの本文です。",
      },
    ],
    imageSlide: {
      heading: "イメージ写真（モック）",
      caption: `${input.imageCount}枚のイメージ写真が添付されています`,
    },
    moodHint: hasTone
      ? null
      : { layoutStyle: "text-based", accentHex: "C9A227" },
  };
}

function buildToneInstruction({ tags = [], freeText = "" } = {}) {
  const hasTags = tags.length > 0;
  const hasText = freeText.trim().length > 0;

  if (!hasTags && !hasText) {
    return "指定なし。内容から適切な雰囲気を判断し、moodHintに反映してください。";
  }

  const parts = [];
  if (hasTags) parts.push(`タグ指定: ${tags.join(" / ")}`);
  if (hasText) parts.push(`自由記述: ${freeText.trim()}`);
  parts.push("この指定がある場合、moodHintは null を返してください（配色・レイアウトはタグ側で確定するため）。");
  return parts.join("\n");
}

function parseSlideJson(rawText) {
  // Claudeがまれにコードフェンス付きで返す場合に備えて除去
  const cleaned = rawText.replace(/^```json\s*|```$/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Claudeの出力をJSONとして解析できませんでした: ${err.message}`);
  }
}

module.exports = { generateSlideContent };
