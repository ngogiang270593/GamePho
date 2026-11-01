param()
Add-Type -AssemblyName System.Drawing
$iconDirectory = Join-Path $PSScriptRoot '../public/icons'
[IO.Directory]::CreateDirectory($iconDirectory) | Out-Null
foreach ($size in @(192, 512, 180)) {
    $bitmap = New-Object Drawing.Bitmap $size,$size
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.ScaleTransform(($size / 512.0),($size / 512.0))
    $graphics.Clear([Drawing.ColorTranslator]::FromHtml('#315b39'))
    $cream = New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml('#fff1ce'))
    $broth = New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml('#c77a33'))
    $green = New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml('#78a354'))
    $red = New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml('#b45235'))
    $outline = New-Object Drawing.Pen ([Drawing.ColorTranslator]::FromHtml('#e2c18c')),8
    $steam = New-Object Drawing.Pen ([Drawing.ColorTranslator]::FromHtml('#fff1ce')),10
    $steam.StartCap = $steam.EndCap = [Drawing.Drawing2D.LineCap]::Round
    $path = New-Object Drawing.Drawing2D.GraphicsPath
    $path.AddBezier(105,259,128,435,384,435,407,259)
    $path.CloseFigure()
    $graphics.FillPath($cream,$path)
    $graphics.FillEllipse($cream,94,206,324,111)
    $graphics.FillEllipse($broth,112,222,288,77)
    $graphics.DrawArc($outline,156,236,111,37,0,210)
    $graphics.DrawArc($outline,221,242,121,34,190,215)
    $graphics.FillEllipse($green,170,231,45,23)
    $graphics.FillEllipse($green,284,253,42,19)
    $graphics.FillEllipse($red,237,230,47,22)
    $graphics.DrawBezier($steam,184,187,155,166,210,147,184,126)
    $graphics.DrawBezier($steam,254,179,225,154,284,132,254,104)
    $graphics.DrawBezier($steam,324,187,295,166,350,147,324,126)
    $fileName = if ($size -eq 180) { 'apple-touch-icon.png' } else { "icon-$size.png" }
    $bitmap.Save((Join-Path $iconDirectory $fileName),[Drawing.Imaging.ImageFormat]::Png)
    foreach ($resource in @($path,$cream,$broth,$green,$red,$outline,$steam,$graphics,$bitmap)) { $resource.Dispose() }
}
