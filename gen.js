const fs = require('fs');
const communities = [
    { id: 'mindful-miles', name: 'more Mindful Miles', eyebrow: 'Flagship Community', desc: 'Weekly walk and talk sessions.' },
    { id: 'tw-ramblers', name: 'TW Ramblers', eyebrow: 'Partner Community', desc: 'Join us for long-distance walks.' },
    { id: 'a-z-challenge', name: 'more A-Z Challenge', eyebrow: 'Flagship Community', desc: 'Complete running routes.' },
    { id: 'tw-parkrun', name: 'TW Parkrun', eyebrow: 'Partner Community', desc: 'Free, weekly, timed 5k event.' },
    { id: 'tw-yoga-collective', name: 'TW Yoga Collective', eyebrow: 'Partner Community', desc: 'Mental wellness and meditation.' },
    { id: 'kent-adventures', name: 'Kent Adventures', eyebrow: 'Partner Community', desc: 'Explore the unknown.' },
    { id: 'tw-good-neighbours', name: 'TW Good Neighbours', eyebrow: 'Partner Community', desc: 'Give back, grow forward.' },
    { id: 'tw-interfaith-network', name: 'TW Interfaith Network', eyebrow: 'Partner Community', desc: 'Break bread, build bonds.' },
    { id: 'tw-creative-collective', name: 'TW Creative Collective', eyebrow: 'Partner Community', desc: 'Create, express, connect.' }
];

const template = fs.readFileSync('yentw.html', 'utf8');

for (const c of communities) {
    let content = template.replace(/Young Entrepreneurs<br>Network <em>Tunbridge Wells\.<\/em>/g, c.name + '<em>.</em>');
    content = content.replace(/Flagship Venture/g, c.eyebrow);
    content = content.replace(/<title>.*?<\/title>/g, '<title>' + c.name + ' | more</title>');
    fs.writeFileSync(c.id + '.html', content);
}

const files = fs.readdirSync(__dirname);
files.forEach(f => {
    if (f.endsWith('.html') && f !== 'node_modules') {
        let content = fs.readFileSync(f, 'utf8');
        content = content.split('style.css?v=').join('style.css?v=8X').split('style.css?v=8X').join('style.css?v=8');
        content = content.split('style.css"').join('style.css?v=8"');
        content = content.split('script.js"').join('script.js?v=2"');
        content = content.split('script.js?v=').join('script.js?v=2X').split('script.js?v=2X').join('script.js?v=2');
        fs.writeFileSync(f, content);
    }
});
console.log('Pages generated!');
