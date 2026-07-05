# デプロイ手順（Render.com）

## 事前準備
- GitHubアカウント（無ければ github.com で作成）
- Renderアカウント（github.com のアカウントでそのままサインアップ可）
- Anthropic APIキー（console.anthropic.com）

## 1. GitHubにコードを置く

ターミナルで `proposal-backend` フォルダに移動して：

```bash
git init
git add .
git commit -m "first commit"
```

次に GitHub 上で新しいリポジトリ（例: `proposal-builder`）を作成し、表示される案内に従って push します：

```bash
git remote add origin https://github.com/【あなたのユーザー名】/proposal-builder.git
git branch -M main
git push -u origin main
```

## 2. Renderでデプロイ

1. https://dashboard.render.com を開き、GitHubアカウントでログイン
2. 「New +」→「Web Service」
3. さっき push したリポジトリ（`proposal-builder`）を選択
4. `render.yaml` を自動検出するので、そのまま「Apply」でOK
   （検出されない場合は手動で以下を設定）
   - Build Command: `npm install`
   - Start Command: `npm start`
5. 環境変数の設定画面で以下を入力
   - `ANTHROPIC_API_KEY`: 実際のAPIキー
   - `BASIC_AUTH_USER` / `BASIC_AUTH_PASS`: 社内で使うID/パスワード（任意の文字列でOK）
   （`MOCK_CLAUDE` は最初 `true` にしておくと、課金なしで動作確認できます）
6. 「Create Web Service」をクリック

数分待つとビルドが完了し、`https://proposal-builder-xxxx.onrender.com` のようなURLが発行されます。これがそのままWebアプリのリンクです。

## 3. 動作確認

発行されたURLをブラウザで開き、フォームに入力して「スライド資料を生成する」を押してください。`MOCK_CLAUDE=true` のままならダミー内容のpptxが、`false` にして再デプロイすれば本物のClaude生成pptxがダウンロードされます。

環境変数を変更したら、Renderの画面で「Manual Deploy」→「Deploy latest commit」を押すと反映されます。

## 4. 公開前に必ずやっておくこと

`BASIC_AUTH_USER` / `BASIC_AUTH_PASS` を設定していれば、URLを開いた瞬間にID/パスワード入力画面が出るようになっています。設定を忘れると誰でもアクセスできてしまうので、デプロイ後に一度、シークレットウィンドウなどでURLを開いて認証画面が出るか必ず確認してください。

より本格的な運用（社員ごとのアカウント管理など）が必要になったら、SSO連携への切り替えも可能です。

## 無料プランの注意点

Renderの無料プランは、一定時間アクセスがないとサーバーが休止し、次のアクセス時に起動するまで数十秒かかります（コールドスタート）。使用頻度が上がってきたら有料プラン（月$7〜）への切り替えを検討してください。
