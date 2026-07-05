/**
 * トーン&マナー → デザイントークン変換
 *
 * ユーザーが選んだタグ（複数可）から、配色・レイアウト方針・
 * フォントウェイトなどのデザイントークンを決定する。
 * タグ未指定の場合は、Claudeが内容から推定した
 * moodSummary / layoutStyle（後述）を使ってここにフォールバックする。
 */

const TONE_PRESETS = {
  "シンプル": {
    palette: { bg: "FFFFFF", accent: "2B2B2B", text: "1A1A1A", muted: "8A8A8A" },
    layoutStyle: "text-based",
    fontWeight: "regular",
  },
  "ドラマチック": {
    palette: { bg: "10121A", accent: "E8A857", text: "F5F3ED", muted: "9B9B9B" },
    layoutStyle: "shape-based",
    fontWeight: "bold",
  },
  "ドリーミー": {
    palette: { bg: "FBF6FA", accent: "C9A7E0", text: "3A3245", muted: "A79BB5" },
    layoutStyle: "shape-based",
    fontWeight: "light",
  },
  "テキストベース": {
    palette: { bg: "FFFFFF", accent: "1F2937", text: "111827", muted: "6B7280" },
    layoutStyle: "text-based",
    fontWeight: "regular",
  },
  "図形ベース": {
    palette: { bg: "F5F5F5", accent: "0F62FE", text: "1A1A1A", muted: "6E6E6E" },
    layoutStyle: "shape-based",
    fontWeight: "medium",
  },
  "繊細": {
    palette: { bg: "FAF9F6", accent: "B8A88A", text: "2E2A24", muted: "9C9284" },
    layoutStyle: "text-based",
    fontWeight: "light",
  },
  "ラグジュアリー": {
    palette: { bg: "141414", accent: "C9A227", text: "F2F0E6", muted: "8A8272" },
    layoutStyle: "shape-based",
    fontWeight: "bold",
  },
  "ハイブランド": {
    palette: { bg: "0A0A0A", accent: "FFFFFF", text: "FFFFFF", muted: "8C8C8C" },
    layoutStyle: "text-based",
    fontWeight: "bold",
  },
};

const DEFAULT_TOKENS = {
  palette: { bg: "FFFFFF", accent: "C9A227", text: "1A1A1A", muted: "8A8A8A" },
  layoutStyle: "text-based",
  fontWeight: "regular",
};

/**
 * @param {string[]} tags - フロントエンドから届いた選択タグ配列（0〜複数）
 * @param {object} claudeMoodHint - タグ未指定時に使う、Claudeが推定したヒント
 *   { layoutStyle: "text-based" | "shape-based", accentHex?: string }
 */
function resolveDesignTokens(tags = [], claudeMoodHint = null) {
  if (tags.length === 0) {
    if (claudeMoodHint) {
      return {
        ...DEFAULT_TOKENS,
        layoutStyle: claudeMoodHint.layoutStyle || DEFAULT_TOKENS.layoutStyle,
        palette: {
          ...DEFAULT_TOKENS.palette,
          accent: claudeMoodHint.accentHex || DEFAULT_TOKENS.palette.accent,
        },
      };
    }
    return DEFAULT_TOKENS;
  }

  // 複数タグが選ばれた場合は最初にマッチしたものをベースに、
  // 2つ目以降はアクセントカラーのみ上書きする（単純合成）。
  const base = TONE_PRESETS[tags[0]] || DEFAULT_TOKENS;
  if (tags.length === 1) return base;

  const second = TONE_PRESETS[tags[1]];
  return {
    ...base,
    palette: { ...base.palette, accent: second ? second.palette.accent : base.palette.accent },
  };
}

module.exports = { TONE_PRESETS, DEFAULT_TOKENS, resolveDesignTokens };
