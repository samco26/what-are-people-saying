# Serves the project folder over HTTP so the harness can fetch the source
# files. public/ is served at the root as well, the way Next.js serves it,
# so /logos/x.png resolves. Run from anywhere:
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools\no-node-check\serve.ps1
# Then open http://localhost:8899/tools/no-node-check/harness.html
# Stop it with Ctrl+C in that window.
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$roots = @($root, (Join-Path $root 'public'))
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add('http://localhost:8899/')
$l.Start()
Write-Host "Serving $root at http://localhost:8899/"
while ($l.IsListening) {
  $ctx = $l.GetContext()
  $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
  $file = $null
  foreach ($r in $roots) {
    $p = Join-Path $r $path
    if (Test-Path -LiteralPath $p -PathType Leaf) { $file = $p; break }
  }
  $res = $ctx.Response
  $res.Headers.Add('Access-Control-Allow-Origin', '*')
  $res.Headers.Add('Cache-Control', 'no-store')
  if ($file) {
    $bytes = [IO.File]::ReadAllBytes($file)
    $ext = [IO.Path]::GetExtension($file).ToLower()
    $ct = 'text/plain; charset=utf-8'
    if ($ext -eq '.html') { $ct = 'text/html; charset=utf-8' }
    if ($ext -eq '.css') { $ct = 'text/css; charset=utf-8' }
    if ($ext -eq '.js') { $ct = 'text/javascript; charset=utf-8' }
    if ($ext -eq '.png') { $ct = 'image/png' }
    if ($ext -eq '.svg') { $ct = 'image/svg+xml' }
    if ($ext -eq '.avif') { $ct = 'image/avif' }
    $res.ContentType = $ct
    $res.StatusCode = 200
  } else {
    $bytes = [Text.Encoding]::UTF8.GetBytes('not found: ' + $path)
    $res.StatusCode = 404
  }
  $res.ContentLength64 = $bytes.Length
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
  $res.Close()
}
