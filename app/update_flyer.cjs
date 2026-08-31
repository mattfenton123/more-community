const fs = require('fs');
let content = fs.readFileSync('src/components/EventFlyerGenerator.jsx', 'utf8');

if (!content.includes('import { jsPDF }')) {
  content = content.replace('"use client";', '"use client";\nimport { jsPDF } from "jspdf";');
}

if (!content.includes('import { useState, useRef, useCallback, useEffect, useMemo }')) {
  content = content.replace('import { useState, useRef, useCallback, useEffect }', 'import { useState, useRef, useCallback, useEffect, useMemo }');
}

// 1. Better autoScale using Canvas measurement
const oldAutoScale = `  const longestWord = titleText.split(' ').reduce((max, word) => Math.max(max, word.length), 0);
  const autoScale = Math.min(1, 10 / (longestWord || 1));`;

const newAutoScale = `  const autoScale = useMemo(() => {
    if (typeof document === 'undefined') return 1;
    const baseTitleFontSize = template === 'bold' ? 86 : template === 'minimal' ? 76 : 72;
    const longestWordStr = titleText.split(' ').reduce((longest, word) => word.length > longest.length ? word : longest, "");
    const canvasMeasure = document.createElement('canvas');
    const ctxMeasure = canvasMeasure.getContext('2d');
    ctxMeasure.font = \\\`\\\${tmpl.titleWeight} \\\${baseTitleFontSize}px "\\\${font}", sans-serif\\\`;
    const longestWordWidth = ctxMeasure.measureText(longestWordStr).width;
    return longestWordWidth > 864 ? 864 / longestWordWidth : 1;
  }, [titleText, template, font, tmpl]);`;

if (content.includes(oldAutoScale)) {
  content = content.replace(oldAutoScale, newAutoScale);
}

// 2. Replace the three export functions with generateCanvas + exports
const startIndex = content.indexOf('  // ─── Export: Download via Canvas ───────────────────────────────────');
const endIndex = content.indexOf('  // ─── Panel Button ─────────────────────────────────────────────');

