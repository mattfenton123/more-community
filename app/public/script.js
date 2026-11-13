// =========================================
// MORE COMMUNITY — ENHANCED INTERACTIONS
// =========================================

// --- Sticky Navbar ---
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// --- Mobile Menu Toggle ---
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const menuOverlay = document.getElementById('menuOverlay');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
        if (menuOverlay) menuOverlay.classList.toggle('active');
        document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    if (menuOverlay) {
        menuOverlay.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('open');
            menuOverlay.classList.remove('active');
            document.body.style.overflow = '';
        });
    }

    // Close mobile menu on link click (except dropdown toggle)
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 992) {
                // If it's the dropdown toggle, don't close the menu
                if (link.closest('.nav-dropdown') && link.nextElementSibling && link.nextElementSibling.classList.contains('nav-dropdown-menu')) {
                    return;
                }
                menuToggle.classList.remove('active');
                navLinks.classList.remove('open');
                if (menuOverlay) menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });
}

// --- Mobile dropdown toggle ---
const venturesToggle = document.getElementById('venturesDropdownToggle');
if (venturesToggle) {
    venturesToggle.addEventListener('click', (e) => {
        if (window.innerWidth <= 992) {
            e.preventDefault();
            const dropdown = venturesToggle.closest('.nav-dropdown');
            if (dropdown) {
                dropdown.classList.toggle('mobile-open');
            }
        }
    });
}

// --- Scroll Reveal (Intersection Observer) ---
const revealElements = document.querySelectorAll('.scroll-reveal');

const revealCallback = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        }
    });
};

const revealObserver = new IntersectionObserver(revealCallback, {
    root: null,
    rootMargin: '0px',
    threshold: 0.12
});

revealElements.forEach(el => {
    revealObserver.observe(el);
});

// --- Counter Animation ---
const counters = document.querySelectorAll('[data-count]');

const animateCounter = (el) => {
    const target = parseInt(el.getAttribute('data-count'));
    const duration = 2000; // ms
    const start = performance.now();
    const startVal = 0;

    const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(startVal + (target - startVal) * eased);

        el.textContent = current.toLocaleString() + (target >= 100 ? '+' : '+');

        if (progress < 1) {
            requestAnimationFrame(tick);
        } else {
            el.textContent = target.toLocaleString() + '+';
        }
    };

    requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

counters.forEach(el => counterObserver.observe(el));

// --- Hero Particles ---
const particlesContainer = document.getElementById('heroParticles');

if (particlesContainer) {
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (10 + Math.random() * 15) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.opacity = (0.1 + Math.random() * 0.4);
        particle.style.width = particle.style.height = (2 + Math.random() * 3) + 'px';
        particlesContainer.appendChild(particle);
    }
}

// --- Smooth Scrolling for Anchor Links ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            e.preventDefault();
            const navHeight = navbar ? navbar.offsetHeight : 0;
            const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - navHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// --- Parallax on Hero (subtle) ---
const heroContent = document.querySelector('.hero-content');
const heroMesh = document.querySelector('.hero-mesh');

if (heroContent && heroMesh) {
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight) {
            const factor = scrolled * 0.3;
            heroContent.style.transform = `translateY(${factor}px)`;
            heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.6;
            heroMesh.style.transform = `translateY(${scrolled * 0.15}px)`;
        }
    }, { passive: true });
}

// --- Email notify button ---
const notifyBtn = document.getElementById('notifyBtn');
const emailInput = document.getElementById('emailInput');

if (notifyBtn && emailInput) {
    notifyBtn.addEventListener('click', () => {
        const email = emailInput.value.trim();
        if (email && email.includes('@')) {
            notifyBtn.textContent = '✓ Subscribed!';
            notifyBtn.style.background = 'var(--teal-500)';
            emailInput.value = '';
            setTimeout(() => {
                notifyBtn.textContent = 'Notify Me';
                notifyBtn.style.background = '';
            }, 3000);
        } else {
            emailInput.style.borderColor = '#ef4444';
            setTimeout(() => {
                emailInput.style.borderColor = '';
            }, 2000);
        }
    });
}


