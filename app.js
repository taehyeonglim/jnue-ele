/* 발표 모드 + 유튜브 facade */
(function () {
  const body = document.body;
  const secs = [...document.querySelectorAll('main > .sec')];
  const KEY = 'jnue-elementary.presenter';

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
    /* 영상 섹션을 벗어나면 재생 중인 유튜브를 내려 소리가 따라오지 않게 */
    if (secs[cur].id !== 'videos') stopVideos();
  }, { threshold: 0.5 });
  function stopVideos() {
    document.querySelectorAll('.video.playing').forEach(fig => {
      fig.querySelector('iframe, video')?.remove();
      fig.classList.remove('playing');
    });
    const tr = document.getElementById('trailer');
    if (tr && !tr.paused) tr.pause();
  }
  /* 트레일러 재생이 끝나거나 멈추면 포커스를 문서로 돌려 클리커가 바로 먹게 */
  document.getElementById('trailer')?.addEventListener('ended', (e) => e.target.blur());
  document.getElementById('trailer')?.addEventListener('pause', (e) => e.target.blur());
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
    if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.();
      return;
    }
    if (!body.classList.contains('presenter')) return;
    if (e.target.closest('summary, button, a, video')) return;   // 접기·버튼·영상에 포커스가 있으면 그쪽 동작 우선
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
      let el;
      if (/\.(mp4|webm)$/i.test(id)) {           // 파일: 직접 재생 (누르기 전엔 내려받지 않음)
        el = document.createElement('video');
        el.src = id; el.controls = true; el.autoplay = true; el.playsInline = true; el.preload = 'none';
        el.poster = fig.querySelector('img').src;
        el.addEventListener('pause', () => el.blur()); el.addEventListener('ended', () => el.blur());
      } else {                                    // 유튜브 ID
        el = document.createElement('iframe');
        el.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&hl=ko';
        el.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        el.allowFullscreen = true;
      }
      el.title = fig.querySelector('figcaption b').textContent;
      stopVideos();                 // 한 번에 한 편만
      frame.appendChild(el);        // 썸네일 위에 덮어씌움(facade는 그대로 둠)
      fig.classList.add('playing');
    });
  });
})();