const exportFns = `  // ─── Shared Canvas Generator ──────────────────────────────────────────
  const generateCanvas = async () => {
    const canvas = document.createElement('canvas');
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw background
    if (bgImage) {
      await new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const scale = Math.max(width / img.width, height / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
          resolve();
        };
        img.onerror = () => resolve(); 
        img.src = bgImage;
      });
    }

    // Draw overlay gradient
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };
    const accentRgb = hexToRgb(accent);

    if (template === 'bold') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, \\\`rgba(\\\${accentRgb.r},\\\${accentRgb.g},\\\${accentRgb.b},0.87)\\\`);
      grad.addColorStop(0.4, \\\`rgba(\\\${accentRgb.r},\\\${accentRgb.g},\\\${accentRgb.b},0.27)\\\`);
      grad.addColorStop(1, 'rgba(0,0,0,0.85)');
      ctx.fillStyle = grad;
    } else if (template === 'minimal') {
      ctx.fillStyle = 'rgba(15,23,42,0.96)';
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.4)');
      grad.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, width, height);

    // Subtitle
    ctx.font = \\\`600 30px "\\\${font}", sans-serif\\\`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(subtitleText.toUpperCase(), 108, template === 'photo' ? 750 : 420);

    // Title
    const baseTitleFontSize = template === 'bold' ? 86 : template === 'minimal' ? 76 : 72;
    const titleFontSize = baseTitleFontSize * titleSizeMultiplier * autoScale;
    ctx.font = \\\`\\\${tmpl.titleWeight} \\\${titleFontSize}px "\\\${font}", sans-serif\\\`;
    ctx.fillStyle = titleColor;
    ctx.textAlign = 'left';
    
    // Word-wrap title
    const maxW = width - 216;
    const words = titleText.split(' ');
    let line = '';
    let titleY = template === 'photo' ? 800 : 480;
    const lineH = titleFontSize * 1.15;
    for (const word of words) {
      const test = line + word + ' ';
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line.trim(), 108, titleY);
        line = word + ' ';
        titleY += lineH;
      } else {
        line = test;
      }
    }
    ctx.fillText(line.trim(), 108, titleY);

    // Info pills
    const pillY = titleY + 70;
    ctx.font = \\\`600 28px "\\\${font}", sans-serif\\\`;
    
    const dateText = formatDate(event.date);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    const dateW = ctx.measureText(dateText).width + 60;
    ctx.beginPath();
    ctx.roundRect(108, pillY - 28, dateW, 48, 12);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText(dateText, 138, pillY + 2);

    const timeX = 108 + dateW + 12;
    const timeW = ctx.measureText(event.time).width + 60;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(timeX, pillY - 28, timeW, 48, 12);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText(event.time, timeX + 30, pillY + 2);

    const locY = pillY + 56;
    const locW = ctx.measureText(event.location).width + 60;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(108, locY - 28, locW, 48, 12);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.fillText(event.location, 138, locY + 2);

    // Description
    if (bodyText) {
      ctx.font = \\\`400 26px "\\\${font}", sans-serif\\\`;
      ctx.fillStyle = \\\`rgba(255,255,255,\\\${tmpl.bodyOpacity})\\\`;
      const descWords = bodyText.split(' ');
      let descLine = '';
      let descY = locY + 60;
      let lineCount = 0;
      for (const word of descWords) {
        if (lineCount >= 4) break;
        const test = descLine + word + ' ';
        if (ctx.measureText(test).width > maxW && descLine) {
          ctx.fillText(descLine.trim(), 108, descY);
          descLine = word + ' ';
          descY += 38;
          lineCount++;
        } else {
          descLine = test;
        }
      }
      if (lineCount < 4) ctx.fillText(descLine.trim(), 108, descY);
    }

    // Accent line
    ctx.fillStyle = template === 'minimal' ? accent : 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.roundRect(108, 1220, 64, 4, 2);
    ctx.fill();

    // Watermark
    ctx.font = \\\`700 30px "\\\${font}", sans-serif\\\`;
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.textAlign = 'right';
    ctx.fillText('more.', width - 60, height - 50);

    return canvas;
  };

  // ─── Export: Download via Canvas ───────────────────────────────────
  const exportAsPng = useCallback(async () => {
    setExportStatus('png');
    try {
      const canvas = await generateCanvas();
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \\\`\\\${titleText.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-flyer.png\\\`;
        a.click();
        URL.revokeObjectURL(url);
        setExportStatus(null);
      }, 'image/png');
    } catch (err) {
      console.error('PNG export failed:', err);
      setExportStatus(null);
    }
  }, [titleText, subtitleText, bodyText, accent, font, bgImage, template, event, tmpl, autoScale, titleSizeMultiplier, titleColor]);

  // ─── Export: PDF ──────────────────────────────────────────────
  const exportAsPdf = useCallback(async () => {
    setExportStatus('pdf');
    try {
      const canvas = await generateCanvas();
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [1080, 1350]
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, 1080, 1350);
      pdf.save(\\\`\\\${titleText.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-flyer.pdf\\\`);
      setExportStatus(null);
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportStatus(null);
    }
  }, [titleText, subtitleText, bodyText, accent, font, bgImage, template, event, tmpl, autoScale, titleSizeMultiplier, titleColor]);

  // ─── Export: Copy to Clipboard ────────────────────────────────
  const copyToClipboard = useCallback(async () => {
    setExportStatus('copy');
    try {
      const canvas = await generateCanvas();
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setTimeout(() => setExportStatus(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      setExportStatus(null);
    }
  }, [titleText, subtitleText, bodyText, accent, font, bgImage, template, event, tmpl, autoScale, titleSizeMultiplier, titleColor]);

`;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + exportFns + content.slice(endIndex);
}

fs.writeFileSync('src/components/EventFlyerGenerator.jsx', content);
console.log('Successfully updated EventFlyerGenerator.jsx');
