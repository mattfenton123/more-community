const fs = require('fs');
let discover = fs.readFileSync('discover.html', 'utf8');

const mapping = [
    { name: 'more Mindful Miles', url: 'mindful-miles.html' },
    { name: 'TW Ramblers', url: 'tw-ramblers.html' },
    { name: 'more A-Z Challenge', url: 'a-z-challenge.html' },
    { name: 'TW Parkrun', url: 'tw-parkrun.html' },
    { name: 'TW Yoga Collective', url: 'tw-yoga-collective.html' },
    { name: 'Kent Adventures', url: 'kent-adventures.html' },
    { name: 'TW Good Neighbours', url: 'tw-good-neighbours.html' },
    { name: 'TW Interfaith Network', url: 'tw-interfaith-network.html' },
    { name: 'TW Creative Collective', url: 'tw-creative-collective.html' }
];

mapping.forEach(m => {
    // We split by the card name to find the block
    let parts = discover.split('<h3 class="card-name">' + m.name + '</h3>');
    if (parts.length > 1) {
        let block = parts[1];
        // Replace the first 'href="#"' with 'href="portal/index.html"'
        block = block.replace('href="#"', 'href="portal/index.html"');
        // Replace the second 'href="#"' with the specific url
        block = block.replace('href="#"', 'href="' + m.url + '"');
        parts[1] = block;
        discover = parts.join('<h3 class="card-name">' + m.name + '</h3>');
    }
});

fs.writeFileSync('discover.html', discover);
console.log('Links updated!');
