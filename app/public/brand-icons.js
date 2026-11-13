(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  // Dual-tone brand geometry: uniform 1.8px stroke + translucent teal/amber wash + signature dot accent
  var ICON_SHAPES = {
    pin: '<circle cx="12" cy="10" r="7" fill="rgba(20,184,166,0.16)" stroke="none"/><path d="M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2" fill="#fbbf24" stroke="none"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="rgba(20,184,166,0.16)"/><path d="M12 7.5V12l3 2"/><circle cx="12" cy="12" r="1.4" fill="#fbbf24" stroke="none"/>',
    car: '<path d="M5 13l1.8-5h10.4L19 13" fill="rgba(20,184,166,0.16)"/><rect x="3.5" y="12.5" width="17" height="5.5" rx="2" fill="rgba(20,184,166,0.16)"/><circle cx="7.5" cy="18" r="1.5" fill="#fbbf24" stroke="currentColor"/><circle cx="16.5" cy="18" r="1.5" fill="#fbbf24" stroke="currentColor"/><path d="M5 13l1.8-5h10.4L19 13"/>',
    coffee: '<path d="M4 9h11v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z" fill="rgba(251,191,36,0.18)"/><path d="M15 10h2.2a2.3 2.3 0 0 1 0 4.6H15"/><path d="M7.5 4.5c0 1 .9 1.3.9 2.3M11 4.5c0 1 .9 1.3.9 2.3"/>',
    walk: '<circle cx="13.5" cy="5" r="2" fill="#fbbf24" stroke="currentColor"/><path d="M9 20l2-5.5 2.5 2V20M11 10.5l-2 4M11 10.5l3 2 3-1"/><path d="M6.5 14c1.2-2.2 2.8-3.5 4.5-3.5"/>',
    run: '<circle cx="15" cy="5.5" r="2" fill="#fbbf24" stroke="currentColor"/><path d="M7 19l3.2-4.5 2.6 1.5L11 20M9.5 11.5l3.5-2.5 3.2 2.2 2.3-.7"/><path d="M4 13h3.5M3 16h2.5"/>',
    breath: '<path d="M4 14c3.5-5 12.5-5 16 0-3.5 4.5-12.5 4.5-16 0z" fill="rgba(20,184,166,0.16)"/><circle cx="12" cy="14" r="2.2" fill="#fbbf24" stroke="none"/><path d="M12 4.5c1.8 2 1.8 4 0 5.5-1.8-1.5-1.8-3.5 0-5.5z"/>',
    paw: '<ellipse cx="12" cy="15.2" rx="4.2" ry="3.2" fill="rgba(20,184,166,0.22)"/><circle cx="7.2" cy="10.2" r="1.4" fill="#fbbf24"/><circle cx="10.4" cy="8.2" r="1.4" fill="#fbbf24"/><circle cx="13.8" cy="8.2" r="1.4" fill="#fbbf24"/><circle cx="16.8" cy="10.2" r="1.4" fill="#fbbf24"/>',
    trail: '<path d="M3 19l5.5-9.5 4 6 3.5-5 5 8.5H3z" fill="rgba(20,184,166,0.18)"/><circle cx="17" cy="6" r="2" fill="#fbbf24" stroke="none"/>',
    heartHand: '<path d="M12 20s-7-4.5-7-9.5A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7 3.1C19 15.5 12 20 12 20z" fill="rgba(20,184,166,0.2)"/><circle cx="12" cy="11.5" r="1.8" fill="#fbbf24" stroke="none"/>',
    wallet: '<rect x="3" y="6" width="18" height="13" rx="3" fill="rgba(20,184,166,0.16)"/><path d="M15 12.5h6v2.5h-6a1.25 1.25 0 0 1 0-2.5z" fill="#fbbf24" stroke="currentColor"/><path d="M5.5 6L16 3.5l1.5 2.5"/>',
    radar: '<circle cx="12" cy="12" r="9" fill="rgba(20,184,166,0.12)" stroke-dasharray="3 2"/><circle cx="12" cy="12" r="5" fill="rgba(20,184,166,0.16)"/><circle cx="12" cy="12" r="1.8" fill="#fbbf24" stroke="none"/><path d="M12 12l5-5"/>',
    puzzle: '<path d="M5 7h4a2 2 0 1 1 4 0h4v4a2 2 0 1 1 0 4v4H5V7z" fill="rgba(251,113,133,0.14)"/><circle cx="11" cy="13" r="1.5" fill="currentColor" stroke="none"/>',
    flame: '<path d="M12 3c2.5 3.2 6 6.2 6 10.2A6 6 0 1 1 6 13.2c0-2.2 1-4.3 2.5-6 .2 1.8 1.4 2.8 2.5 2.8C12 8.2 11.4 5 12 3z" fill="rgba(251,113,133,0.18)"/><circle cx="12" cy="14.5" r="2" fill="#fbbf24" stroke="none"/>',
    coinFund: '<circle cx="12" cy="12" r="9" fill="rgba(20,184,166,0.18)"/><path d="M14.5 9.2c-.6-.7-1.5-1.1-2.5-1.1-1.7 0-2.8 1-2.8 2.3 0 1.4 1.2 1.9 2.8 2.2 1.7.3 2.8.9 2.8 2.3 0 1.5-1.3 2.5-3 2.5-1.2 0-2.2-.4-2.8-1.2"/><path d="M12 6.5v11"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="3" fill="rgba(20,184,166,0.16)"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/><path d="M9 14.5l2 2 4-4" stroke="#fbbf24" stroke-width="2.1"/>',
    chat: '<path d="M4.5 6.5a2.5 2.5 0 0 1 2.5-2.5h10a2.5 2.5 0 0 1 2.5 2.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V16H7a2.5 2.5 0 0 1-2.5-2.5v-7z" fill="rgba(20,184,166,0.16)"/><circle cx="9.2" cy="10" r="1.1" fill="#fbbf24" stroke="none"/><circle cx="12" cy="10" r="1.1" fill="#fbbf24" stroke="none"/><circle cx="14.8" cy="10" r="1.1" fill="#fbbf24" stroke="none"/>',
    chart: '<rect x="4" y="13" width="3.5" height="7" rx="1" fill="rgba(20,184,166,0.2)"/><rect x="10.25" y="9" width="3.5" height="11" rx="1" fill="rgba(20,184,166,0.28)"/><rect x="16.5" y="5" width="3.5" height="15" rx="1" fill="rgba(251,191,36,0.35)"/><path d="M4 11l6-4 4 2 6-5" stroke="#fbbf24"/>',
    users: '<circle cx="9" cy="8.5" r="3.2" fill="rgba(20,184,166,0.18)"/><path d="M3.5 19c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5"/><circle cx="16.5" cy="9.5" r="2.5" fill="rgba(251,191,36,0.25)"/><path d="M16.5 14.5c2.2 0 4 1.3 4 3.5"/>',
    sparkles: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" fill="rgba(20,184,166,0.22)"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2z" fill="#fbbf24" stroke="none"/><circle cx="6" cy="5.5" r="1.3" fill="#fbbf24" stroke="none"/>',
    shield: '<path d="M12 3l7.5 3v5.8c0 4.6-3.2 8.2-7.5 9.2-4.3-1-7.5-4.6-7.5-9.2V6L12 3z" fill="rgba(20,184,166,0.18)"/><path d="M9 12l2.1 2.1 4.2-4.2" stroke="#fbbf24" stroke-width="2.1"/>',
    bolt: '<path d="M13.2 3L6 13h5.5l-1 8L18 11h-5.3L13.2 3z" fill="rgba(251,191,36,0.25)"/>',
    doc: '<path d="M6.5 3.5h8L18.5 7.5v13a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 20.5v-15.5A1.5 1.5 0 0 1 6.5 3.5z" fill="rgba(20,184,166,0.16)"/><path d="M14 3.5V8h4.5M8.5 12h7M8.5 15.5h5"/>',
    check: '<path d="M5.5 12.5l4.2 4.2L18.5 7.5" stroke-width="2.3"/>',
    star: '<path d="M12 3l2.6 5.4 6 .9-4.3 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.3-4.2 6-.9L12 3z" fill="currentColor" stroke="none"/>',
    home: '<path d="M4 11.5L12 4l8 7.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19v-7.5z" fill="rgba(20,184,166,0.16)"/>',
    compass: '<circle cx="12" cy="12" r="9" fill="rgba(20,184,166,0.16)"/><polygon points="15.5,8.5 13.4,13.4 8.5,15.5 10.6,10.6" fill="#fbbf24" stroke="currentColor"/>',
    user: '<circle cx="12" cy="8.5" r="3.5" fill="rgba(20,184,166,0.18)"/><path d="M5 19.5c0-3.2 3.1-5 7-5s7 1.8 7 5"/>',
    search: '<circle cx="11" cy="11" r="6.5" fill="rgba(20,184,166,0.12)"/><path d="M16 16l4 4"/>',
    bell: '<path d="M6.5 15.5V10a5.5 5.5 0 0 1 11 0v5.5l1.5 2H5l1.5-2z" fill="rgba(20,184,166,0.16)"/><circle cx="12" cy="19.5" r="1.4" fill="#fbbf24" stroke="none"/>',
    palette: '<circle cx="12" cy="12" r="8.5" fill="rgba(20,184,166,0.16)"/><circle cx="9" cy="10" r="1.3" fill="#fbbf24" stroke="none"/><circle cx="13.5" cy="9" r="1.3" fill="#5eead4" stroke="none"/><circle cx="15" cy="13.5" r="1.3" fill="#fb7185" stroke="none"/>',
    globe: '<circle cx="12" cy="12" r="9" fill="rgba(20,184,166,0.14)"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3.5 12h17"/>',
    trophy: '<path d="M7 4.5h10v5a5 5 0 0 1-10 0v-5z" fill="rgba(251,191,36,0.22)"/><path d="M7 6.5H4.5a2 2 0 0 0 0 4H7M17 6.5h2.5a2 2 0 0 1 0 4H17M12 14.5v4.5M8.5 19.5h7"/>',
    bulb: '<path d="M9.5 17h5M10 19.5h4M8.5 13.8A5.5 5.5 0 1 1 15.5 13.8c-.7.7-1.1 1.6-1.2 2.7H9.7c-.1-1.1-.5-2-1.2-2.7z" fill="rgba(251,191,36,0.2)"/>'
  };

  function makeSvg(name, size) {
    var inner = ICON_SHAPES[name] || ICON_SHAPES.sparkles;
    var s = size || 18;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', String(s));
    svg.setAttribute('height', String(s));
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.85');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = inner;
    return svg;
  }

  function hydrateIcons(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-more-icon]').forEach(function (el) {
      var name = el.getAttribute('data-more-icon');
      var size = parseInt(el.getAttribute('data-size') || '18', 10);
      if (!el.querySelector('svg')) {
        el.appendChild(makeSvg(name, size));
      }
    });
  }

  global.MORE_ICONS = {
    makeSvg: makeSvg,
    hydrate: hydrateIcons,
    names: Object.keys(ICON_SHAPES)
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { hydrateIcons(document); });
  } else {
    hydrateIcons(document);
  }
})(window);
