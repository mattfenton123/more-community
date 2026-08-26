const fs = require('fs');

const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{name}} | more</title>
    <meta name="description" content="{{desc}}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400..800&family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css?v=86">
    <link rel="stylesheet" href="pages.css?v=3">
</head>
<body class="{{themeClass}}">
    <div class="menu-overlay" id="menuOverlay"></div>
    <nav id="navbar" class="navbar scrolled">
        <div class="nav-container">
            <a href="index.html" class="nav-brand"><img src="images/logo.png" alt="more community"></a>
            <ul class="nav-links" id="navLinks">
                <li><a href="discover.html">Discover</a></li>
                <li><a href="leaders.html">For Leaders</a></li>
                <li><a href="about.html">Our Story</a></li>
                <li><a href="tunbridge-wells.html">Tunbridge Wells</a></li>
                <li class="nav-dropdown"><a href="#" id="venturesDropdownToggle">Ventures ▾</a><div class="nav-dropdown-menu"><a href="yentw.html">YENTW</a><a href="accelerator.html">Accelerator</a><a href="hackathons.html">Hackathons</a><a href="sponsorship.html">Sponsorship</a></div></li>
                <li><a href="index.html#join" class="btn-nav">Join the Movement</a></li>
            </ul>
            <button class="menu-toggle" id="menuToggle" aria-label="Toggle menu"><span></span><span></span><span></span></button>
        </div>
    </nav>

    <!-- Immersive Hero -->
    <section class="page-hero-immersive" style="background-image: url('{{heroImage}}');">
        <div class="container">
            <span class="microsite-eyebrow">{{eyebrow}}</span>
            <h1 class="microsite-title">{{formattedName}}</h1>
            <p class="microsite-desc">{{desc}}</p>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <a href="{{button1Link}}" class="btn btn-theme">{{button1Text}}</a>
                <a href="{{button2Link}}" class="btn btn-outline">{{button2Text}}</a>
            </div>
        </div>
    </section>

    <!-- Content Expansion: Vibe Check & Host -->
    <section class="section" style="padding-top: 5rem;">
        <div class="container">
            <div class="microsite-split-section scroll-reveal">
                <!-- Left: Vibe & Details -->
                <div>
                    <h2 class="editorial-title" style="font-size: 3rem; margin-bottom: 1rem;">Is this for <em>you?</em></h2>
                    <p style="color: var(--slate-300); font-size: 1.1rem; line-height: 1.6;">{{vibeIntro}}</p>
                    <ul class="microsite-vibe-list">
                        {{vibeHTML}}
                    </ul>
                    
                    <div style="margin-top: 3rem; padding: 2rem; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-lg);">
                        <h3 style="font-family: var(--font-heading); margin-bottom: 1rem;">Typical Gathering</h3>
                        <p style="color: var(--slate-300); margin-bottom: 0.5rem;"><strong>When:</strong> {{scheduleWhen}}</p>
                        <p style="color: var(--slate-300); margin-bottom: 0.5rem;"><strong>Where:</strong> {{scheduleWhere}}</p>
                        <p style="color: var(--slate-300); margin-bottom: 0;"><strong>What:</strong> {{scheduleWhat}}</p>
                    </div>
                </div>

                <!-- Right: Host Profile -->
                <div>
                    <div class="microsite-host-card">
                        <img src="{{hostImage}}" alt="Community Host" class="microsite-host-img">
                        <h3 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 0.5rem;">Meet {{hostName}}</h3>
                        <p style="color: var(--theme-primary); font-weight: 600; margin-bottom: 1.5rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;">Community Host</p>
                        <p style="color: var(--slate-300); font-style: italic; line-height: 1.6;">"{{hostQuote}}"</p>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Mission Statement -->
    <section class="microsite-mission-block" style="padding-top: 0;">
        <div class="scroll-reveal">
            <p>"{{missionStatement}}"</p>
        </div>
    </section>

    <!-- Gallery Image -->
    <section class="section" style="padding-top: 0; padding-bottom: 2rem;">
        <div class="container">
            <img src="{{galleryImage}}" alt="Community in action" class="microsite-gallery-img scroll-reveal">
        </div>
    </section>

    <!-- What We Offer -->
    <section class="section" style="padding-top: 0;">
        <div class="container">
            <div class="microsite-value-grid scroll-reveal">
                {{offersHTML}}
            </div>
        </div>
    </section>

    <!-- CTA -->
    <section class="section cta-final" style="margin-top: 4rem;">
        <div class="cta-final-bg"><img src="images/hero-home.jpg" alt="" style="object-position: top;"></div>
        <div class="cta-final-overlay"></div>
        <div class="cta-final-content scroll-reveal">
            <h2>Ready to find your<br><em>people</em>?</h2>
            <p>Join the movement and connect with others in Tunbridge Wells.</p>
            <div class="cta-final-actions">
                <a href="portal/" class="btn btn-theme">Join {{name}}</a>
                <a href="discover.html" class="btn btn-ghost">Explore More</a>
            </div>
        </div>
    </section>

    <footer class="site-footer">
        <div class="container">
            <div class="footer-bottom-bar">
                <p>&copy; 2026 more community</p>
                <p class="footer-motto">do more >> experience more >> achieve more >></p>
            </div>
        </div>
    </footer>
    <script src="script.js?v=22"></script>