// --- Live Homepage Events Hydrator ---
(function () {
    var grid = document.getElementById('liveEventsGrid');
    var heroCard = document.getElementById('heroEventCard');
    var phoneStream = document.getElementById('phoneStream');
    if (!grid && !heroCard && !phoneStream) return;

    function safeUrl(u, fallback) {
        if (typeof u === 'string' && (u.startsWith('/') || u.startsWith('https://') || u.startsWith('http://'))) {
            return u;
        }
        return fallback;
    }

    function formatShortDate(dateStr) {
        if (!dateStr) return { dow: 'UPCOMING', dayMon: '', timeLabel: '' };
        var d = new Date(dateStr + 'T12:00:00');
        if (isNaN(d.getTime())) return { dow: dateStr, dayMon: '', timeLabel: '' };
        var dows = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        var mons = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
            dow: dows[d.getDay()] + ' ' + d.getDate() + ' ' + mons[d.getMonth()],
            dayMon: d.getDate() + ' ' + mons[d.getMonth()]
        };
    }

    function formatPrice(price) {
        if (!price || Number(price) <= 0) return 'Free to Join';
        return '£' + Number(price).toFixed(price % 1 === 0 ? 0 : 2) + ' Ticket';
    }

    function formatSpots(ev) {
        var count = ev.attendeesCount || 0;
        if (ev.maxCapacity) {
            var left = Math.max(0, ev.maxCapacity - count);
            return count + ' going • ' + left + ' spots open';
        }
        return count + ' going • Open RSVP';
    }

    function iconNode(name, size) {
        if (window.MORE_ICONS && typeof window.MORE_ICONS.makeSvg === 'function') {
            return window.MORE_ICONS.makeSvg(name, size || 14);
        }
        return document.createTextNode('');
    }

    function hydrateHero(events, totalComms) {
        var statusEl = document.getElementById('liveNetworkStatus');
        if (statusEl && totalComms) {
            statusEl.textContent = totalComms + ' Verified Local Communities Active - Free Core Tier';
        }
        if (!heroCard) return;
        if (!events || events.length === 0) {
            document.getElementById('heroEventBadge').textContent = 'Live Community Calendar';
            document.getElementById('heroEventTitle').textContent = 'Upcoming Events & Walks';
            document.getElementById('heroEventLocation').textContent = 'Tunbridge Wells, Kent & Sussex';
            document.getElementById('heroEventTimeInfo').textContent = 'Check the events board for new host drops';
            document.getElementById('heroEventSummary').textContent = 'Start or discover a local club in under 2 minutes';
            document.getElementById('heroEventAction').href = '/events';
            document.getElementById('heroEventAction').textContent = 'Open Calendar →';
            return;
        }
        var ev = events[0];
        var dt = formatShortDate(ev.date);
        document.getElementById('heroEventBadge').textContent = 'Next Up • ' + dt.dow + (ev.time ? ' • ' + ev.time : '');
        document.getElementById('heroEventTown').textContent = ev.category || 'Local Gathering';
        document.getElementById('heroEventTitle').textContent = ev.title || 'Community Event';
        document.getElementById('heroEventHost').textContent = 'By ' + (ev.communityName || 'Local Community');
        var vEl = document.getElementById('heroEventVerified');
        if (vEl) vEl.hidden = !ev.communityVerified;
        document.getElementById('heroEventLocation').textContent = ev.location || 'Local Venue';
        document.getElementById('heroEventTimeInfo').textContent = (dt.dow || ev.date) + (ev.time ? ' at ' + ev.time : '');
        document.getElementById('heroEventSummary').textContent = ev.summary || 'Open to local community members';

        var carRow = document.getElementById('heroCarpoolRow');
        if (carRow) carRow.hidden = !ev.allowCarpool;

        var attEl = document.getElementById('heroEventAttendees');
        if (attEl) {
            attEl.replaceChildren();
            var b = document.createElement('strong');
            b.textContent = (ev.attendeesCount || 0) + ' going';
            var sm = document.createElement('small');
            sm.style.color = 'var(--teal-300)';
            sm.textContent = ev.ticketPrice > 0 ? '£' + ev.ticketPrice + ' Ticket' : 'Free RSVP';
            attEl.appendChild(b);
            attEl.appendChild(document.createElement('br'));
            attEl.appendChild(sm);
        }
        var act = document.getElementById('heroEventAction');
        if (act) {
            act.href = safeUrl(ev.url, '/events');
            act.textContent = 'View Event →';
        }
    }

    function renderGrid(events) {
        if (!grid) return;
        grid.replaceChildren();

        if (!events || events.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'live-empty-card';
            var h = document.createElement('h3');
            h.textContent = 'New upcoming sessions being added soon';
            var p = document.createElement('p');
            p.textContent = 'Our community leaders schedule gatherings throughout each week. Browse active communities or start your own club.';
            var a = document.createElement('a');
            a.className = 'btn btn-primary';
            a.href = '/discover';
            a.textContent = 'Browse Communities →';
            empty.appendChild(h);
            empty.appendChild(p);
            empty.appendChild(a);
            grid.appendChild(empty);
            return;
        }

        events.forEach(function (ev) {
            var dt = formatShortDate(ev.date);
            var link = document.createElement('a');
            link.href = safeUrl(ev.url, '/events');
            link.className = 'live-event-card';

            var media = document.createElement('div');
            media.className = 'live-card-media';
            var img = document.createElement('img');
            img.src = safeUrl(ev.image, 'images/hero.png');
            img.alt = ev.title || 'Community Event';
            img.loading = 'lazy';
            media.appendChild(img);

            var badge = document.createElement('div');
            badge.className = 'live-card-date-badge';
            var daySpan = document.createElement('span');
            daySpan.className = 'date-badge-day';
            daySpan.textContent = dt.dow;
            var timeSpan = document.createElement('span');
            timeSpan.className = 'date-badge-time';
            timeSpan.textContent = ev.time || 'Scheduled';
            badge.appendChild(daySpan);
            badge.appendChild(timeSpan);
            media.appendChild(badge);

            var tag = document.createElement('span');
            tag.className = 'live-card-tag';
            tag.textContent = ev.category || 'Local Gathering';
            media.appendChild(tag);
            link.appendChild(media);

            var body = document.createElement('div');
            body.className = 'live-card-body';

            var title = document.createElement('h3');
            title.className = 'live-card-title';
            title.textContent = ev.title || 'Community Event';
            body.appendChild(title);

            var comm = document.createElement('p');
            comm.className = 'live-card-community';
            comm.textContent = ev.communityName || 'Local Community';
            body.appendChild(comm);

            var meta = document.createElement('div');
            meta.className = 'live-card-meta';

            var locItem = document.createElement('div');
            locItem.className = 'live-meta-item';
            locItem.appendChild(iconNode('pin', 14));
            locItem.appendChild(document.createTextNode(' ' + (ev.location || 'Local Venue')));
            meta.appendChild(locItem);

            var timeItem = document.createElement('div');
            timeItem.className = 'live-meta-item';
            timeItem.appendChild(iconNode('clock', 14));
            timeItem.appendChild(document.createTextNode(' ' + dt.dow + (ev.time ? ' • ' + ev.time : '')));
            meta.appendChild(timeItem);
            body.appendChild(meta);

            var badges = document.createElement('div');
            badges.className = 'live-card-badges';

            var priceB = document.createElement('span');
            priceB.className = 'event-micro-badge badge-free';
            priceB.textContent = formatPrice(ev.ticketPrice);
            badges.appendChild(priceB);

            if (ev.allowCarpool) {
                var carB = document.createElement('span');
                carB.className = 'event-micro-badge badge-carpool';
                carB.appendChild(iconNode('car', 13));
                carB.appendChild(document.createTextNode(' Carpool Enabled'));
                badges.appendChild(carB);
            }
            body.appendChild(badges);

            var footer = document.createElement('div');
            footer.className = 'live-card-footer';
            var spots = document.createElement('span');
            spots.className = 'live-spots';
            spots.textContent = formatSpots(ev);
            var rsvpLink = document.createElement('span');
            rsvpLink.className = 'live-rsvp-link';
            rsvpLink.textContent = 'View →';
            footer.appendChild(spots);
            footer.appendChild(rsvpLink);
            body.appendChild(footer);

            link.appendChild(body);
            grid.appendChild(link);
        });
    }

    function renderPhone(events) {
        if (!phoneStream) return;
        phoneStream.replaceChildren();
        if (!events || events.length === 0) {
            var emptyItem = document.createElement('div');
            emptyItem.className = 'phone-event-item';
            emptyItem.style.padding = '14px';
            var et = document.createElement('div');
            et.className = 'phone-event-title';
            et.textContent = 'Explore Live Communities';
            var eh = document.createElement('div');
            eh.className = 'phone-event-host';
            eh.textContent = 'Tap to browse groups & upcoming events';
            emptyItem.appendChild(et);
            emptyItem.appendChild(eh);
            phoneStream.appendChild(emptyItem);
            return;
        }
        events.slice(0, 2).forEach(function (ev, idx) {
            var dt = formatShortDate(ev.date);
            var item = document.createElement('div');
            item.className = 'phone-event-item';

            var hero = document.createElement('div');
            hero.className = 'phone-event-hero';
            if (idx > 0) hero.style.height = '60px';
            var img = document.createElement('img');
            img.src = safeUrl(ev.image, 'images/hero.png');
            img.alt = ev.title || 'Event';
            hero.appendChild(img);
            var hb = document.createElement('span');
            hb.className = 'phone-event-hero-badge';
            hb.textContent = dt.dow + (ev.time ? ' ' + ev.time : '');
            hero.appendChild(hb);
            item.appendChild(hero);

            var details = document.createElement('div');
            details.className = 'phone-event-details';
            if (idx > 0) details.style.padding = '6px 10px';
            var t = document.createElement('div');
            t.className = 'phone-event-title';
            t.textContent = ev.title || 'Community Event';
            details.appendChild(t);
            var h = document.createElement('div');
            h.className = 'phone-event-host';
            h.textContent = ev.communityName || 'Local Community';
            details.appendChild(h);

            if (idx === 0) {
                var m = document.createElement('div');
                m.className = 'phone-event-meta';
                var locSpan = document.createElement('span');
                locSpan.textContent = ev.location || 'Local Venue';
                m.appendChild(locSpan);
                details.appendChild(m);
            }

            var bar = document.createElement('div');
            bar.className = 'phone-event-action-bar';
            var cnt = document.createElement('span');
            cnt.className = 'phone-attendee-count';
            cnt.textContent = formatSpots(ev);
            var btn = document.createElement('span');
            btn.className = 'phone-event-btn';
            btn.textContent = ev.ticketPrice > 0 ? '£' + ev.ticketPrice : 'RSVP';
            bar.appendChild(cnt);
            bar.appendChild(btn);
            details.appendChild(bar);

            item.appendChild(details);
            phoneStream.appendChild(item);
        });
    }

    fetch('/api/events/upcoming?limit=3')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var evs = Array.isArray(data && data.events) ? data.events : [];
            hydrateHero(evs, data && data.totalCommunities);
            renderGrid(evs);
            renderPhone(evs);
        })
        .catch(function () {
            hydrateHero([], null);
            renderGrid([]);
            renderPhone([]);
        });
})();
