const crypto = require("crypto");

/**
 * 簡易 Basic 認証ミドルウェア。
 * 環境変数 BASIC_AUTH_USER / BASIC_AUTH_PASS が両方とも
 * 設定されている場合のみ有効になる（未設定なら素通し＝ローカル開発を邪魔しない）。
 */
function basicAuth(req, res, next) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  if (!expectedUser || !expectedPass) {
    // 認証情報が設定されていない場合は無効化（ローカルでの動作確認用）
    return next();
  }

  const header = req.headers.authorization || "";
  const [scheme, encoded] = header.split(" ");

  if (scheme !== "Basic" || !encoded) {
    return challenge(res);
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);

  if (safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)) {
    return next();
  }

  return challenge(res);
}

function challenge(res) {
  res.setHeader("WWW-Authenticate", 'Basic realm="Proposal Builder", charset="UTF-8"');
  res.status(401).send("認証が必要です。");
}

// 文字列長の違いによるタイミング攻撃を避けるための比較
function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // 長さが違う場合でも一定時間の比較を行う（ダミー比較）
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { basicAuth };