</body>
</html>`;

const communities = [
    {
        id: 'mindful-miles',
        name: 'more Mindful Miles',
        formattedName: 'more<br><em>Mindful Miles.</em>',
        themeClass: 'microsite-theme-teal',
        heroImage: 'images/heroes/mindful-miles.png',
        eyebrow: 'Flagship Community',
        desc: 'Weekly walk and talk sessions in the beautiful Tunbridge Wells countryside. A safe space to connect, share, and enjoy the outdoors. No pace, no pressure — just presence.',
        vibeIntro: 'Mindful Miles was created for those who want to get out of the house, breathe some fresh air, and have genuine conversations without the pressure of a workout.',
        vibeCheck: ['All fitness levels welcome', 'Friendly dogs encouraged', 'Focus on mental health & chat'],
        scheduleWhen: 'Every Sunday morning at 10:00 AM',
        scheduleWhere: 'Various trailheads (usually starting near Dunorlan Park)',
        scheduleWhat: 'A gentle 3-5km loop followed by coffee and pastries.',
        hostImage: 'images/hosts/mindful-miles.png',
        hostName: 'Sarah',
        hostQuote: "I started Mindful Miles because I realized how lonely remote work can be. Walking side-by-side takes the pressure off networking. I can't wait to walk with you!",
        galleryImage: 'images/gallery/mindful-miles.png',
        missionStatement: "Walking isn't just about reaching a destination. It's about the conversations, the clarity, and the connections we make along the way.",
        button1Text: 'Join Next Walk', button1Link: '/portal/community/mindful-miles',
        button2Text: 'View Routes', button2Link: '#',
        offers: [
            { icon: '🥾', title: 'Guided Routes', desc: 'From Dunorlan Park to High Rocks, we explore the best trails the borough has to offer.' },
            { icon: '💬', title: 'Walk & Talk', desc: 'No pressure networking. Just honest conversations and good company in the fresh air.' },
            { icon: '🐕', title: 'Dogs Welcome', desc: 'Furry friends are always welcome on our weekend trail loops.' }
        ]
    },
    {
        id: 'tw-ramblers',
        name: 'TW Ramblers',
        formattedName: 'TW<br><em>Ramblers.</em>',
        themeClass: 'microsite-theme-green',
        heroImage: 'images/heroes/tw-ramblers.png',
        eyebrow: 'Partner Community',
        desc: 'Join us for long-distance walks and rigorous hiking challenges across Kent and Sussex. For those who want to push their stamina.',
        vibeIntro: 'For the early risers and the distance seekers. If you own a good pair of waterproof boots and love a sweeping valley view, you belong here.',
        vibeCheck: ['10km+ distances at a brisk pace', 'Mud, hills, and unpredictable weather', 'Pub lunch always included'],
        scheduleWhen: 'Alternating Saturdays at 8:00 AM',
        scheduleWhere: 'High Weald AONB',
        scheduleWhat: 'A 15km challenging hike through the beautiful Kent countryside, ending at a historic country pub.',
        hostImage: 'images/hosts/tw-ramblers.png',
        hostName: 'David',
        hostQuote: 'There is nothing quite like earning your pint after climbing a steep Kentish hill in the rain. We are a hardy bunch, but incredibly welcoming.',
        galleryImage: 'images/gallery/tw-ramblers.png',
        missionStatement: 'To explore further, climb higher, and experience the rugged beauty of the high Weald with those who share the same drive.',
        button1Text: 'View Calendar', button1Link: '/portal/community/tw-ramblers',
        button2Text: 'Our Gear List', button2Link: '#',
        offers: [
            { icon: '⛰️', title: 'Long-Distance Hikes', desc: '10km to 30km routes taking in the high Weald and coastal paths.' },
            { icon: '🧭', title: 'Navigation Skills', desc: 'Learn to map read and navigate the countryside confidently.' },
            { icon: '🍻', title: 'Pub Stops', desc: 'Because every good hike deserves a great pub at the end.' }
        ]
    },
    {
        id: 'a-z-challenge',
        name: 'more A-Z Challenge',
        formattedName: 'more<br><em>A-Z Challenge.</em>',
        themeClass: 'microsite-theme-amber',
        heroImage: 'images/heroes/a-z-challenge.png',
        eyebrow: 'Flagship Community',
        desc: 'Complete running routes from A to Z across the borough. All abilities welcome, but we love a good challenge and a post-run pint.',
        vibeIntro: "We are gamifying fitness. It doesn't matter how fast you run, what matters is checking off every letter of the alphabet across Tunbridge Wells.",
        vibeCheck: ['Pacing groups for all speeds', 'Gamified milestone tracking', 'High-energy social atmosphere'],
        scheduleWhen: 'Every Tuesday evening at 6:30 PM',
        scheduleWhere: 'Starting at The Pantiles',
        scheduleWhat: 'A 5k to 10k route (depending on the letter of the week) followed by a pub trip for a well-earned drink.',
        hostImage: 'images/hosts/a-z-challenge.png',
        hostName: 'Chloe',
        hostQuote: "Fitness shouldn't be a chore. I started this challenge to trick myself into running by making it a game, and the community that built around it is incredible.",
        galleryImage: 'images/gallery/a-z-challenge.png',
        missionStatement: 'We believe fitness should be an adventure. Turning the streets of our town into a massive playground for runners.',
        button1Text: 'Start Running', button1Link: '/portal/community/a-z-challenge',
        button2Text: 'Leaderboard', button2Link: '#',
        offers: [
            { icon: '🏃‍♂️', title: 'A-Z Routes', desc: '26 unique routes around TW, starting with Ashdown and ending with Z...' },
            { icon: '🏅', title: 'Milestones', desc: 'Earn badges and rewards for every 5 routes you complete.' },
            { icon: '🤝', title: 'Pacing Groups', desc: 'Whether you run 5-minute kilometers or 8-minute kilometers, we have a group for you.' }
        ]
    },
    {
        id: 'tw-parkrun',
        name: 'TW Parkrun',
        formattedName: 'TW<br><em>Parkrun.</em>',
        themeClass: 'microsite-theme-amber',
        heroImage: 'images/heroes/tw-parkrun.png',
        eyebrow: 'Partner Community',
        desc: 'Free, weekly, timed 5k event every Saturday morning at Dunorlan Park. Walk, jog, run, volunteer or spectate.',
        vibeIntro: 'The most positive way to start your weekend. Hundreds of locals coming together purely for the joy of movement and community spirit.',
        vibeCheck: ['Completely free forever', 'Walkers, joggers, and sprinters welcome', 'Family and buggy friendly'],
        scheduleWhen: 'Every Saturday at 9:00 AM sharp',
        scheduleWhere: 'Dunorlan Park Events Field',
        scheduleWhat: 'A timed 5k loop around the lake, fully supported by enthusiastic volunteers.',
        hostImage: 'images/hosts/tw-parkrun.png',
        hostName: 'Mark',
        hostQuote: "I've been volunteering here for 5 years. Watching people achieve their first 5k and seeing the community grow is the highlight of my week.",
        galleryImage: 'images/gallery/tw-parkrun.png',
        missionStatement: 'A free, community-driven 5k where everyone is celebrated, whether you finish first or last.',
        button1Text: 'Get Barcode', button1Link: '#',
        button2Text: 'Volunteer', button2Link: '#',
        offers: [
            { icon: '⏱️', title: 'Timed 5K', desc: 'Track your personal bests every week on the beautiful Dunorlan lake loop.' },
            { icon: '👨‍👩‍👧‍👦', title: 'Family Friendly', desc: 'Buggies, kids, and walkers are all celebrated here.' },
            { icon: '☕', title: 'Post-Run Coffee', desc: 'Join us in the cafe afterwards for a well-earned coffee and chat.' }
        ]
    },
    {
        id: 'tw-yoga-collective',
        name: 'TW Yoga Collective',
        formattedName: 'TW<br><em>Yoga Collective.</em>',
        themeClass: 'microsite-theme-teal',
        heroImage: 'images/heroes/tw-yoga-collective.png',
        eyebrow: 'Partner Community',
        desc: 'Mental wellness and meditation. Mind, body, purpose. Join our collective for weekly flows and breathwork in serene locations.',
        vibeIntro: 'A sanctuary in the city. We welcome complete beginners and seasoned yogis to breathe, stretch, and find their center together.',
        vibeCheck: ['Vinyasa, Yin, and Restorative', 'Focus on breathwork and mindfulness', 'Bring your own mat'],
        scheduleWhen: 'Wednesdays at 7:00 PM & Sundays at 8:00 AM',
        scheduleWhere: 'The Common (Summer) / Local Hall (Winter)',
        scheduleWhat: 'A 60-minute guided flow focusing on mobility, strength, and deep relaxation.',
        hostImage: 'images/hosts/tw-yoga-collective.png',
        hostName: 'Emma',
        hostQuote: "Yoga isn't about touching your toes, it's about what you learn on the way down. Our collective is a safe space to reconnect with yourself.",
        galleryImage: 'images/gallery/tw-yoga-collective.png',
        missionStatement: 'Finding stillness in a fast-moving world. We gather to ground ourselves, breathe intentionally, and move with purpose.',
        button1Text: 'Book a Mat', button1Link: '/portal/community/tw-yoga-collective',
        button2Text: 'Meet Teachers', button2Link: '#',
        offers: [
            { icon: '🧘‍♀️', title: 'Vinyasa & Yin', desc: 'Dynamic flows to build strength, and deep holds to release tension.' },
            { icon: '🌅', title: 'Sunrise Sessions', desc: 'Start your day right with outdoor summer sessions on the common.' },
            { icon: '🪷', title: 'Breathwork', desc: 'Dedicated workshops focusing purely on pranayama and nervous system regulation.' }
        ]
    },
    {
        id: 'kent-adventures',
        name: 'Kent Adventures',
        formattedName: 'Kent<br><em>Adventures.</em>',
        themeClass: 'microsite-theme-blue',
        heroImage: 'images/heroes/kent-adventures.png',
        eyebrow: 'Partner Community',
        desc: 'Explore the unknown. Kayaking, climbing, and outdoor adventures for thrill-seekers looking to escape the 9-to-5.',
        vibeIntro: 'For those who get cabin fever on the weekends. We organize logistics for outdoor sports so you can just show up and adventure.',
        vibeCheck: ['Adrenaline and outdoor sports', 'Equipment rental available', 'Weekend getaways'],
        scheduleWhen: 'Monthly weekend expeditions',
        scheduleWhere: 'Various (Medway River, Harrisons Rocks, etc.)',
        scheduleWhat: 'A full day of kayaking or outdoor bouldering with qualified instructors and an amazing group.',
        hostImage: 'images/hosts/kent-adventures.png',
        hostName: 'Tom',
        hostQuote: 'I hated spending my weekends on the sofa. I started organizing these trips to find other people who wanted to get their hands dirty and try new things.',
        galleryImage: 'images/gallery/kent-adventures.png',
        missionStatement: 'Nature is meant to be challenged. We provide the equipment, the expertise, and the community to get you out of your comfort zone.',
        button1Text: 'See Upcoming', button1Link: '/portal/community/kent-adventures',
        button2Text: 'Gallery', button2Link: '#',
        offers: [
            { icon: '🛶', title: 'River Kayaking', desc: 'Weekend paddles down the Medway and surrounding waterways.' },
            { icon: '🧗‍♂️', title: 'Bouldering', desc: 'Indoor climbing meets and outdoor trips to Harrisons Rocks.' },
            { icon: '🏕️', title: 'Wild Camping', desc: 'Learn survival skills and sleep under the stars.' }
        ]
    },
    {
        id: 'tw-good-neighbours',
        name: 'TW Good Neighbours',
        formattedName: 'TW<br><em>Good Neighbours.</em>',
        themeClass: 'microsite-theme-purple',
        heroImage: 'images/heroes/tw-good-neighbours.png',
        eyebrow: 'Partner Community',
        desc: 'Give back, grow forward. A community dedicated to local volunteering, mutual aid, and making a positive impact in our town.',
        vibeIntro: 'If you want to actively improve Tunbridge Wells and help the vulnerable members of our society, this is your home.',
        vibeCheck: ['Direct action and volunteering', 'Flexible commitment hours', 'High impact on the local area'],
        scheduleWhen: 'Weekly drop-in sessions and monthly drives',
        scheduleWhere: 'TN2 Community Centre',
        scheduleWhat: 'Sorting donations at the food bank, or organizing community litter picks around the town.',
        hostImage: 'images/hosts/tw-good-neighbours.png',
        hostName: 'Margaret',
        hostQuote: "A town is defined by how it treats its most vulnerable. Volunteering here isn't just charity, it's building true neighborhood resilience.",
        galleryImage: 'images/gallery/tw-good-neighbours.png',
        missionStatement: 'A town is only as strong as its willingness to help those in need. We are neighbors helping neighbors.',
        button1Text: 'Volunteer', button1Link: '/portal/community/tw-good-neighbours',
        button2Text: 'Request Help', button2Link: '#',
        offers: [
            { icon: '🛍️', title: 'Errand Running', desc: 'Assisting elderly residents with shopping and prescription collections.' },
            { icon: '🧹', title: 'Community Cleanups', desc: 'Monthly litter picking drives to keep our parks pristine.' },
            { icon: '🍲', title: 'Food Bank Support', desc: 'Organizing drives and volunteering time at the Nourish community food bank.' }
        ]
    },
    {
        id: 'tw-interfaith-network',
        name: 'TW Interfaith Network',
        formattedName: 'TW<br><em>Interfaith Network.</em>',
        themeClass: 'microsite-theme-amber',
        heroImage: 'images/heroes/tw-interfaith-network.png',
        eyebrow: 'Partner Community',
        desc: 'Break bread, build bonds. A space for diverse faiths and backgrounds to gather, share, and build cross-community understanding.',
        vibeIntro: 'We bring together the rich tapestry of cultures and beliefs in Tunbridge Wells through the universal language of food and dialogue.',
        vibeCheck: ['All faiths and non-faiths welcome', 'Focus on shared humanity', 'Amazing potluck dinners'],
        scheduleWhen: 'First Thursday of every month at 7:00 PM',
        scheduleWhere: 'Various community halls (rotates)',
        scheduleWhat: 'A shared multicultural feast followed by an open, respectful dialogue on a specific life topic.',
        hostImage: 'images/hosts/tw-interfaith-network.png',
        hostName: 'Tariq',
        hostQuote: 'When we sit at a table and share the food of our ancestors, the differences melt away. We realize we are all just trying to live good lives.',
        galleryImage: 'images/gallery/tw-interfaith-network.png',
        missionStatement: 'Bridging divides through shared meals, open dialogue, and a fundamental belief in our shared humanity.',
        button1Text: 'Join Dialogue', button1Link: '/portal/community/tw-interfaith-network',
        button2Text: 'Events', button2Link: '#',
        offers: [
            { icon: '🤝', title: 'Open Dialogues', desc: 'Respectful, moderated discussions on faith, culture, and shared values.' },
            { icon: '🍽️', title: 'Shared Meals', desc: 'Potluck dinners where we share dishes and stories from our heritages.' },
            { icon: '🕊️', title: 'Joint Charity', desc: 'Coming together across different beliefs to serve the less fortunate in TW.' }
        ]
    },
    {
        id: 'tw-creative-collective',
        name: 'TW Creative Collective',
        formattedName: 'TW<br><em>Creative Collective.</em>',
        themeClass: 'microsite-theme-purple',
        heroImage: 'images/heroes/tw-creative-collective.png',
        eyebrow: 'Partner Community',
        desc: 'Create, express, connect. A vibrant community of artists, designers, writers, and makers collaborating on local projects.',
        vibeIntro: 'For anyone who makes things. Whether you paint, code, write, or design, this is a space to overcome creative blocks and collaborate.',
        vibeCheck: ['Casual, messy, and creative', 'Opportunities to exhibit work', 'Skill-sharing workshops'],
        scheduleWhen: 'Every other Thursday at 6:30 PM',
        scheduleWhere: 'Local art cafes and studios',
        scheduleWhat: "Drink & Draw sessions where we socialize, sketch, and critique each other's ongoing projects.",
        hostImage: 'images/hosts/tw-creative-collective.png',
        hostName: 'Sophie',
        hostQuote: "Creating art can be incredibly isolating. I wanted to build a chaotic, wonderful space where artists could feed off each other's energy.",
        galleryImage: 'images/gallery/tw-creative-collective.png',
        missionStatement: "Creativity shouldn't happen in a vacuum. We bring artists out of their studios and into a vibrant, collaborative ecosystem.",
        button1Text: 'Join Studio', button1Link: '/portal/community/tw-creative-collective',
        button2Text: 'Exhibitions', button2Link: '#',
        offers: [
            { icon: '🎨', title: 'Drink & Draw', desc: 'Casual evening meetups to sketch, paint, and socialize over a glass of wine.' },
            { icon: '📸', title: 'Photo Walks', desc: 'Exploring the architecture and nature of TW through the lens.' },
            { icon: '🖼️', title: 'Pop-up Galleries', desc: 'Opportunities to showcase and sell your work in local cafes and spaces.' }
        ]
    },
    {
        id: 'yentw',
        name: 'YENTW',
        formattedName: 'Young Entrepreneurs<br><em>Network TW.</em>',
        themeClass: 'microsite-theme-blue',
        heroImage: 'images/heroes/yentw.png',
        eyebrow: 'Flagship Venture',
        desc: 'YENTW is the entrepreneurship community within more — connecting ambitious young builders with mentorship, resources, and each other.',
        vibeIntro: 'For the builders, founders, and operators. We are a high-ambition group focused on launching real products and scaling businesses locally.',
        vibeCheck: ['High ambition, low ego', 'Mentorship and accelerator access', 'Focus on shipping products'],
        scheduleWhen: 'Monthly Pitch Nights & Weekly Co-working',
        scheduleWhere: 'The Pantiles Innovation Hub',
        scheduleWhat: 'Co-working sessions during the week, and intense hackathons or pitch events on the weekends.',
        hostImage: 'images/hosts/yentw.png',
        hostName: 'James',
        hostQuote: 'You are the average of the 5 people you spend the most time with. YENTW is about raising that average by surrounding yourself with doers.',
        galleryImage: 'images/gallery/yentw.png',
        missionStatement: "We don't just talk about entrepreneurship. We build it, fund it, and support it. Together.",
        button1Text: 'Join the Accelerator', button1Link: 'accelerator.html',
        button2Text: 'Upcoming Hackathons', button2Link: 'hackathons.html',
        offers: [
            { icon: '📈', title: 'Expert Mentorship', desc: 'One-to-one guidance from successful local entrepreneurs and industry leaders.' },
            { icon: '🚀', title: 'Startup Accelerator', desc: 'An intensive 12-week programme to take your idea from concept to launch.' },
            { icon: '⚡', title: 'Hackathons', desc: '48-hour challenges where small teams build real prototypes to solve local problems.' },
            { icon: '🤝', title: 'Co-Founder Matching', desc: 'Connect with complementary skills — developers, designers, marketers, operators.' },
            { icon: '🌐', title: 'Network Events', desc: 'Monthly meetups at The Pantiles. No formal networking — just ambitious people sharing ideas.' },
            { icon: '💰', title: 'Funding Access', desc: 'Pitch to local angel investors at Demo Day. We connect founders with the right people.' }
        ]
    }
];

communities.forEach(c => {
    let offersHTML = '';
    c.offers.forEach(o => {
        offersHTML += `
                <div class="microsite-glass-card">
                    <div class="lv-icon">${o.icon}</div>
                    <h4 style="font-family: var(--font-heading); font-size: 1.4rem; margin-bottom: 0.5rem;">${o.title}</h4>
                    <p style="color: var(--slate-300); line-height: 1.6;">${o.desc}</p>
                </div>`;
    });

    let vibeHTML = '';
    c.vibeCheck.forEach(v => {
        vibeHTML += `<li>${v}</li>`;
    });

    let html = template;
    html = html.replace(/{{name}}/g, c.name);
    html = html.replace(/{{formattedName}}/g, c.formattedName);
    html = html.replace(/{{themeClass}}/g, c.themeClass);
    html = html.replace(/{{heroImage}}/g, c.heroImage);
    html = html.replace(/{{eyebrow}}/g, c.eyebrow);
    html = html.replace(/{{desc}}/g, c.desc);
    
    // Content expansion
    html = html.replace(/{{vibeIntro}}/g, c.vibeIntro);
    html = html.replace(/{{vibeHTML}}/g, vibeHTML);
    html = html.replace(/{{scheduleWhen}}/g, c.scheduleWhen);
    html = html.replace(/{{scheduleWhere}}/g, c.scheduleWhere);
    html = html.replace(/{{scheduleWhat}}/g, c.scheduleWhat);
    html = html.replace(/{{hostImage}}/g, c.hostImage);
    html = html.replace(/{{hostName}}/g, c.hostName);
    html = html.replace(/{{hostQuote}}/g, c.hostQuote);
    html = html.replace(/{{galleryImage}}/g, c.galleryImage);

    html = html.replace(/{{missionStatement}}/g, c.missionStatement);
    html = html.replace(/{{button1Text}}/g, c.button1Text);
    html = html.replace(/{{button1Link}}/g, c.button1Link);
    html = html.replace(/{{button2Text}}/g, c.button2Text);
    html = html.replace(/{{button2Link}}/g, c.button2Link);
    html = html.replace(/{{offersHTML}}/g, offersHTML);

    fs.writeFileSync(c.id + '.html', html);
});

console.log('Content Expanded Microsites successfully generated!');
