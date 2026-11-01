/* LAMP 익명 질문함 — 12/7 전공탐색 질문함(jnue-teacher-day)과 같은 Firebase RTDB(chiron-7a37c)의 lamp/ 칸.
   lamp/questions/{id}: { t: 질문(1~120자), at: 서버 시각 }  — 누구나 새로 쓰기만 가능(덮어쓰기 불가)
   lamp/state/qh/{id}: true                                  — 숨긴 질문. 발표 키가 있어야 쓸 수 있음
   발표 PC는 주소 뒤에 ?host=발표키 를 붙여 한 번 열면 기억한다(주소창에서는 바로 지움).
   '답했어요'는 발표 PC에만 기억(localStorage). 행사 뒤 질문 모으기: firebase database:get /lamp */
const CONFIG = {
  apiKey: 'AIzaSyB9Mng40M1GSwUw8CdeyhEGTdfoqB8-1pU',
  authDomain: 'chiron-7a37c.firebaseapp.com',
  databaseURL: 'https://chiron-7a37c-default-rtdb.firebaseio.com',
  projectId: 'chiron-7a37c',
  appId: '1:878706705972:web:4f36bed2450d3a8726ac61',
};
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const KEY_LS = 'jnue-elementary.hostkey', ANS_LS = 'jnue-elementary.answered';
const MAX = 120;

