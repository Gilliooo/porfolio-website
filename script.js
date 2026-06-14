// script.js

// ── Scroll reveal ──
// Runs first so a failure in any later code (e.g. a missing CDN) can never
// leave .reveal elements stuck at opacity:0.
(() => {
  const reveals = document.querySelectorAll('.reveal');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('in'));
    return;
  }

  const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

  reveals.forEach((el, i) => {
    // Subtle stagger for grouped items (cards, stack groups)
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
    revealObserver.observe(el);
  });

  // Failsafe: if anything goes wrong, never keep content hidden.
  window.addEventListener('load', () => {
    setTimeout(() => reveals.forEach((el) => el.classList.add('in')), 2500);
  });
})();

// ── Custom cursor (hover-capable devices only) ──
const cursor = document.getElementById('cursor');

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const setX = gsap.quickSetter(cursor, 'x', 'px');
  const setY = gsap.quickSetter(cursor, 'y', 'px');

  window.addEventListener('mousemove', (e) => {
    cursor.classList.add('visible');
    setX(e.clientX);
    setY(e.clientY);
  });

  document.addEventListener('mouseleave', () => cursor.classList.remove('visible'));
  document.addEventListener('mouseenter', () => cursor.classList.add('visible'));

  const clickables = 'a, button, [role="button"], input, select, textarea, label, .project-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(clickables)) cursor.classList.add('is-hovering');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(clickables)) cursor.classList.remove('is-hovering');
  });
}

// ── Smooth scroll ──
const lenis = new Lenis({
  duration: 1.4,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);

// ── Project modal ──
const modal      = document.getElementById('project-modal');
const modalBox   = modal.querySelector('.modal-box');
const modalTitle = modal.querySelector('.modal-title');
const modalMedia = modal.querySelector('.modal-media');
const modalDesc   = modal.querySelector('.modal-desc');
const modalDetail = modal.querySelector('.modal-detail');
const modalTagsEl = modal.querySelector('.modal-tags');
const modalLink  = modal.querySelector('.modal-link');
const modalGithub = modal.querySelector('.modal-github');
const modalClose = modal.querySelector('.modal-close');

// PC: intercept wheel before Lenis (capture phase) and smooth-scroll modal with GSAP
let modalScrollTarget = 0;

window.addEventListener('wheel', (e) => {
  if (!modal.classList.contains('open')) return;
  e.preventDefault();
  const maxScroll = modalBox.scrollHeight - modalBox.clientHeight;
  modalScrollTarget = Math.max(0, Math.min(modalScrollTarget + e.deltaY, maxScroll));
  gsap.to(modalBox, { scrollTop: modalScrollTarget, duration: 0.5, ease: 'power3.out', overwrite: true });
}, { passive: false, capture: true });

// Mobile: handle touch directly on modalBox and stop propagation so Lenis never sees it
let touchStartY = 0;

modalBox.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
  e.stopPropagation();
}, { passive: true });

modalBox.addEventListener('touchmove', (e) => {
  e.stopPropagation();
  e.preventDefault();
  const dy = touchStartY - e.touches[0].clientY;
  touchStartY = e.touches[0].clientY;
  modalBox.scrollTop += dy;
}, { passive: false });

// Prevent the dark backdrop from scrolling the page on mobile
modal.addEventListener('touchmove', (e) => {
  if (!modalBox.contains(e.target)) e.preventDefault();
}, { passive: false });

let modalHistoryPushed = false;
let modalPreviousFocus = null;

function getModalFocusable() {
  return [...modal.querySelectorAll('button, a[href]:not([href="#"]), [tabindex]:not([tabindex="-1"])')];
}

