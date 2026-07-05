require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");

const { generateSlideContent } = require("./lib/generateSlideContent");
const { buildPptx } = require("./lib/buildPptx");
const { basicAuth } = require("./lib/basicAuth");

const app = express();

// ヘルスチェックは認証不要（Renderなどの死活監視から叩かれるため）
app.get("/health", (_req, res) => res.json({ ok: true }));

// 簡易認証（BASIC_AUTH_USER / BASIC_AUTH_PASS が設定されている場合のみ有効）
// フォーム画面・APIの両方をこれで保護する。
app.use(basicAuth);

// フロントエンドを同一オリジンで配信する（public/index.html が入り口）
// これによりブラウザから見て完全に同一ドメインになり、CORS設定は不要になる。
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({ dest: path.join(os.tmpdir(), "proposal-uploads") });

app.post("/api/generate-proposal", upload.array("images", 5), async (req, res) => {
  const uploadedFiles = req.files || [];

  try {
    const { projectName, issue, approach, items, prototype, toneTags, toneFreeText } = req.body;

    // フロントは toneTags を JSON文字列（例: '["ラグジュアリー","繊細"]'）として送る想定
    const tags = toneTags ? JSON.parse(toneTags) : [];
    const tone = { tags, freeText: toneFreeText || "" };

    const slideContent = await generateSlideContent({
      projectName,
      issue,
      approach,
      items,
      prototype,
      imageCount: uploadedFiles.length,
      tone,
    });

    const pptx = buildPptx(slideContent, tone, uploadedFiles);

    const fileName = `${(projectName || "proposal").replace(/[^\w\-一-龠ぁ-んァ-ン]/g, "_")}.pptx`;
    const outBuffer = await pptx.write("nodebuffer");

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(outBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "スライド生成に失敗しました。" });
  } finally {
    // 一時保存した画像を削除
    uploadedFiles.forEach((f) => fs.unlink(f.path, () => {}));
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proposal backend listening on :${PORT}`));
