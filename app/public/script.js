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
            if (window.innerWidth <= 768) {
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
        if (window.innerWidth <= 768) {
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
