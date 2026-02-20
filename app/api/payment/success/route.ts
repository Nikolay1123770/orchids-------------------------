import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const label = request.nextUrl.searchParams.get("label") || "";
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SMG VPN - Оплата прошла</title>
  <style>
    body { background:#080e1d; color:#e8f0ff; font-family:sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; }
    .card { background:#0d1526; border:1px solid rgba(20,214,160,0.3); border-radius:20px; padding:40px; text-align:center; max-width:360px; }
    .icon { font-size:56px; }
    h1 { color:#14d6a0; margin:16px 0 8px; }
    p { color:#8a9bbf; }
    .btn { display:inline-block; margin-top:24px; background:#14d6a0; color:#080e1d; font-weight:700; padding:14px 32px; border-radius:12px; text-decoration:none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#10004;</div>
    <h1>Оплата прошла!</h1>
    <p>Подписка активирована. Вернитесь в приложение.</p>
    <a href="/" class="btn">Вернуться</a>
  </div>
  <script>setTimeout(function(){ window.close(); }, 3000);</script>
</body>
</html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