function openModal(card) {
  const imgEl  = card.querySelector('.project-img');
  const title  = card.querySelector('h3').textContent;
  const desc   = card.querySelector('h3 + p').textContent;
  const details = card.dataset.detail
    ? card.dataset.detail.split('|').map(s => s.trim()).filter(Boolean)
    : [];
  const link   = card.dataset.link;
  const github = card.dataset.github;
  const gallery = card.dataset.gallery ? card.dataset.gallery.split(',') : null;
  const tags   = [...card.querySelectorAll('.tag')].map(t => t.textContent);

  modalTitle.textContent = title;
  modalDesc.textContent         = desc;
  if (details.length) {
    modalDetail.innerHTML = '<p class="modal-detail-label">// details</p><ul class="modal-detail-list">'
      + details.map(d => `<li>${d}</li>`).join('') + '</ul>';
    modalDetail.style.display = '';
  } else {
    modalDetail.innerHTML = '';
    modalDetail.style.display = 'none';
  }
  modalTagsEl.innerHTML  = tags.map(t => `<span class="tag">${t}</span>`).join('');

  modalLink.href          = link || '#';
  modalLink.style.display = link ? '' : 'none';

  modalGithub.href          = github || '#';
  modalGithub.style.display = github ? '' : 'none';

  if (gallery && gallery.length > 0) {
    let idx = 0;
    const render = () => {
      modalMedia.querySelector('.modal-gallery-track img').src = gallery[idx];
      modalMedia.querySelector('.modal-gallery-counter').textContent =
        `[${idx + 1}/${gallery.length}]`;
    };
    modalMedia.innerHTML = `
      <div class="modal-gallery">
        <div class="modal-gallery-track">
          <img src="${gallery[0]}" alt="${title} screenshot 1" />
        </div>
        <div class="modal-gallery-controls">
          <button class="modal-gallery-btn">[prev]</button>
          <span class="modal-gallery-counter">[1/${gallery.length}]</span>
          <button class="modal-gallery-btn">[next]</button>
        </div>
      </div>`;
    const [prevBtn, nextBtn] = modalMedia.querySelectorAll('.modal-gallery-btn');
    prevBtn.addEventListener('click', () => { idx = (idx - 1 + gallery.length) % gallery.length; render(); });
    nextBtn.addEventListener('click', () => { idx = (idx + 1) % gallery.length; render(); });
  } else {
    modalMedia.innerHTML = imgEl
      ? `<img src="${imgEl.src}" alt="${imgEl.alt}" />`
      : `<div class="img-placeholder"></div>`;
  }

  modalBox.scrollTop = 0;
  modalScrollTarget  = 0;
  modalPreviousFocus = document.activeElement;
  modal.classList.add('open');
  lenis.stop();
  history.pushState({ modal: true }, '');
  modalHistoryPushed = true;
}

function closeModal() {
  modal.classList.remove('open');
  lenis.start();
  if (modalPreviousFocus) { modalPreviousFocus.focus(); modalPreviousFocus = null; }
  if (modalHistoryPushed) {
    modalHistoryPushed = false;
    history.back();
  }
}

window.addEventListener('popstate', () => {
  if (modal.classList.contains('open')) {
    modal.classList.remove('open');
    lenis.start();
    modalHistoryPushed = false;
  }
});

document.querySelectorAll('.project-card').forEach((card) => {
  card.addEventListener('click', () => openModal(card));

  // Flag projects with a live website via a badge on the thumbnail.
  if (card.dataset.link) {
    const badge = document.createElement('span');
    badge.className = 'live-badge';
    badge.textContent = 'Live Website';
    card.appendChild(badge);
  }
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); return; }
  if (e.key !== 'Tab' || !modal.classList.contains('open')) return;
  const focusable = getModalFocusable();
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
  }
});

// ── Mobile nav toggle ──
const navToggle = document.querySelector('.nav-toggle');
const navLinks  = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  navToggle.textContent = isOpen ? '[close]' : '[menu]';
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.textContent = '[menu]';
  });
});

// ── Anchor scroll ──
document.querySelectorAll('a[href^="#"]:not(.modal-link):not(.modal-github)').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = anchor.getAttribute('href');
    if (target && target !== '#') lenis.scrollTo(target);
  });
});
