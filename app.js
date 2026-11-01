/* 발표 모드 + 오프닝 영상 + 영상 facade */
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
    body.classList.toggle('on-hero', secs[cur].id === 'hero');
    body.classList.toggle('on-opening', secs[cur].id === 'opening');
  }
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { cur = secs.indexOf(e.target); syncHud(); } });
    /* 영상이 있는 화면을 벗어나면 멈춰 소리가 따라오지 않게 */
    if (secs[cur].id !== 'videos') stopVideos();
    if (secs[cur].id !== 'opening' && opv && opv.currentTime > 0) { opv.pause(); opv.currentTime = 0; }   // 다시 오면 처음부터
  }, { threshold: 0.5 });
  /* 오프닝 영상: 화면 0. 클리커 첫 누름 = 재생, 재생 중 누름 = 다음 화면 */
  const opv = document.getElementById('opening-video');
  if (opv) {
    const frame = opv.closest('.op-frame');
    const btn = frame.querySelector('.op-play');
    btn?.addEventListener('click', () => { opv.play(); btn.blur(); });
    opv.addEventListener('click', () => (opv.paused ? opv.play() : opv.pause()));
    opv.addEventListener('play', () => frame.classList.add('playing'));
    ['pause', 'ended'].forEach(ev => opv.addEventListener(ev, () => { frame.classList.remove('playing'); opv.blur(); }));
  }
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
    if (next.includes(e.key) && opv && secs[cur].id === 'opening' && opv.paused && !opv.ended && opv.currentTime < 1) {
      e.preventDefault(); opv.play(); return;                       // 오프닝: 첫 누름은 재생
    }
    if (next.includes(e.key)) { e.preventDefault(); go(cur + 1); }
    else if (prev.includes(e.key)) { e.preventDefault(); go(cur - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(secs.length - 1); }
    else if (/^[0-9]$/.test(e.key)) { go(Number(e.key)); }     // 0 = 오프닝, 1 = 시작 … 9
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