/* 발표 키: ?host=키 → 기억하고 주소에서 지움 */
const url = new URL(location.href);
if (url.searchParams.get('host')) {
  localStorage.setItem(KEY_LS, url.searchParams.get('host'));
  url.searchParams.delete('host'); history.replaceState(null, '', url.pathname + url.search + url.hash);
}
const hostKey = localStorage.getItem(KEY_LS) || '';
const hostToken = () => `${hostKey}:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;

const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clean = x => { const t = String(x || '').trim(); return t.length >= 1 && t.length <= MAX ? t : null; };

const ready = (async () => {
  const { initializeApp } = await import(FB + 'firebase-app.js');
  const d = await import(FB + 'firebase-database.js');
  return { d, db: d.getDatabase(initializeApp(CONFIG)) };
})();

async function ask(text) {
  const t = clean(text); if (!t) return false;
  try { const { d, db } = await ready; await d.push(d.ref(db, 'lamp/questions'), { t, at: d.serverTimestamp() }); return true; }
  catch (e) { console.warn('질문 보내기 실패', e); return false; }
}
async function hide(qid) {
  const { d, db } = await ready;
  await d.update(d.ref(db, 'lamp/state'), { ['qh/' + qid]: true, k: hostToken() });
}

/* ── 질문 목록(보낸 순서, 숨긴 것 빼고) ── */
let questions = [];
const cur = { q: {}, h: {} };
ready.then(({ d, db }) => {
  const emit = () => {
    questions = Object.entries(cur.q)
      .filter(([id, q]) => !cur.h[id] && q && typeof q.t === 'string')
      .map(([id, q]) => ({ id, text: q.t, at: q.at || 0 }))
      .sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
    draw();
  };
  d.onValue(d.ref(db, 'lamp/questions'), s => { cur.q = s.val() || {}; emit(); });
  d.onValue(d.ref(db, 'lamp/state/qh'), s => { cur.h = s.val() || {}; emit(); });
}).catch(e => console.warn('질문함 연결 실패', e));

const answered = new Set(JSON.parse(localStorage.getItem(ANS_LS) || '[]'));
const box = document.getElementById('qcards');
const nEl = document.getElementById('qn');
const hudQ = document.querySelector('.hud-q');
function draw() {
  if (nEl) nEl.textContent = questions.length;
  if (hudQ) { hudQ.textContent = '💬 ' + questions.length; hudQ.hidden = questions.length === 0; }
  if (!box) return;
  box.innerHTML = questions.map((q, j) => `<button type="button" class="qcard ${answered.has(q.id) ? 'done' : ''}" data-j="${j}">
    <b class="no">Q${j + 1}</b>${esc(q.text)}</button>`).join('') || '<p class="qempty">아직 질문이 없어요. 첫 질문을 보내 주세요!</p>';
  box.querySelectorAll('.qcard').forEach(b => b.addEventListener('click', () => { b.blur(); openSpot(+b.dataset.j); }));
}

/* ── 크게 보기 ── */
let spot = null;
function closeSpot() { spot?.remove(); spot = null; }
function openSpot(j) {
  const q = questions[j]; if (!q) return;
  closeSpot();
  spot = document.createElement('div'); spot.className = 'qspot';
  spot.innerHTML = `<div class="qspot-box" role="dialog" aria-label="질문 ${j + 1}"><p class="no">Q${j + 1}</p><p class="qt">${esc(q.text)}</p>
    <div class="acts"><button type="button" class="ok">✓ 답했어요</button>${hostKey ? '<button type="button" class="hide">숨기기</button>' : ''}<button type="button" class="x">닫기 (Esc)</button></div></div>`;
  document.body.append(spot);
  spot.addEventListener('click', e => { if (e.target === spot) closeSpot(); });
  spot.querySelector('.ok').addEventListener('click', () => {
    answered.add(q.id); localStorage.setItem(ANS_LS, JSON.stringify([...answered])); closeSpot(); draw();
  });
  spot.querySelector('.hide')?.addEventListener('click', () => { closeSpot(); hide(q.id).catch(e => console.warn('숨기기 실패(발표 키 확인)', e)); });
  spot.querySelector('.x').addEventListener('click', closeSpot);
}
/* 크게 보기가 열려 있으면 Esc·클리커 키는 먼저 닫기만 (app.js의 화면 이동보다 먼저 받음) */
window.addEventListener('keydown', e => {
  if (!spot) return;
  if (['Escape', 'ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Enter', 'Backspace'].includes(e.key)) {
    e.preventDefault(); e.stopImmediatePropagation(); closeSpot();
  }
}, true);

/* ── 질문 보내기 칸(질문 화면 안 + 오른쪽 아래 버튼 공용) ── */
function toast(msg) {
  const t = document.createElement('div'); t.className = 'qtoast'; t.textContent = msg; document.body.append(t);
  setTimeout(() => t.remove(), 2600);
}
function bindForm(form, done) {
  const ta = form.querySelector('textarea'), cnt = form.querySelector('.qcnt'), err = form.querySelector('.qerr'), btn = form.querySelector('button');
  const upd = () => { cnt.textContent = `${ta.value.trim().length} / ${MAX}`; };
  ta.addEventListener('input', upd); upd();
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!clean(ta.value)) { err.hidden = false; err.textContent = '1~120자로 써 주세요.'; return; }
    btn.disabled = true;
    const ok = await ask(ta.value);
    btn.disabled = false;
    if (ok) { ta.value = ''; upd(); err.hidden = true; toast('질문을 보냈어요! 발표 뒤 Q&A에서 답해 드릴게요'); done?.(); }
    else { err.hidden = false; err.textContent = '보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'; }
  });
}
const formHTML = `<form class="qform"><textarea maxlength="${MAX}" rows="3" placeholder="궁금한 걸 편하게 적어 주세요. 이름은 남지 않아요."></textarea>
  <div class="qrow"><span class="qcnt"></span><button type="submit">질문 보내기</button></div><p class="qerr" hidden></p></form>`;

const inline = document.getElementById('qform-inline');
if (inline) { inline.innerHTML = formHTML; bindForm(inline.querySelector('form')); }

const fab = document.createElement('button');
fab.type = 'button'; fab.className = 'qfab'; fab.textContent = '💬 질문';
document.body.append(fab);
fab.addEventListener('click', () => {
  const sh = document.createElement('div'); sh.className = 'qsheet';
  sh.innerHTML = `<div class="qsheet-box"><p class="qkick">익명 질문 · 발표 뒤 Q&A에서 바로 답해요</p>${formHTML}<button type="button" class="qclose">닫기</button></div>`;
  document.body.append(sh);
  const close = () => sh.remove();
  sh.addEventListener('click', e => { if (e.target === sh) close(); });
  sh.querySelector('.qclose').addEventListener('click', close);
  bindForm(sh.querySelector('form'), close);
  sh.querySelector('textarea').focus();
});
/* 질문 화면에 와 있으면 버튼은 숨김(화면 안에 칸이 이미 있음) */
const askSec = document.getElementById('ask');
if (askSec) new IntersectionObserver(es => es.forEach(e => fab.classList.toggle('away', e.isIntersecting)), { threshold: 0.35 }).observe(askSec);
