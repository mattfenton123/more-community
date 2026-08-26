const fs = require('fs');

const communities = [
    { id: 'mindful-miles', name: 'more Mindful Miles', eyebrow: 'Flagship Community', desc: 'Weekly walk and talk sessions in the beautiful TW countryside. A safe space to connect, share, and enjoy the outdoors. No pace, no pressure � just presence.' },
    { id: 'tw-ramblers', name: 'TW Ramblers', eyebrow: 'Partner Community', desc: 'Join us for long-distance walks and rigorous hiking challenges across Kent and Sussex.' },
    { id: 'a-z-challenge', name: 'more A-Z Challenge', eyebrow: 'Flagship Community', desc: 'Complete running routes from A to Z across the borough. All abilities welcome, but we love a good challenge and a post-run pint.' },
    { id: 'tw-parkrun', name: 'TW Parkrun', eyebrow: 'Partner Community', desc: 'Free, weekly, timed 5k event every Saturday morning at Dunorlan Park.' },
    { id: 'tw-yoga-collective', name: 'TW Yoga Collective', eyebrow: 'Partner Community', desc: 'Mental wellness and meditation. Mind, body, purpose. Join our collective for weekly flows and breathwork.' },
    { id: 'kent-adventures', name: 'Kent Adventures', eyebrow: 'Partner Community', desc: 'Explore the unknown. Kayaking, climbing, and outdoor adventures for thrill-seekers.' },
    { id: 'tw-good-neighbours', name: 'TW Good Neighbours', eyebrow: 'Partner Community', desc: 'Give back, grow forward. A community dedicated to local volunteering and making a positive impact.' },
    { id: 'tw-interfaith-network', name: 'TW Interfaith Network', eyebrow: 'Partner Community', desc: 'Break bread, build bonds. A space for diverse faiths to gather, share, and build community.' },
    { id: 'tw-creative-collective', name: 'TW Creative Collective', eyebrow: 'Partner Community', desc: 'Create, express, connect. A vibrant community of artists, designers, and makers collaborating on local projects.' }
];

const template = fs.readFileSync('yentw.html', 'utf8');

for (const c of communities) {
    let content = template.replace(/Young Entrepreneurs<br>Network <em>Tunbridge Wells\.<\/em>/g, c.name.replace(' ', '<br><em>') + '.</em>');
    content = content.replace(/Flagship Venture/g, c.eyebrow);
    content = content.replace(/<title>.*?<\/title>/g, '<title>' + c.name + ' | more</title>');
    
    // Replace the main description paragraph
    content = content.replace(/YENTW is the entrepreneurship community within.*?support it\./g, c.desc);
    
    fs.writeFileSync(c.id + '.html', content);
}

// Now update discover.html to link to these pages!
let discover = fs.readFileSync('discover.html', 'utf8');

communities.forEach(c => {
    // We will do a robust replacement to find the specific community card and replace its hrefs
    // Find the block starting with <h3 class="card-name"></h3> up to <a href="#" class="btn btn-outline btn-sm">View Details</a>
    
    const regex = new RegExp('(<h3 class="card-name">' + c.name.replace(/\./g, '\\\\.') + '</h3>[\\\\s\\\\S]*?<a href=")#[^"]*(" class="btn btn-primary btn-sm">Join Community</a>[\\\\s\\\\S]*?<a href=")#[^"]*(" class="btn btn-outline btn-sm">View Details</a>)', 'g');
    
    discover = discover.replace(regex, '\/index.html\' + c.id + '.html\');
});

fs.writeFileSync('discover.html', discover);
console.log('Pages generated!');
