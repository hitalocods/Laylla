Add-Type -AssemblyName System.Drawing

$srcPath = "Captura de tela 2026-11-18 103308.png"
if (-not (Test-Path $srcPath)) {
    Write-Error "Photo not found: $srcPath"
    exit 1
}

# Also copy raw photo with clean name
Copy-Item $srcPath "laylla-photo.png" -Force
Copy-Item $srcPath "public\laylla-photo.png" -Force

$srcImg = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath).Path)

function Generate-AppIcon($size, $outFile) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # 1. Fill base dark background
    $baseBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 18, 14, 22))
    $g.FillRectangle($baseBrush, 0, 0, $size, $size)
    $baseBrush.Dispose()

    # 2. Draw photo cover-fit (centered)
    $srcW = $srcImg.Width
    $srcH = $srcImg.Height
    $scale = [Math]::Max($size / $srcW, $size / $srcH)
    $destW = [int]($srcW * $scale)
    $destH = [int]($srcH * $scale)
    $destX = [int](($size - $destW) / 2)
    $destY = [int](($size - $destH) / 2)

    $g.DrawImage($srcImg, $destX, $destY, $destW, $destH)

    # 3. Add luxurious dark gradient overlay at bottom
    $gradRect = New-Object System.Drawing.Rectangle(0, [int]($size * 0.45), $size, [int]($size * 0.55))
    $topColor = [System.Drawing.Color]::FromArgb(0, 10, 8, 14)
    $botColor = [System.Drawing.Color]::FromArgb(235, 12, 10, 18)
    $gradBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($gradRect, $topColor, $botColor, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillRectangle($gradBrush, $gradRect)
    $gradBrush.Dispose()

    # 4. Subtle top vignette
    $topRect = New-Object System.Drawing.Rectangle(0, 0, $size, [int]($size * 0.25))
    $topGrad = New-Object System.Drawing.Drawing2D.LinearGradientBrush($topRect, [System.Drawing.Color]::FromArgb(100, 0, 0, 0), [System.Drawing.Color]::FromArgb(0, 0, 0, 0), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillRectangle($topGrad, $topRect)
    $topGrad.Dispose()

    # 5. Frosted Glass Banner for Text
    $bannerH = [int]($size * 0.22)
    $bannerY = [int]($size - $bannerH - ($size * 0.05))
    $bannerW = [int]($size * 0.90)
    $bannerX = [int](($size - $bannerW) / 2)
    $bannerRect = New-Object System.Drawing.Rectangle($bannerX, $bannerY, $bannerW, $bannerH)

    $bannerBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180, 25, 18, 30))
    $g.FillRectangle($bannerBrush, $bannerRect)
    $bannerBrush.Dispose()

    # Banner border
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 230, 200, 220), 2)
    $g.DrawRectangle($borderPen, $bannerRect)
    $borderPen.Dispose()

    # 6. Typography: "AGENDA" (small, tracked) and "LAYLLA ✨"
    $fontSubSize = [float]($size * 0.042)
    $fontTitleSize = [float]($size * 0.082)

    $fontFamily = "Segoe UI"
    $subFont = New-Object System.Drawing.Font($fontFamily, $fontSubSize, [System.Drawing.FontStyle]::Bold)
    $titleFont = New-Object System.Drawing.Font($fontFamily, $fontTitleSize, [System.Drawing.FontStyle]::Bold)

    $subFormat = New-Object System.Drawing.StringFormat
    $subFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $subFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

    $subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 230, 190, 200))
    $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(160, 0, 0, 0))

    $subY = $bannerY + ($bannerH * 0.26)
    $titleY = $bannerY + ($bannerH * 0.68)

    # Subtitle with shadow
    $g.DrawString("A G E N D A", $subFont, $shadowBrush, [float]($size / 2 + 1), [float]($subY + 1), $subFormat)
    $g.DrawString("A G E N D A", $subFont, $subBrush, [float]($size / 2), [float]$subY, $subFormat)

    # Title with shadow
    $g.DrawString("LAYLLA", $titleFont, $shadowBrush, [float]($size / 2 + 2), [float]($titleY + 2), $subFormat)
    $g.DrawString("LAYLLA", $titleFont, $titleBrush, [float]($size / 2), [float]$titleY, $subFormat)

    # Outer border for entire icon (for clean PWA look)
    $outerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 255, 255, 255), [Math]::Max(2, [int]($size * 0.008)))
    $g.DrawRectangle($outerPen, 1, 1, $size - 2, $size - 2)
    $outerPen.Dispose()

    # Clean up
    $subFont.Dispose()
    $titleFont.Dispose()
    $subBrush.Dispose()
    $titleBrush.Dispose()
    $shadowBrush.Dispose()
    $subFormat.Dispose()
    $g.Dispose()

    $bmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated: $outFile ($size x $size)"
}

Generate-AppIcon 512 "icon-512.png"
Generate-AppIcon 192 "icon-192.png"
Copy-Item "icon-512.png" "apple-touch-icon.png" -Force
Copy-Item "icon-512.png" "public\icon-512.png" -Force
Copy-Item "icon-192.png" "public\icon-192.png" -Force
Copy-Item "apple-touch-icon.png" "public\apple-touch-icon.png" -Force

$srcImg.Dispose()
Write-Output "All icons generated successfully with Laylla's photo!"
