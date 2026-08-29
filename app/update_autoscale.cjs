const fs = require('fs');
const content = fs.readFileSync('src/components/EventFlyerGenerator.jsx', 'utf8');

const targetStr = `  const longestWord = titleText.split(' ').reduce((max, word) => Math.max(max, word.length), 0);
  const autoScale = Math.min(1, 10 / (longestWord || 1));`;

const newStr = `  const autoScale = useMemo(() => {
    if (typeof document === 'undefined') return 1;
    const baseTitleFontSize = template === 'bold' ? 86 : template === 'minimal' ? 76 : 72;
    const longestWordStr = titleText.split(' ').reduce((longest, word) => word.length > longest.length ? word : longest, "");
    const canvasMeasure = document.createElement('canvas');
    const ctxMeasure = canvasMeasure.getContext('2d');
    ctxMeasure.font = \`\${tmpl.titleWeight} \${baseTitleFontSize}px "\${font}", sans-serif\`;
    const longestWordWidth = ctxMeasure.measureText(longestWordStr).width;
    return longestWordWidth > 864 ? 864 / longestWordWidth : 1;
  }, [titleText, template, font, tmpl]);`;

if (content.includes(targetStr)) {
  fs.writeFileSync('src/components/EventFlyerGenerator.jsx', content.replace(targetStr, newStr));
  console.log('Successfully updated autoScale in EventFlyerGenerator.jsx');
} else {
  console.log('Could not find targetStr to replace');
}
