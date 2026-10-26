/* =========================================================
   Bearshare 공통 기능 — 저장소, 로그인 상태, 상단·하단 메뉴, 작은 도구
   서버 없이 동작하며, 데이터는 이 브라우저(localStorage)에만 저장돼요.
   ========================================================= */
(function () {
  'use strict';
  const C = BS.config;

  /* ---------- 작은 도구 ---------- */
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = p => p + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const DOW = ['일', '월', '화', '수', '목', '금', '토'];
  const isWeekend = d => d.getDay() === 0 || d.getDay() === 6;
  const fmtDate = s => { const d = parseYmd(s); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`; };
  const fmtDateFull = s => { const d = parseYmd(s); return `${d.getFullYear()}년 ${fmtDate(s)}`; };
  const daysFromToday = s => Math.round((parseYmd(s) - today()) / 86400000);
  const addBusinessDays = (d, n) => { let x = new Date(d); x.setHours(0, 0, 0, 0); let left = n; while (left > 0) { x = addDays(x, 1); if (!isWeekend(x)) left--; } return x; };

  /* 시간 칸: 0 = dayStart 시, 칸 하나 = 30분 */
  const SLOTS = (C.dayEnd - C.dayStart) * 60 / C.slotMinutes;
  const slotMin = i => C.dayStart * 60 + i * C.slotMinutes;
  const fmtMin = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const slotTime = i => fmtMin(slotMin(i));
  const timeToSlot = t => { const [h, m] = t.split(':').map(Number); return (h * 60 + m - C.dayStart * 60) / C.slotMinutes; };
  const rangeText = (s, e) => `${slotTime(s)} ~ ${slotTime(e)}`;
  const durText = n => { const m = n * C.slotMinutes; const h = Math.floor(m / 60); return [h ? h + '시간' : '', m % 60 ? (m % 60) + '분' : ''].filter(Boolean).join(' '); };

  const spaceById = id => BS.spaces.find(s => s.id === id);
  const hoursFor = (space, dateStr) => isWeekend(parseYmd(dateStr)) ? space.hours.weekend : space.hours.weekday;
  const hoursText = h => `${pad(h[0])}:00 ~ ${pad(h[1])}:00`;
  const withinHours = (space, dateStr, i) => { const [o, c] = hoursFor(space, dateStr); const m = slotMin(i); return m >= o * 60 && m + C.slotMinutes <= c * 60; };

  /* 신청 가능 기간: 이용일 30일 전부터 3일 전까지 */
  const applyWindow = () => ({ from: ymd(addDays(today(), C.applyUntilDays)), to: ymd(addDays(today(), C.applyFromDays)) });
  const canApplyFor = dateStr => { const n = daysFromToday(dateStr); return n >= C.applyUntilDays && n <= C.applyFromDays; };

  const maskName = n => !n ? '' : n.length <= 1 ? n : n.length === 2 ? n[0] + '○' : n[0] + '○'.repeat(n.length - 2) + n[n.length - 1];
  const maskPhone = p => { const d = String(p || '').replace(/\D/g, ''); return d.length >= 10 ? d.slice(0, 3) + '-****-' + d.slice(-4) : p || ''; };

  /* ---------- 아이콘 ---------- */
  const I = {
    bear: '<svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><circle cx="8" cy="9" r="5" fill="#0B2A5B"/><circle cx="24" cy="9" r="5" fill="#0B2A5B"/><circle cx="16" cy="18" r="12" fill="#0B2A5B"/><circle cx="12" cy="17" r="1.6" fill="#fff"/><circle cx="20" cy="17" r="1.6" fill="#fff"/><ellipse cx="16" cy="22.5" rx="4.5" ry="3.2" fill="#F2B23A"/></svg>',
    info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.5v.5"/></svg>',
    left: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    check: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1D4E9E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.5 2.5L16 9.5"/></svg>',
    home: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1D4E9E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/></svg>',
    doc: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1D4E9E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
    cal: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#1D4E9E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 14h3v3H8z"/></svg>'
  };

  /* ---------- 저장소 ---------- */
  const KEY = 'bearshare.v2';
  let memory = null; // 저장이 막힌 브라우저에서는 메모리에만 둬요
  function readRaw() { try { return localStorage.getItem(KEY); } catch (e) { return memory; } }
  function writeRaw(v) { try { localStorage.setItem(KEY, v); } catch (e) { memory = v; } }

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function nextDow(dow, week) { let d = addDays(today(), 4); while (d.getDay() !== dow) d = addDays(d, 1); return addDays(d, week * 7); }

  const SEED_GROUPS = [
    ['안서동 독서 모임', '비영리 소모임', 'resident'], ['토익 스터디', '스터디', 'student'], ['동남구 배드민턴 동호회', '동아리·동호회 활동', 'resident'],
    ['주민 영어회화 모임', '비영리 소모임', 'resident'], ['코딩 스터디', '스터디', 'student'], ['풋살 동호회', '동아리·동호회 활동', 'resident'],
    ['뜨개질 모임', '비영리 소모임', 'resident'], ['창업 동아리 회의', '동아리·동호회 활동', 'student'], ['주민 합창단 연습', '지역 주민 교류 행사', 'resident']
  ];
  const SEED_NAMES = ['김민지', '이서준', '박지훈', '최유나', '정하늘', '강도윤', '윤서연', '한지우', '오세린'];

  function buildSeed() {
    const t = today();
    const reservations = [];
    const classes = BS.classSeeds.map(c => ({ ...c, date: ymd(nextDow(c.dow, c.week)), status: 'open', seed: true }));
    classes.forEach(c => reservations.push({ id: 'r-' + c.id, kind: 'class', classId: c.id, spaceId: c.spaceId, date: c.date,
      start: timeToSlot(c.start), end: timeToSlot(c.end), status: 'approved', name: c.title, role: 'student', purpose: '학생 원데이클래스',
      group: c.title, count: c.applied, userId: 'seed', createdAt: Date.now() - 6 * 86400000, decidedAt: Date.now() - 5 * 86400000 }));
    const r = rng(Number(ymd(t).replace(/-/g, '')));
    const occupied = (sp, date, s, e) => reservations.some(x => x.spaceId === sp && x.date === date && s < x.end && x.start < e);
    for (let d = -6; d < 24; d++) {
      const date = ymd(addDays(t, d));
      BS.spaces.forEach(sp => {
        if (r() < 0.45) return;
        const [o, c] = hoursFor(sp, date);
        const open = (c - o) * 2; if (open < 3) return;
        const len = 2 + Math.floor(r() * 3);
        const s = timeToSlot(pad(o) + ':00') + Math.floor(r() * (open - len));
        if (occupied(sp.id, date, s, s + len)) return;
        const g = SEED_GROUPS[Math.floor(r() * SEED_GROUPS.length)];
        const name = SEED_NAMES[Math.floor(r() * SEED_NAMES.length)];
        const created = parseYmd(date).getTime() - (5 + Math.floor(r() * 10)) * 86400000;
        const pending = d >= 3 && r() < 0.07;
        reservations.push({ id: uid('r'), kind: 'rental', spaceId: sp.id, date, start: s, end: s + len,
          status: pending ? 'pending' : 'approved', name, phone: '010-' + (1000 + Math.floor(r() * 8999)) + '-' + (1000 + Math.floor(r() * 8999)),
          role: g[2], purpose: g[1], group: g[0], count: 4 + Math.floor(r() * 12), userId: 'seed',
          createdAt: pending ? Date.now() - Math.floor(r() * 2) * 86400000 : created, decidedAt: pending ? null : created + 86400000 });
      });
    }
    /* 반려 예시 1건 */
    reservations.push({ id: uid('r'), kind: 'rental', spaceId: 'fl-hall', date: ymd(addDays(t, 9)), start: timeToSlot('19:00'), end: timeToSlot('22:00'),
      status: 'rejected', rejectReason: '이용 기준 위반 (정치·종교·영리 목적)', name: '오세린', phone: '010-5555-1234', role: 'resident',
      purpose: '기타', group: '플리마켓 판매 행사', count: 50, userId: 'seed', createdAt: Date.now() - 3 * 86400000, decidedAt: Date.now() - 2 * 86400000 });
    const proposals = [{ id: 'p-seed', title: '천안 동네 산책 사진 수업', field: '문화·예술', dept: '미디어커뮤니케이션학과 3학년',
      spaceId: 'beartopia', date: ymd(addDays(t, 12)), start: '14:00', end: '16:00', capacity: 15, fee: '무료',
      target: '지역 주민 누구나', supplies: '스마트폰', desc: '스마트폰으로 동네 풍경을 찍고 함께 골라 작은 사진전을 열어요.',
      host: '서○○', hostName: '서지민', userId: 'seed', status: 'pending', createdAt: Date.now() - 86400000 }];
    return { version: 2, seededOn: ymd(t), reservations, classes, applications: [], proposals, session: null };
  }

  let state;
  function load() {
    try { const raw = readRaw(); if (raw) { const s = JSON.parse(raw); if (s && s.version === 2) return s; } } catch (e) { }
    return null;
  }
  function persist() { writeRaw(JSON.stringify(state)); }
  function reset(keepSession) { const s = state && state.session; state = buildSeed(); if (keepSession) state.session = s; persist(); }
  state = load(); if (!state) { state = buildSeed(); persist(); }

  const me = () => state.session;
  const login = s => { state.session = s; persist(); };
  const logout = () => { state.session = null; persist(); };

  /* 그날 그 공간의 칸별 사용 현황: null = 비어 있음 */
  function occupancy(spaceId, dateStr, ignoreId) {
    const occ = new Array(SLOTS).fill(null);
    state.reservations.forEach(r => {
      if (r.spaceId !== spaceId || r.date !== dateStr || r.id === ignoreId) return;
      if (r.status !== 'approved' && r.status !== 'pending') return;
      for (let i = r.start; i < r.end; i++) if (i >= 0 && i < SLOTS) occ[i] = r;
    });
    return occ;
  }
  const approveDeadline = r => addBusinessDays(new Date(r.createdAt), C.approvalDays);

  /* ---------- 화면 공통 ---------- */
  function toast(msg) {
    const old = $('.toast'); if (old) old.remove();
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
  }
  function openModal(html) {
    closeModal();
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${html}</div>`;
    bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) closeModal(); });
    document.body.appendChild(bg);
    const f = $('input, select, textarea, button', bg); if (f) f.focus();
    return $('.modal', bg);
  }
  function closeModal() { const m = $('.modal-bg'); if (m) m.remove(); }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  const NAV = [['index', '홈', 'index.html'], ['spaces', '공간안내', 'spaces.html'], ['guide', '대관안내', 'guide.html'], ['reserve', '대관신청', 'reserve.html'], ['classes', '수업 둘러보기', 'classes.html']];
  const roleLabel = r => ({ student: '재학생', resident: '지역주민', admin: '관리자' }[r] || '');

  function renderChrome(page) {
    const u = me();
    const right = !u
      ? `<a class="btn btn-navy" href="login.html">로그인</a>`
      : `<span class="user-chip"><b>${esc(u.name)}</b>님 · ${roleLabel(u.role)}</span>
         <a class="btn btn-sm ${u.role === 'admin' ? 'btn-navy' : 'btn-ghost-blue'}" href="${u.role === 'admin' ? 'admin.html' : 'mypage.html'}">${u.role === 'admin' ? '관리자 화면' : '내 예약'}</a>
         <button class="btn btn-sm btn-outline" type="button" id="logout-btn">로그아웃</button>`;
    const hd = document.createElement('div');
    hd.innerHTML = `
      <div class="proto-bar">시연용 시제품이에요. 입력한 정보는 이 브라우저에만 저장되고 어디로도 전송되지 않아요.</div>
      <header class="site-header"><div class="container">
        <a class="brand" href="index.html">${I.bear}<span>Bearshare</span></a>
        <nav class="nav" aria-label="주메뉴">${NAV.map(n => `<a href="${n[2]}" class="${n[0] === page ? 'active' : ''}" ${n[0] === page ? 'aria-current="page"' : ''}>${n[1]}</a>`).join('')}</nav>
        <div class="user-area">${right}</div>
      </div></header>`;
    document.body.prepend(...hd.children);
    const ft = document.createElement('footer'); ft.className = 'site-footer';
    ft.innerHTML = `<div class="container">
      <div style="display:flex;flex-direction:column;gap:4px">
        <strong>Bearshare</strong>
        <span>단국대학교 천안캠퍼스 유휴 공간 공유 시범 서비스 · 충남 천안시 동남구 단대로 119</span>
        <span>운영: ${esc(C.teamName)} · 문의 ${esc(C.teamEmail)}</span>
      </div>
      <div class="links">
        <a href="guide.html#rules">이용 기준</a>
        <a class="strong" href="privacy.html">개인정보처리방침</a>
        <a href="admin.html">관리자</a>
      </div></div>`;
    document.body.appendChild(ft);
    const lo = $('#logout-btn'); if (lo) lo.addEventListener('click', () => { logout(); toast('로그아웃했어요'); setTimeout(() => location.href = 'index.html', 400); });
  }

  /* 폼 오류 표시 */
  function clearErrors(form) { $$('.err', form).forEach(x => x.remove()); $$('.invalid', form).forEach(x => x.classList.remove('invalid')); }
  function fieldError(form, name, msg) {
    const el = form.elements[name]; if (!el) return;
    el.classList.add('invalid'); el.setAttribute('aria-invalid', 'true');
    const p = document.createElement('span'); p.className = 'err'; p.textContent = msg;
    (el.closest('.field') || el.parentElement).appendChild(p);
  }

  /* 개인정보 수집·이용 동의 상자 (로그인·신청 화면 공통) */
  function consentBox(name, items, purpose) {
    return `<div class="consent">
      <div class="consent-body">
        <strong>개인정보 수집·이용 안내</strong>
        <table>
          <tr><th>수집 항목</th><td>${esc(items)}</td></tr>
          <tr><th>이용 목적</th><td>${esc(purpose)}</td></tr>
          <tr><th>보관 기간</th><td>시범 운영 종료 시까지 보관 후 지체 없이 파기</td></tr>
        </table>
        <span class="hint">동의하지 않을 수 있어요. 다만 동의하지 않으면 이 서비스를 이용할 수 없어요. <a href="privacy.html" target="_blank" rel="noopener">개인정보처리방침 전문 보기</a></span>
      </div>
      <label class="check"><input type="checkbox" name="${name}"><span>위 내용을 확인했으며 개인정보 수집·이용에 동의합니다. <span class="req">(필수)</span></span></label>
    </div>`;
  }

  window.BSX = {
    C, $, $$, esc, uid, pad, ymd, parseYmd, addDays, today, DOW, isWeekend, fmtDate, fmtDateFull, daysFromToday, addBusinessDays,
    SLOTS, slotMin, slotTime, timeToSlot, rangeText, durText, spaceById, hoursFor, hoursText, withinHours,
    applyWindow, canApplyFor, maskName, maskPhone, I,
    get state() { return state; }, persist, reset, me, login, logout, occupancy, approveDeadline,
    toast, openModal, closeModal, renderChrome, roleLabel, clearErrors, fieldError, consentBox
  };
})();
