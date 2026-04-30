// script.js

// ── Custom cursor ──
const cursor = document.getElementById('cursor');
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
const modal        = document.getElementById('project-modal');
const modalTitle   = modal.querySelector('.modal-title');
const modalMedia   = modal.querySelector('.modal-media');
const modalDesc    = modal.querySelector('.modal-desc');
const modalLink    = modal.querySelector('.modal-link');
const modalGithub  = modal.querySelector('.modal-github');
const modalClose   = modal.querySelector('.modal-close');

function openModal(card) {
  const imgEl  = card.querySelector('.project-img');
  const title  = card.querySelector('h3').textContent;
  const desc   = card.querySelector('p').textContent;
  const link   = card.dataset.link;
  const github = card.dataset.github;

  modalTitle.textContent = title;
  modalDesc.textContent  = desc;

  modalLink.href           = link || '#';
  modalLink.style.display  = link ? '' : 'none';

  modalGithub.href          = github || '#';
  modalGithub.style.display = github ? '' : 'none';

  modalMedia.innerHTML = imgEl
    ? `<img src="${imgEl.src}" alt="${imgEl.alt}" />`
    : `<div class="img-placeholder"></div>`;

  modal.classList.add('open');
  lenis.stop();
}

function closeModal() {
  modal.classList.remove('open');
  lenis.start();
}

document.querySelectorAll('.project-card').forEach((card) => {
  card.addEventListener('click', () => openModal(card));
});

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ── Anchor scroll ──
document.querySelectorAll('a[href^="#"]:not(.modal-link):not(.modal-github)').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = anchor.getAttribute('href');
    if (target && target !== '#') lenis.scrollTo(target);
  });
});
