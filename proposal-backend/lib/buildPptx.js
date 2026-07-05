const PptxGenJS = require("pptxgenjs");
const { resolveDesignTokens } = require("./toneTokens");

/**
 * @param {object} slideContent - generateSlideContent() の戻り値
 * @param {{ tags: string[], freeText: string }} tone
 * @param {Array<{ path: string }>} images - multerが保存した画像の一時パス配列（最大5枚）
 * @returns {PptxGenJS} - まだ書き出していない pptx インスタンス
 */
function buildPptx(slideContent, tone, images) {
  const tokens = resolveDesignTokens(tone.tags, slideContent.moodHint);
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
  pptx.layout = "WIDE";

  addCoverSlide(pptx, slideContent, tokens);
  ["issue", "approach", "items", "prototype"].forEach((id) => {
    const data = slideContent.slides.find((s) => s.id === id);
    addContentSlide(pptx, data, tokens);
  });
  addImageSlide(pptx, slideContent.imageSlide, tokens, images);

  return pptx;
}

function addCoverSlide(pptx, content, tokens) {
  const slide = pptx.addSlide();
  slide.background = { color: tokens.palette.bg };

  slide.addShape("rect", {
    x: 0, y: 3.55, w: 1.4, h: 0.05,
    fill: { color: tokens.palette.accent },
    line: { type: "none" },
  });

  slide.addText(content.coverTitle, {
    x: 0.8, y: 2.6, w: 11.7, h: 1.2,
    fontFace: "Zen Kaku Gothic New",
    fontSize: 40,
    bold: tokens.fontWeight === "bold",
    color: tokens.palette.text,
  });

  slide.addText(content.coverSubtitle || "", {
    x: 0.82, y: 3.75, w: 11.7, h: 0.6,
    fontFace: "Zen Kaku Gothic New",
    fontSize: 16,
    color: tokens.palette.muted,
  });
}

function addContentSlide(pptx, data, tokens) {
  const slide = pptx.addSlide();
  slide.background = { color: tokens.palette.bg };

  if (tokens.layoutStyle === "shape-based") {
    slide.addShape("rect", {
      x: 0, y: 0, w: 3.2, h: 7.5,
      fill: { color: tokens.palette.accent },
      line: { type: "none" },
    });
    slide.addText(data.heading, {
      x: 0.5, y: 3.0, w: 2.4, h: 1.5,
      fontFace: "Zen Kaku Gothic New",
      fontSize: 24, bold: true,
      color: tokens.palette.bg,
    });
    slide.addText(data.body, {
      x: 3.7, y: 1.2, w: 9.0, h: 5.0,
      fontFace: "Zen Kaku Gothic New",
      fontSize: 16, color: tokens.palette.text,
      valign: "top", lineSpacing: 28,
    });
  } else {
    slide.addText(data.heading, {
      x: 0.7, y: 0.7, w: 10, h: 0.9,
      fontFace: "Zen Kaku Gothic New",
      fontSize: 26, bold: true,
      color: tokens.palette.text,
    });
    slide.addShape("rect", {
      x: 0.72, y: 1.55, w: 0.9, h: 0.04,
      fill: { color: tokens.palette.accent },
      line: { type: "none" },
    });
    slide.addText(data.body, {
      x: 0.7, y: 1.9, w: 10.8, h: 4.8,
      fontFace: "Zen Kaku Gothic New",
      fontSize: 16, color: tokens.palette.text,
      valign: "top", lineSpacing: 28,
    });
  }
}

function addImageSlide(pptx, imageSlide, tokens, images) {
  const slide = pptx.addSlide();
  slide.background = { color: tokens.palette.bg };

  slide.addText(imageSlide?.heading || "イメージ写真", {
    x: 0.7, y: 0.5, w: 10, h: 0.7,
    fontFace: "Zen Kaku Gothic New",
    fontSize: 24, bold: true,
    color: tokens.palette.text,
  });

  if (imageSlide?.caption) {
    slide.addText(imageSlide.caption, {
      x: 0.7, y: 1.15, w: 10.8, h: 0.5,
      fontFace: "Zen Kaku Gothic New",
      fontSize: 13, color: tokens.palette.muted,
    });
  }

  // 最大5枚を横並びグリッドで配置
  const gridY = 2.0;
  const gap = 0.25;
  const cellW = (12.3 - gap * (images.length - 1)) / Math.max(images.length, 1);
  images.slice(0, 5).forEach((img, i) => {
    slide.addImage({
      path: img.path,
      x: 0.5 + i * (cellW + gap),
      y: gridY,
      w: cellW,
      h: 4.6,
      sizing: { type: "cover", w: cellW, h: 4.6 },
    });
  });
}

module.exports = { buildPptx };
