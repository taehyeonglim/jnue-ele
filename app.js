/* 발표 모드 + 유튜브 facade */
(function () {
  const body = document.body;
  const secs = [...document.querySelectorAll('main > .sec')];
  const KEY = 'jnue-ele.presenter';

  /* ── 발표 모드: 넓은 화면이면 자동, P 키 또는 버튼으로 전환 ── */
  function wantPresenter() {
    const saved = localStorage.getItem(KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
    return window.innerWidth >= 1024 && !matchMedia('(pointer: coarse)').matches;
  }
  function setPresenter(on, persist) {
    body.classList.toggle('presenter', on);
    if (persist) localStorage.setItem(KEY, on ? '1' : '0');
    document.querySelector('.pmode').textContent = on ? '일반 보기' : '발표 모드';
    if (on) { syncHud(); }
  }
  document.querySelector('.pmode').addEventListener('click', () => setPresenter(!body.classList.contains('presenter'), true));

  /* ── 점 내비 + 현재 섹션 표시 ── */
  const dots = document.querySelector('.dots');
  secs.forEach((s, i) => {
    const a = document.createElement('a');
    a.href = '#' + s.id; a.title = s.dataset.title || String(i + 1);
    dots.appendChild(a);
  });
  let cur = 0;
  const hudN = document.querySelector('.hud-n');
  function syncHud() {
    dots.querySelectorAll('a').forEach((a, i) => a.classList.toggle('on', i === cur));
    hudN.textContent = (cur + 1) + ' / ' + secs.length;
    body.classList.toggle('on-hero', cur === 0);
  }
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { cur = secs.indexOf(e.target); syncHud(); } });
  }, { threshold: 0.5 });
  secs.forEach(s => io.observe(s));
  setPresenter(wantPresenter(), false);

  /* ── 키보드(클리커) 이동 ── */
  function go(i) {
    i = Math.max(0, Math.min(secs.length - 1, i));
    secs[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === 'p' || e.key === 'P') { setPresenter(!body.classList.contains('presenter'), true); return; }
    if (!body.classList.contains('presenter')) return;
    const next = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'];
    const prev = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'];
    if (next.includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (prev.includes(e.key)) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(secs.length - 1); }
    else if (/^[1-9]$/.test(e.key)) { go(Number(e.key) - 1); }
  });
  /* 유튜브 iframe이 포커스를 가져가면 클리커가 안 먹음 → 포커스를 문서로 되돌림 */
  window.addEventListener('blur', () => setTimeout(() => {
    const a = document.activeElement;
    if (a && a.tagName === 'IFRAME') a.blur();
  }, 0));

  /* ── 유튜브 facade: 클릭해야 iframe 로드 ── */
  const ids = (window.SITE && window.SITE.videos) || {};
  document.querySelectorAll('.video').forEach(fig => {
    const id = ids[fig.dataset.id];
    if (!id) { fig.classList.add('pending'); return; }
    fig.querySelector('.play').addEventListener('click', () => {
      const frame = fig.querySelector('.video-frame');
      const ifr = document.createElement('iframe');
      ifr.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&hl=ko';
      ifr.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      ifr.allowFullscreen = true; ifr.title = fig.querySelector('figcaption b').textContent;
      frame.replaceChildren(ifr);
      fig.classList.add('playing');
    });
  });
})();
