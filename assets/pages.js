/* =========================================================
   Bearshare 화면 — <body data-page="..."> 에 맞는 화면을 그려요
   ========================================================= */
(function () {
  'use strict';
  const X = window.BSX;
  const { C, $, $$, esc } = X;
  const app = $('#app');
  const page = document.body.dataset.page;
  const params = new URLSearchParams(location.search);
  const S = () => X.state;

  /* ---------- 공통 조각 ---------- */
  const pageHead = (crumb, title, sub, right) => `
    <section class="page-head"><div class="container">
      <div><div class="crumb">${crumb}</div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right || ''}
    </div></section>`;

  const ruleBox = () => `
    <div class="rule-box" aria-label="대관 신청 규칙">
      <div><span>신청 기간</span><b>이용일 ${C.applyFromDays}일 전 ~ ${C.applyUntilDays}일 전</b></div>
      <div><span>승인 처리</span><b>신청 후 ${C.approvalDays}일(평일) 이내</b></div>
      <div><span>1회 이용</span><b>최대 ${X.durText(C.maxSlots)} · 30분 단위</b></div>
      <div><span>이용료</span><b>${esc(C.feeText)}</b></div>
    </div>`;

  function statusBadge(r) {
    if (r.status === 'pending') return '<span class="badge badge-wait">승인 대기</span>';
    if (r.status === 'approved') return X.daysFromToday(r.date) < 0 ? '<span class="badge badge-ok">이용 완료</span>' : '<span class="badge badge-blue">승인 완료</span>';
    if (r.status === 'rejected') return '<span class="badge badge-bad">반려</span>';
    return '<span class="badge badge-off">취소</span>';
  }

  /* 오늘 이후 남은 빈 시간 묶음 */
  function freeRanges(spaceId, date) {
    const occ = X.occupancy(spaceId, date), sp = X.spaceById(spaceId), out = [];
    const isToday = X.daysFromToday(date) === 0, now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
    let s = -1;
    for (let i = 0; i <= X.SLOTS; i++) {
      const free = i < X.SLOTS && X.withinHours(sp, date, i) && !occ[i] && !(isToday && X.slotMin(i) < nowMin);
      if (free && s < 0) s = i;
      if (!free && s >= 0) { out.push([s, i]); s = -1; }
    }
    return out;
  }

  function classCard(c) {
    const sp = X.spaceById(c.spaceId);
    const full = c.applied >= c.capacity;
    return `<article class="card space-card">
      <div class="photo">[수업 사진]</div>
      <div class="body">
        <div style="display:flex;gap:6px;flex-wrap:wrap"><span class="tag">${esc(c.field)}</span>${full ? '<span class="badge badge-off">모집 마감</span>' : `<span class="badge badge-ok">모집 중 ${c.applied}/${c.capacity}</span>`}</div>
        <h3 style="font-size:19px">${esc(c.title)}</h3>
        <span class="muted small">강사: ${esc(c.host)} · ${esc(c.dept)}</span>
        <dl class="kv"><dt>일시</dt><dd>${X.fmtDate(c.date)} ${esc(c.start)}~${esc(c.end)}</dd><dt>장소</dt><dd>${esc(sp ? sp.name : '')}</dd><dt>대상</dt><dd>${esc(c.target)}</dd><dt>참가비</dt><dd>${esc(c.fee)}</dd></dl>
        <p class="small" style="color:var(--ink-2)">${esc(c.desc)}</p>
        ${page === 'classes' ? classButton(c) : `<a class="btn btn-ghost-blue" href="classes.html">수업 보러 가기</a>`}
      </div></article>`;
  }
  function classButton(c) {
    const u = X.me();
    const mine = u && S().applications.some(a => a.classId === c.id && a.userId === u.id && a.status !== 'cancelled');
    if (mine) return `<button class="btn btn-outline" disabled>신청 완료</button>`;
    if (c.applied >= c.capacity) return `<button class="btn" disabled>모집 마감</button>`;
    return `<button class="btn btn-primary" data-apply="${esc(c.id)}">수업 신청하기</button>`;
  }
  const upcomingClasses = () => S().classes.filter(c => c.status === 'open' && X.daysFromToday(c.date) >= 0).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

  /* =========================================================
     홈
     ========================================================= */
  function viewHome() {
    const w = X.applyWindow();
    const pick = ['beartopia', 'gym', 'hum-201'].map(X.spaceById);
    const rows = pick.map(sp => {
      const fr = freeRanges(sp.id, w.from);
      const total = fr.reduce((n, r) => n + r[1] - r[0], 0);
      const txt = fr.length ? `${X.slotTime(fr[0][0])}~${X.slotTime(fr[0][1])}${fr.length > 1 ? ` 외 ${fr.length - 1}곳` : ''}` : '빈 시간 없음';
      return `<a class="today-row" href="reserve.html?date=${w.from}" style="text-decoration:none;color:inherit">
        <div><strong>${esc(sp.name)}</strong><small>${esc(sp.type)} · 최대 ${sp.capacity}명</small></div>
        <div class="t">${txt}<br><small class="muted" style="font-weight:500">${total ? '총 ' + X.durText(total) + ' 비어 있음' : ''}</small></div></a>`;
    }).join('');
    const todayStr = X.ymd(X.today());
    const todays = S().reservations.filter(r => r.date === todayStr && r.status === 'approved').sort((a, b) => a.start - b.start).slice(0, 6);
    const cls = upcomingClasses().slice(0, 3);
    app.innerHTML = `
      <section class="hero"><div class="container">
        <div class="copy">
          <span class="badge badge-gold" style="align-self:flex-start;font-size:14px">베어토피아 시범 운영 중</span>
          <h1>캠퍼스의 빈 시간을,<br>지역과 함께 나눠요.</h1>
          <p>단국대학교 천안캠퍼스의 비어 있는 공간을 주민과 학생이 함께 쓰고, 학생이 여는 원데이클래스로 배움을 나눠요.</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px">
            <a class="btn btn-white" href="reserve.html">공간 대관 신청하기</a>
            <a class="btn btn-line-white" href="spaces.html">어떤 공간이 있나요?</a>
          </div>
        </div>
        <div class="today">
          <div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap">
            <strong style="font-size:18px">지금 신청할 수 있는 가장 빠른 날</strong><span class="muted small">${X.fmtDate(w.from)}</span>
          </div>
          ${rows}
          <span class="hint">이용일 ${C.applyUntilDays}일 전까지 신청할 수 있어서, 오늘 신청하면 ${X.fmtDate(w.from)}부터 이용할 수 있어요.</span>
          <a class="btn btn-ghost-blue" href="reserve.html?date=${w.from}">시간표에서 전체 보기</a>
        </div>
      </div></section>

      <div class="container">
        <section class="section">
          <div class="section-title"><h2>공간 대관</h2></div>
          <div class="grid-3">
            <a class="card link-card" href="spaces.html">${X.I.home}<strong>공간안내</strong><span class="muted">베어토피아와 강당·운동장·체육관·강의실의 위치, 인원, 운영 시간을 확인하세요.</span></a>
            <a class="card link-card" href="guide.html">${X.I.doc}<strong>대관안내</strong><span class="muted">신청 기간, 승인 절차, 이용 기준과 주의사항을 미리 읽어 주세요.</span></a>
            <a class="card link-card" href="reserve.html">${X.I.cal}<strong>대관신청</strong><span class="muted">날짜를 고르면 공간별 빈 시간이 시간표로 보여요. 30분 단위로 신청해요.</span></a>
          </div>
        </section>

        <section class="section" style="padding-top:0">
          <div class="section-title"><h2>이용 절차</h2><a href="guide.html" style="font-weight:600">대관안내 자세히 ›</a></div>
          <ol class="steps">
            <li><span class="num">1</span><strong>로그인</strong><span>재학생은 학번, 주민은 이름과 휴대폰 번호로 로그인해요.</span></li>
            <li><span class="num">2</span><strong>날짜 · 시간 선택</strong><span>이용일 ${C.applyFromDays}일 전부터 ${C.applyUntilDays}일 전까지, 시간표의 빈칸을 골라요.</span></li>
            <li><span class="num">3</span><strong>신청서 작성</strong><span>모임명, 목적, 인원을 적고 이용 기준에 동의해요.</span></li>
            <li><span class="num" style="background:var(--gold);color:var(--navy)">4</span><strong>${C.approvalDays}일 이내 승인</strong><span>운영팀이 학교 일정을 확인하고 결과를 알려 드려요.</span></li>
          </ol>
        </section>

        <section class="section" style="padding-top:0"><div class="split">
          <div class="main card">
            <div class="card-head"><h3>오늘의 대관 현황</h3><span class="muted small">${X.fmtDateFull(todayStr)}</span></div>
            <div class="table-wrap" style="border:0">
              <table class="tbl"><thead><tr><th>공간</th><th>시간</th><th>모임명</th><th>구분</th></tr></thead><tbody>
              ${todays.length ? todays.map(r => `<tr><td>${esc(X.spaceById(r.spaceId).name)}</td><td>${X.rangeText(r.start, r.end)}</td><td>${esc(r.group)}</td><td>${r.kind === 'class' ? '학생 수업' : X.roleLabel(r.role)}</td></tr>`).join('') : '<tr><td colspan="4" class="empty">오늘은 승인된 예약이 없어요</td></tr>'}
              </tbody></table>
            </div>
          </div>
          <div class="side card">
            <div class="card-head" style="margin-bottom:4px"><h3>공지사항</h3></div>
            <div class="notice-list">${BS.notices.map(n => `<a href="${esc(n.href)}"><b style="font-weight:600">${esc(n.title)}</b><span>${esc(n.date.replace(/-/g, '.'))}</span></a>`).join('')}</div>
          </div>
        </div></section>

        <section class="section" style="padding-top:0">
          <div class="section-title"><h2>학생이 여는 원데이클래스</h2><a href="classes.html" style="font-weight:600">전체 보기 ›</a></div>
          <div class="grid">${cls.map(classCard).join('') || '<p class="muted">모집 중인 수업이 없어요</p>'}</div>
        </section>
      </div>`;
  }

  /* =========================================================
     공간안내
     ========================================================= */
  function viewSpaces() {
    let filter = 'all';
    const spaceBody = sp => `
      <div style="display:flex;gap:6px;flex-wrap:wrap">${sp.example ? '<span class="badge badge-off">예시 정보</span>' : '<span class="badge badge-gold">시범 운영</span>'}<span class="tag">${esc(BS.categories[sp.category])}</span></div>
      <h3 style="font-size:${sp.example ? 20 : 27}px">${esc(sp.name)}</h3>
      <p class="muted">${esc(sp.desc)}</p>
      <dl class="kv">
        <dt>위치</dt><dd>${esc(sp.location)}</dd>
        <dt>수용 인원</dt><dd>최대 ${sp.capacity}명 · ${esc(sp.size)}</dd>
        <dt>비치 물품</dt><dd>${sp.equipment.map(esc).join(', ')}</dd>
        <dt>평일</dt><dd>${X.hoursText(sp.hours.weekday)}</dd>
        <dt>주말</dt><dd>${X.hoursText(sp.hours.weekend)}</dd>
      </dl>
      <a class="btn ${sp.example ? 'btn-ghost-blue' : 'btn-primary'}" href="reserve.html?cat=${sp.category}" style="align-self:flex-start">이 공간 예약하기</a>`;
    function draw() {
      const list = BS.spaces.filter(s => filter === 'all' || s.category === filter);
      const feat = list.find(s => !s.example), rest = list.filter(s => s.example);
      $('#space-list').innerHTML = `
        ${feat ? `<div class="card featured"><div class="photo">[${esc(feat.name)} 사진]</div><div class="body">${spaceBody(feat)}</div></div>` : ''}
        <div class="grid">${rest.map(s => `<div class="card space-card"><div class="photo">[${esc(s.name)} 사진]</div><div class="body">${spaceBody(s)}</div></div>`).join('')}</div>`;
      $$('#space-filter .chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === filter)));
    }
    app.innerHTML = `${pageHead('홈 › 공간 대관 › 공간안내', '공간안내', `대관할 수 있는 공간 ${BS.spaces.length}곳이에요. 베어토피아를 뺀 공간 정보는 시범용 예시예요.`)}
      <div class="container section stack">
        <div class="chips" id="space-filter" role="group" aria-label="공간 종류">
          <button class="chip" data-f="all">전체</button>${Object.entries(BS.categories).map(([k, v]) => `<button class="chip" data-f="${k}">${v}</button>`).join('')}
        </div>
        <div id="space-list" class="stack"></div>
      </div>`;
    $$('#space-filter .chip').forEach(b => b.addEventListener('click', () => { filter = b.dataset.f; draw(); }));
    draw();
  }

  /* =========================================================
     대관안내
     ========================================================= */
  function viewGuide() {
    app.innerHTML = `${pageHead('홈 › 공간 대관 › 대관안내', '대관안내', `시범 운영 기간에는 모든 공간을 무료로 이용할 수 있어요. 신청 후 운영팀 승인을 거쳐 확정돼요.`)}
      <div class="container section stack" style="gap:40px">
        <section class="stack" style="gap:16px">
          <h2 style="font-size:24px">신청 기간과 승인</h2>
          ${ruleBox()}
          <ul class="muted" style="margin:0;padding-left:20px">
            <li>예) 오늘 신청하면 ${X.fmtDate(X.applyWindow().from)}부터 ${X.fmtDate(X.applyWindow().to)}까지의 날짜를 고를 수 있어요.</li>
            <li>승인 결과는 늦어도 신청 후 ${C.approvalDays}일(주말 제외) 안에 내 예약 화면과 문자로 알려 드려요.</li>
            <li>일정을 바꾸려면 기존 신청을 취소하고 다시 신청해 주세요.</li>
          </ul>
        </section>

        <section class="stack" style="gap:16px">
          <h2 style="font-size:24px">대관 절차</h2>
          <ol class="steps">
            <li><span class="num">1</span><strong>로그인</strong><span>재학생은 학번, 지역주민은 이름·휴대폰 번호로 로그인하고 개인정보 수집에 동의해요.</span></li>
            <li><span class="num">2</span><strong>날짜·공간·시간 선택</strong><span>시간표에서 빈칸을 30분 단위로, 1회 최대 ${X.durText(C.maxSlots)}까지 골라요.</span></li>
            <li><span class="num">3</span><strong>신청서 작성·동의</strong><span>모임명, 이용 목적, 인원을 적고 이용 기준에 동의해요.</span></li>
            <li><span class="num">4</span><strong>운영팀 승인</strong><span>${C.approvalDays}일(평일) 안에 승인 또는 반려(사유 안내)돼요.</span></li>
            <li><span class="num" style="background:var(--gold);color:var(--navy)">5</span><strong>이용 · 정리</strong><span>예약 시간에 맞춰 이용하고, 원래대로 정리한 뒤 퇴실해요.</span></li>
          </ol>
        </section>

        <section class="stack" style="gap:16px">
          <h2 style="font-size:24px">공간별 이용 시간</h2>
          <div class="table-wrap"><table class="tbl"><thead><tr><th>공간</th><th>평일</th><th>주말</th><th>최대 인원</th><th>이용료</th></tr></thead><tbody>
            ${BS.spaces.map(s => `<tr><td style="font-weight:600">${esc(s.name)}${s.example ? ' <span class="muted small">(예시)</span>' : ''}</td><td>${X.hoursText(s.hours.weekday)}</td><td>${X.hoursText(s.hours.weekend)}</td><td>${s.capacity}명</td><td>무료</td></tr>`).join('')}
          </tbody></table></div>
          <p class="muted small">평일 낮 시간은 정규 수업과 재학생 이용을 위해 비워 둬요.</p>
        </section>

        <section class="stack" style="gap:16px" id="rules">
          <h2 style="font-size:24px">이용 기준</h2>
          <div class="grid">
            <div class="card" style="border-top:4px solid var(--blue)"><strong style="font-size:18px;color:var(--blue)">이렇게 이용할 수 있어요</strong><ul style="padding-left:20px;margin:12px 0 0">${BS.rules.allowed.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
            <div class="card" style="border-top:4px solid #B4441C"><strong style="font-size:18px;color:var(--bad)">이런 목적은 이용할 수 없어요</strong><ul style="padding-left:20px;margin:12px 0 0">${BS.rules.banned.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
          </div>
          <div class="card"><strong style="font-size:18px">이용 시 주의사항</strong><ul style="padding-left:20px;margin:12px 0 0">${BS.rules.notes.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
        </section>

        <section class="card" style="display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
          <div><strong style="font-size:18px">개인정보는 이렇게 다뤄요</strong>
            <p class="muted" style="margin-top:4px">예약에 꼭 필요한 이름·연락처(재학생은 학번)만 받고, 운영팀만 볼 수 있어요. 시범 운영이 끝나면 지체 없이 파기하고, 총무팀에는 개인을 알 수 없는 통계만 보내요.</p></div>
          <a class="btn btn-outline" href="privacy.html">개인정보처리방침 보기</a>
        </section>

        <div class="card" style="background:var(--navy);color:#fff;border:0;display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:space-between">
          <div><strong style="font-size:21px">이용 기준을 확인하셨나요?</strong><p style="color:#D3DCEC">시간표에서 빈 시간을 골라 바로 신청할 수 있어요.</p></div>
          <a class="btn btn-white" href="reserve.html">대관 신청하러 가기</a>
        </div>
      </div>`;
  }

  /* =========================================================
     대관신청 (시간표)
     ========================================================= */
  function viewReserve() {
    const w = X.applyWindow();
    const st = {
      date: params.get('date') && /^\d{4}-\d{2}-\d{2}$/.test(params.get('date')) ? params.get('date') : w.from,
      cat: BS.categories[params.get('cat')] ? params.get('cat') : 'all',
      sel: null, done: null
    };
    st.week = Math.max(0, Math.floor(X.daysFromToday(st.date) / 7));
    const maxWeek = Math.floor(C.applyFromDays / 7);

    app.innerHTML = `${pageHead('홈 › 공간 대관 › 대관신청', '대관신청', '날짜를 고르고 시간표의 빈칸을 눌러 주세요. 시작 칸과 끝 칸을 차례로 누르면 그 사이가 한 번에 선택돼요.')}
      <div class="container section stack" style="padding-top:28px">
        ${ruleBox()}
        <div class="card stack" style="padding:16px;gap:12px">
          <div class="datebar"><button class="navbtn" id="wk-prev" aria-label="이전 주">${X.I.left}</button><div class="days" id="days" role="group" aria-label="날짜 선택"></div><button class="navbtn" id="wk-next" aria-label="다음 주">${X.I.right}</button></div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between">
            <div class="chips" id="cat" role="group" aria-label="공간 종류"><button class="chip" data-f="all">전체</button>${Object.entries(BS.categories).map(([k, v]) => `<button class="chip" data-f="${k}">${v}</button>`).join('')}</div>
            <span id="day-note" class="small" style="color:var(--ink-2)"></span>
          </div>
        </div>
        <div class="split">
          <section class="main card" style="padding:0;overflow:hidden" aria-label="공간별 시간표">
            <div class="legend"><span><i class="lg-free"></i>예약 가능</span><span><i class="lg-sel"></i>내가 선택</span><span><i class="lg-book"></i>예약됨</span><span><i class="lg-wait"></i>승인 대기</span><span><i class="lg-off"></i>이용 불가</span></div>
            <div id="closed-note"></div>
            <div class="tt-scroll"><div class="tt" id="grid"></div></div>
          </section>
          <aside class="side" id="side"></aside>
        </div>
      </div>`;

    const spacesShown = () => BS.spaces.filter(s => st.cat === 'all' || s.category === st.cat);

    function drawDays() {
      const box = $('#days'); box.innerHTML = '';
      for (let i = 0; i < 7; i++) {
        const d = X.addDays(X.today(), st.week * 7 + i), ds = X.ymd(d), ok = X.canApplyFor(ds);
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'day' + (d.getDay() === 0 ? ' sun' : d.getDay() === 6 ? ' sat' : '') + (ok ? '' : ' closed');
        b.setAttribute('aria-pressed', String(ds === st.date));
        b.setAttribute('aria-label', `${X.fmtDate(ds)} ${ok ? '신청 가능' : '신청 기간 아님'}`);
        b.innerHTML = `<span class="w">${X.DOW[d.getDay()]}</span><span class="d">${d.getMonth() + 1}/${d.getDate()}</span><span class="s">${ok ? '신청 가능' : X.daysFromToday(ds) < C.applyUntilDays ? '신청 마감' : '오픈 전'}</span>`;
        b.addEventListener('click', () => { st.date = ds; st.sel = null; st.done = null; draw(); });
        box.appendChild(b);
      }
      $('#wk-prev').disabled = st.week <= 0;
      $('#wk-next').disabled = st.week >= maxWeek;
      const we = X.isWeekend(X.parseYmd(st.date));
      $('#day-note').textContent = `${X.fmtDate(st.date)} · ${we ? '주말: 체육관·운동장 18시부터, 베어토피아 07~21시' : '평일: 베어토피아 07~21시, 그 외 19~22시'}`;
      $$('#cat .chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === st.cat)));
    }

    function drawGrid() {
      const open = X.canApplyFor(st.date);
      $('#closed-note').innerHTML = open ? '' : `<div class="notice notice-warm" style="margin:12px 16px 0">${X.I.info}<span><strong>${X.fmtDate(st.date)}은 신청 기간이 아니에요.</strong> 이용일 ${C.applyFromDays}일 전부터 ${C.applyUntilDays}일 전까지만 신청할 수 있어요. 현황만 볼 수 있어요.</span></div>`;
      const sps = spacesShown();
      const isToday = X.daysFromToday(st.date) === 0, now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes();
      let html = `<div class="tt-row tt-head" style="--cols:${sps.length}"><div class="muted" style="text-align:right">시간</div>${sps.map(s => `<div><b>${esc(s.name)}</b><small>최대 ${s.capacity}명${s.example ? ' · 예시' : ''}</small></div>`).join('')}</div>`;
      const occs = sps.map(s => X.occupancy(s.id, st.date));
      for (let i = 0; i < X.SLOTS; i++) {
        const line = i % 2 ? 'line-hour' : 'line-half';
        html += `<div class="tt-row" style="--cols:${sps.length}"><div class="tt-time ${line}">${i % 2 ? '' : X.slotTime(i)}</div>`;
        sps.forEach((sp, k) => {
          const r = occs[k][i];
          const off = !X.withinHours(sp, st.date, i) || (isToday && X.slotMin(i) < nowMin) || X.daysFromToday(st.date) < 0;
          const sel = st.sel && st.sel.sp === sp.id && i >= st.sel.a && i < st.sel.b;
          let cls = 'cell', label = '', status = '예약 가능', dis = !open;
          if (off) { cls += ' off'; status = '이용 불가'; dis = true; if (i === 0 || X.withinHours(sp, st.date, i - 1)) label = X.withinHours(sp, st.date, i) ? '지난 시간' : '운영 시간 아님'; }
          else if (r) { cls += r.status === 'pending' ? ' wait' : ' book'; status = r.status === 'pending' ? '승인 대기' : '예약됨'; dis = true; if (i === r.start || i === 0) label = r.status === 'pending' ? '승인 대기' : r.group; }
          else if (sel) { cls += ' sel'; status = '선택함'; if (i === st.sel.a) label = '선택'; }
          html += `<button type="button" class="${cls} ${line}" data-sp="${sp.id}" data-i="${i}" ${dis ? 'disabled' : ''} aria-label="${esc(sp.name)} ${X.slotTime(i)}~${X.slotTime(i + 1)} ${status}">${esc(label)}</button>`;
        });
        html += '</div>';
      }
      $('#grid').innerHTML = html;
    }

    function drawSide() {
      const side = $('#side'), u = X.me();
      if (st.done) {
        const r = st.done;
        side.innerHTML = `<div class="card stack" style="border:2px solid var(--blue);gap:12px">${X.I.check}
          <strong style="font-size:21px">신청이 접수됐어요</strong>
          <div class="sel-box"><strong>${esc(X.spaceById(r.spaceId).name)}</strong><span>${X.fmtDateFull(r.date)}</span><span class="t">${X.rangeText(r.start, r.end)}</span></div>
          <p class="small" style="color:var(--ink-2)">신청 번호 <b>${esc(r.id.toUpperCase())}</b><br>운영팀이 학교 일정을 확인한 뒤 <b>${X.fmtDate(X.ymd(X.approveDeadline(r)))}까지</b> 승인 여부를 알려 드려요.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-primary" href="mypage.html">내 예약 보기</a><button class="btn btn-outline" id="again">다른 시간 신청</button></div></div>`;
        $('#again').addEventListener('click', () => { st.done = null; st.sel = null; draw(); });
        return;
      }
      const sel = st.sel;
      const selHtml = sel ? `<div class="sel-box"><strong>${esc(X.spaceById(sel.sp).name)}</strong><span>${X.fmtDateFull(st.date)}</span><span class="t">${X.rangeText(sel.a, sel.b)} · ${X.durText(sel.b - sel.a)}</span></div>`
        : `<p class="muted small">아직 고르지 않았어요. 시간표의 흰 칸을 눌러 주세요.</p>`;
      let form;
      if (!u) form = `<div class="card stack" style="gap:10px"><strong style="font-size:17px">로그인 후 신청할 수 있어요</strong><p class="muted small">시간표는 로그인 없이 볼 수 있어요. 신청하려면 재학생은 학번, 주민은 이름·휴대폰 번호로 로그인해 주세요.</p><a class="btn btn-navy" href="login.html?next=reserve">로그인하고 신청하기</a></div>`;
      else if (u.role === 'admin') form = `<div class="card"><p class="muted small">관리자 계정으로는 신청할 수 없어요. 재학생이나 주민으로 로그인해 주세요.</p></div>`;
      else {
        const sp = sel ? X.spaceById(sel.sp) : null;
        form = `<form class="card" id="apply-form" novalidate>
          <strong style="font-size:17px;display:block;margin-bottom:12px">신청 정보</strong>
          <div class="notice" style="margin-bottom:14px">${X.I.info}<span>신청자: <b>${esc(u.name)}</b> (${X.roleLabel(u.role)}, ${esc(u.role === 'student' ? '학번 ' + u.studentId.slice(0, 4) + '****' : X.maskPhone(u.phone))})<br>로그인할 때 동의한 정보만 사용해요.</span></div>
          <div class="field"><label for="f-group">모임·단체 이름<span class="req">*</span></label><input class="input" id="f-group" name="group" placeholder="예) 안서동 독서 모임"></div>
          <div class="row-2">
            <div class="field"><label for="f-purpose">이용 목적<span class="req">*</span></label><select class="input" id="f-purpose" name="purpose"><option value="">선택</option>${BS.purposes.map(p => `<option>${p}</option>`).join('')}</select></div>
            <div class="field"><label for="f-count">이용 인원<span class="req">*</span></label><input class="input" id="f-count" name="count" type="number" min="1" ${sp ? `max="${sp.capacity}"` : ''} placeholder="${sp ? '최대 ' + sp.capacity + '명' : '10'}"></div>
          </div>
          <div class="field"><label for="f-detail">활동 내용</label><textarea class="input" id="f-detail" name="detail" rows="3" placeholder="예) 매주 한 권씩 읽고 이야기 나누는 정기 모임"></textarea></div>
          <div class="notice notice-warm" style="flex-direction:column;gap:6px;margin-bottom:14px">
            <strong>대관 전 꼭 확인해 주세요</strong>
            <ul style="margin:0;padding-left:18px;font-size:13px">
              <li>정치·종교 목적 모임, 판매·광고 등 영리 행위는 이용할 수 없어요.</li>
              <li>스터디, 동호회, 소모임, 재료비·실비 수준 참가비의 소규모 강습은 가능해요.</li>
              <li>준비·정리 시간을 포함해 신청하고, 예약 시간에 맞춰 입·퇴실해 주세요.</li>
              <li>음주·흡연 금지. 사용 후 원래대로 정리하고 쓰레기는 직접 수거해 주세요.</li>
              <li>학교 일정과 겹치면 승인 후에도 취소될 수 있어요.</li>
            </ul>
            <a href="guide.html#rules" class="small" style="font-weight:600">이용 기준 전체 보기</a>
          </div>
          <label class="check" style="margin-bottom:14px"><input type="checkbox" name="agree"><span>위 이용 기준과 주의사항을 확인했으며 지키겠습니다. <span class="req">(필수)</span></span></label>
          <button class="btn btn-primary btn-block" type="submit" style="height:52px" ${sel && X.canApplyFor(st.date) ? '' : 'disabled'}>대관 신청하기</button>
          <p class="hint" style="text-align:center;margin-top:8px">무료 · 신청 후 ${C.approvalDays}일(평일) 이내 승인 여부 안내</p>
        </form>`;
      }
      side.innerHTML = `<div class="card stack" style="gap:10px"><strong style="font-size:17px">선택한 시간</strong>${selHtml}</div>${form}`;
      const f = $('#apply-form'); if (f) f.addEventListener('submit', submit);
    }

    function submit(e) {
      e.preventDefault();
      const f = e.target, u = X.me(), sel = st.sel; X.clearErrors(f);
      if (!sel) return;
      const sp = X.spaceById(sel.sp), v = Object.fromEntries(new FormData(f));
      let bad = false;
      if (!String(v.group || '').trim()) { X.fieldError(f, 'group', '모임·단체 이름을 적어 주세요'); bad = true; }
      if (!v.purpose) { X.fieldError(f, 'purpose', '이용 목적을 골라 주세요'); bad = true; }
      const n = Number(v.count);
      if (!n || n < 1) { X.fieldError(f, 'count', '인원을 적어 주세요'); bad = true; }
      else if (n > sp.capacity) { X.fieldError(f, 'count', `이 공간은 최대 ${sp.capacity}명이에요`); bad = true; }
      if (!f.elements.agree.checked) { X.fieldError(f, 'agree', '이용 기준에 동의해야 신청할 수 있어요'); bad = true; }
      if (!X.canApplyFor(st.date)) { X.toast('신청 기간이 아닌 날짜예요'); bad = true; }
      const occ = X.occupancy(sp.id, st.date);
      for (let i = sel.a; i < sel.b; i++) if (occ[i]) { X.toast('방금 다른 신청이 들어온 시간이에요. 다시 골라 주세요'); st.sel = null; draw(); return; }
      if (bad) { const first = $('.invalid', f); if (first) first.focus(); return; }
      const r = { id: X.uid('r'), kind: 'rental', spaceId: sp.id, date: st.date, start: sel.a, end: sel.b, status: 'pending',
        name: u.name, phone: u.phone || '', studentId: u.studentId || '', role: u.role, purpose: v.purpose, group: v.group.trim(),
        detail: String(v.detail || '').trim(), count: n, userId: u.id, createdAt: Date.now(), decidedAt: null };
      S().reservations.push(r); X.persist();
      st.done = r; st.sel = null; draw(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function pick(spId, i) {
      const cur = st.sel;
      const free = k => !X.occupancy(spId, st.date)[k] && X.withinHours(X.spaceById(spId), st.date, k);
      if (cur && cur.sp === spId && cur.b - cur.a === 1) {
        if (i === cur.a) { st.sel = null; return draw(); }
        const a = Math.min(cur.a, i), b = Math.max(cur.a, i) + 1;
        let ok = true; for (let k = a; k < b; k++) if (!free(k)) ok = false;
        if (ok && b - a > C.maxSlots) { X.toast(`1회 최대 ${X.durText(C.maxSlots)}까지 신청할 수 있어요`); ok = false; }
        st.sel = ok ? { sp: spId, a, b } : { sp: spId, a: i, b: i + 1 };
      } else st.sel = { sp: spId, a: i, b: i + 1 };
      st.done = null; draw();
    }

    function draw() { drawDays(); drawGrid(); drawSide(); }
    $('#grid').addEventListener('click', e => { const b = e.target.closest('button[data-sp]'); if (b && !b.disabled) pick(b.dataset.sp, Number(b.dataset.i)); });
    $('#wk-prev').addEventListener('click', () => { st.week = Math.max(0, st.week - 1); drawDays(); });
    $('#wk-next').addEventListener('click', () => { st.week = Math.min(maxWeek, st.week + 1); drawDays(); });
    $$('#cat .chip').forEach(b => b.addEventListener('click', () => { st.cat = b.dataset.f; if (st.sel && !spacesShown().some(s => s.id === st.sel.sp)) st.sel = null; draw(); }));
    draw();
  }

  /* =========================================================
     수업 둘러보기
     ========================================================= */
  function viewClasses() {
    let field = 'all';
    const fields = ['디지털', '생활체육', '교육', '인문·사회', '문화·예술', '기타'];
    app.innerHTML = `${pageHead('홈 › 수업 둘러보기', '학생이 여는 원데이클래스', '재학생이 제안하고 운영팀이 승인한 수업을 주민 누구나 신청할 수 있어요.', `<a class="btn btn-gold" href="propose.html">재학생: 수업 제안하기</a>`)}
      <div class="container section stack" style="gap:32px">
        <section class="card stack" style="gap:16px">
          <h2 style="font-size:21px">수업은 이렇게 열려요</h2>
          <ol class="steps">
            <li style="background:var(--bg);border:0"><span class="num">1</span><strong>재학생 수업 제안</strong><span>가르칠 주제, 희망 공간·시간, 정원을 적어 제안해요.</span></li>
            <li style="background:var(--bg);border:0"><span class="num">2</span><strong>운영팀 검토·승인</strong><span>이용 기준과 학교 일정을 확인하고, 승인되면 공간이 함께 예약돼요.</span></li>
            <li style="background:var(--bg);border:0"><span class="num">3</span><strong>주민 신청·참여</strong><span>열린 수업을 골라 신청하고 참여해요.</span></li>
          </ol>
        </section>
        <section class="stack" style="gap:16px">
          <div class="section-title" style="margin:0"><h2>모집 중인 수업 <span class="count" id="cnt"></span></h2>
            <div class="chips" id="fields" role="group" aria-label="분야"><button class="chip" data-f="all">전체</button>${fields.map(f => `<button class="chip" data-f="${f}">${f}</button>`).join('')}</div></div>
          <div class="grid" id="class-list"></div>
          <p class="muted small">수업 내용과 강사 정보는 예시예요. 강사 이름은 개인정보 보호를 위해 김○○처럼 가려서 보여 줘요.</p>
        </section>
      </div>`;
    function draw() {
      const list = upcomingClasses().filter(c => field === 'all' || c.field === field);
      $('#cnt').textContent = list.length;
      $('#class-list').innerHTML = list.map(classCard).join('') || '<p class="muted">이 분야의 수업이 아직 없어요.</p>';
      $$('#fields .chip').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.f === field)));
    }
    $$('#fields .chip').forEach(b => b.addEventListener('click', () => { field = b.dataset.f; draw(); }));
    $('#class-list').addEventListener('click', e => { const b = e.target.closest('[data-apply]'); if (b) applyClass(b.dataset.apply, draw); });
    draw();
  }

  function applyClass(id, after) {
    const u = X.me(), c = S().classes.find(x => x.id === id);
    if (!u) { X.toast('로그인 후 신청할 수 있어요'); setTimeout(() => location.href = 'login.html?next=classes', 600); return; }
    if (u.role === 'admin') { X.toast('관리자 계정으로는 신청할 수 없어요'); return; }
    const left = c.capacity - c.applied;
    const m = X.openModal(`<h2>수업 신청</h2><p class="sub">${esc(c.title)} · ${X.fmtDate(c.date)} ${esc(c.start)}~${esc(c.end)}</p>
      <form id="cls-form" novalidate>
        <div class="notice" style="margin-bottom:14px">${X.I.info}<span>신청자: <b>${esc(u.name)}</b> · 남은 자리 ${left}명<br>수업 안내 연락에는 로그인할 때 동의한 정보만 사용해요.</span></div>
        <div class="field"><label for="c-n">함께 오는 인원 (본인 포함)</label><select class="input" id="c-n" name="n">${[1, 2, 3, 4].filter(n => n <= left).map(n => `<option>${n}</option>`).join('')}</select></div>
        <label class="check"><input type="checkbox" name="agree"><span>수업 장소의 이용 기준을 지키겠습니다. <span class="req">(필수)</span></span></label>
        <div class="modal-actions"><button type="button" class="btn btn-outline" data-close>닫기</button><button class="btn btn-primary" type="submit">신청하기</button></div>
      </form>`);
    $('#cls-form', m).addEventListener('submit', e => {
      e.preventDefault(); const f = e.target; X.clearErrors(f);
      if (!f.elements.agree.checked) { X.fieldError(f, 'agree', '동의해 주세요'); return; }
      const n = Number(f.elements.n.value);
      c.applied += n;
      S().applications.push({ id: X.uid('a'), classId: c.id, userId: u.id, name: u.name, count: n, status: 'applied', createdAt: Date.now() });
      X.persist(); X.closeModal(); X.toast('수업 신청을 마쳤어요. 내 예약에서 확인할 수 있어요'); after();
    });
  }

  /* =========================================================
     수업 제안 (재학생)
     ========================================================= */
  function viewPropose() {
    const u = X.me();
    const head = pageHead('홈 › 수업 둘러보기 › 수업 제안', '원데이클래스 제안하기', '재학생이 직접 가르칠 수업을 제안해요. 운영팀이 승인하면 공간이 함께 예약되고 수업 목록에 올라가요.');
    if (!u || u.role !== 'student') {
      app.innerHTML = `${head}<div class="container section"><div class="card stack" style="max-width:560px;gap:12px">
        <strong style="font-size:19px">수업 제안은 재학생만 할 수 있어요</strong>
        <p class="muted">${u ? '지금은 ' + X.roleLabel(u.role) + ' 계정으로 로그인되어 있어요. ' : ''}학번으로 로그인한 뒤 다시 와 주세요.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-navy" href="login.html?next=propose&tab=student">재학생 로그인</a><a class="btn btn-outline" href="classes.html">수업 둘러보기</a></div>
      </div></div>`;
      return;
    }
    const w = X.applyWindow();
    const times = []; for (let i = 0; i <= X.SLOTS; i++) times.push(X.slotTime(i));
    app.innerHTML = `${head}<div class="container section"><div class="split">
      <div class="main" id="prop-main">
        <form class="card" id="prop-form" novalidate>
          <h2 style="font-size:20px;margin-bottom:16px">수업 정보</h2>
          <div class="field"><label for="p-title">수업 제목<span class="req">*</span></label><input class="input" id="p-title" name="title" placeholder="예) 어르신 스마트폰 기초 교실"></div>
          <div class="row-2">
            <div class="field"><label for="p-field">분야<span class="req">*</span></label><select class="input" id="p-field" name="field"><option value="">선택</option>${['디지털', '생활체육', '교육', '인문·사회', '문화·예술', '기타'].map(x => `<option>${x}</option>`).join('')}</select></div>
            <div class="field"><label for="p-dept">학과 · 학년<span class="req">*</span></label><input class="input" id="p-dept" name="dept" placeholder="예) 공공정책학과 3학년"></div>
          </div>
          <div class="field"><label for="p-desc">수업 소개<span class="req">*</span></label><textarea class="input" id="p-desc" name="desc" placeholder="무엇을, 어떤 순서로 진행하는지 적어 주세요"></textarea></div>
          <div class="row-2">
            <div class="field"><label for="p-target">대상</label><input class="input" id="p-target" name="target" placeholder="예) 지역 주민 누구나"></div>
            <div class="field"><label for="p-supplies">준비물</label><input class="input" id="p-supplies" name="supplies" placeholder="예) 스마트폰"></div>
          </div>
          <div class="row-2">
            <div class="field"><label for="p-cap">정원<span class="req">*</span></label><input class="input" id="p-cap" type="number" min="1" name="capacity" placeholder="예) 12"></div>
            <div class="field"><label for="p-fee">참가비</label><select class="input" id="p-fee" name="fee"><option>무료</option><option>재료비 3,000원</option><option>재료비 5,000원</option></select><span class="hint">영리 목적의 수강료는 받을 수 없어요</span></div>
          </div>
          <h2 style="font-size:20px;margin:10px 0 16px">희망 공간과 시간</h2>
          <div class="row-2">
            <div class="field"><label for="p-space">공간<span class="req">*</span></label><select class="input" id="p-space" name="spaceId">${BS.spaces.map(s => `<option value="${s.id}">${esc(s.name)} (최대 ${s.capacity}명)</option>`).join('')}</select></div>
            <div class="field"><label for="p-date">날짜<span class="req">*</span></label><input class="input" id="p-date" type="date" name="date" min="${w.from}" max="${w.to}"><span class="hint">${X.fmtDate(w.from)} ~ ${X.fmtDate(w.to)} 중에서 골라요</span></div>
          </div>
          <div class="row-2">
            <div class="field"><label for="p-start">시작<span class="req">*</span></label><select class="input" id="p-start" name="start">${times.slice(0, -1).map(t => `<option ${t === '14:00' ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
            <div class="field"><label for="p-end">종료<span class="req">*</span></label><select class="input" id="p-end" name="end">${times.slice(1).map(t => `<option ${t === '16:00' ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          </div>
          ${X.consentBox('agreeInfo', '이름, 학번, 학과·학년', '수업 제안 검토, 승인 결과 안내, 수업 목록 게시 (게시할 때 이름은 김○○처럼 가림)')}
          <label class="check" style="margin-bottom:16px"><input type="checkbox" name="agreeRule"><span>정치·종교·영리 목적이 아니며, 이용 기준과 학교 일정을 지키겠습니다. <span class="req">(필수)</span></span></label>
          <button class="btn btn-primary btn-block" type="submit" style="height:52px">제안 보내기</button>
        </form>
      </div>
      <aside class="side">
        <div class="card stack" style="gap:10px"><strong style="font-size:17px">제안자</strong><p>${esc(u.name)} · 학번 ${esc(u.studentId.slice(0, 4))}****</p><p class="hint">수업 목록에는 ${esc(X.maskName(u.name))}처럼 가려서 보여요.</p></div>
        <div class="card stack" style="gap:10px"><strong style="font-size:17px">이렇게 처리돼요</strong>
          <ol style="margin:0;padding-left:18px;color:var(--ink-2);font-size:14px">
            <li>제안을 보내면 '검토 중'이 돼요.</li>
            <li>운영팀이 ${C.approvalDays}일(평일) 안에 이용 기준과 학교 일정을 확인해요.</li>
            <li>승인되면 그 시간에 공간이 자동으로 예약되고, 수업 목록에 올라가요.</li>
            <li>진행 상황은 내 예약 › 내 수업 제안에서 볼 수 있어요.</li>
          </ol></div>
        <div class="notice">${X.I.info}<span>희망 시간은 대관신청 시간표에서 빈 시간을 먼저 확인하면 좋아요. <a href="reserve.html">시간표 보기</a></span></div>
      </aside></div></div>`;

    $('#prop-form').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target; X.clearErrors(f);
      const v = Object.fromEntries(new FormData(f));
      let bad = false;
      [['title', '수업 제목'], ['field', '분야'], ['dept', '학과·학년'], ['desc', '수업 소개'], ['date', '날짜']].forEach(([k, l]) => { if (!String(v[k] || '').trim()) { X.fieldError(f, k, l + '을(를) 입력해 주세요'); bad = true; } });
      const sp = X.spaceById(v.spaceId), s = X.timeToSlot(v.start), en = X.timeToSlot(v.end);
      const cap = Number(v.capacity);
      if (!cap || cap < 1) { X.fieldError(f, 'capacity', '정원을 적어 주세요'); bad = true; } else if (cap > sp.capacity) { X.fieldError(f, 'capacity', `이 공간은 최대 ${sp.capacity}명이에요`); bad = true; }
      if (en <= s) { X.fieldError(f, 'end', '시작보다 늦어야 해요'); bad = true; }
      else if (en - s > C.maxSlots) { X.fieldError(f, 'end', `1회 최대 ${X.durText(C.maxSlots)}까지예요`); bad = true; }
      if (v.date && !X.canApplyFor(v.date)) { X.fieldError(f, 'date', `이용일 ${C.applyFromDays}일 전 ~ ${C.applyUntilDays}일 전 날짜만 고를 수 있어요`); bad = true; }
      if (!bad && v.date) {
        const occ = X.occupancy(sp.id, v.date);
        for (let i = s; i < en; i++) {
          if (!X.withinHours(sp, v.date, i)) { X.fieldError(f, 'start', `그날 ${sp.name} 운영 시간은 ${X.hoursText(X.hoursFor(sp, v.date))}이에요`); bad = true; break; }
          if (occ[i]) { X.fieldError(f, 'start', '그 시간엔 이미 예약이 있어요. 시간표에서 빈 시간을 확인해 주세요'); bad = true; break; }
        }
      }
      if (!f.elements.agreeInfo.checked) { X.fieldError(f, 'agreeInfo', '개인정보 수집·이용에 동의해 주세요'); bad = true; }
      if (!f.elements.agreeRule.checked) { X.fieldError(f, 'agreeRule', '이용 기준에 동의해 주세요'); bad = true; }
      if (bad) { const first = $('.invalid', f); if (first) first.focus(); return; }
      const p = { id: X.uid('p'), title: v.title.trim(), field: v.field, dept: v.dept.trim(), spaceId: sp.id, date: v.date, start: v.start, end: v.end,
        capacity: cap, fee: v.fee, target: String(v.target || '').trim() || '지역 주민 누구나', supplies: String(v.supplies || '').trim(), desc: v.desc.trim(),
        host: X.maskName(u.name), hostName: u.name, studentId: u.studentId, userId: u.id, status: 'pending', createdAt: Date.now() };
      S().proposals.push(p); X.persist();
      $('#prop-main').innerHTML = `<div class="card stack" style="border:2px solid var(--blue);gap:12px">${X.I.check}<strong style="font-size:21px">수업 제안을 보냈어요</strong>
        <p style="color:var(--ink-2)"><b>${esc(p.title)}</b><br>${esc(sp.name)} · ${X.fmtDate(p.date)} ${esc(p.start)}~${esc(p.end)}</p>
        <p class="muted">운영팀이 <b>${X.fmtDate(X.ymd(X.approveDeadline(p)))}까지</b> 검토 결과를 알려 드려요.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-primary" href="mypage.html#proposals">내 수업 제안 보기</a><a class="btn btn-outline" href="classes.html">수업 둘러보기</a></div></div>`;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* =========================================================
     로그인
     ========================================================= */
  function viewLogin() {
    const NEXT = { reserve: 'reserve.html', classes: 'classes.html', propose: 'propose.html', mypage: 'mypage.html' };
    let tab = params.get('tab') === 'resident' ? 'resident' : 'student';
    function draw() {
      app.innerHTML = `<div class="container section" style="display:flex;justify-content:center">
        <div class="card stack" style="width:100%;max-width:460px;gap:18px;padding:32px 28px">
          <div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:6px">${X.I.bear.replace('width="32" height="32"', 'width="48" height="48"')}
            <h1 style="font-size:25px">Bearshare 로그인</h1><p class="muted small">공간 대관과 수업 신청은 로그인 후 이용할 수 있어요.</p></div>
          <div class="seg" role="tablist" aria-label="회원 구분">
            <button role="tab" type="button" data-tab="student" aria-selected="${tab === 'student'}">재학생</button>
            <button role="tab" type="button" data-tab="resident" aria-selected="${tab === 'resident'}">지역주민</button>
          </div>
          <form id="login-form" novalidate>
            <div class="field"><label for="l-name">이름<span class="req">*</span></label><input class="input" id="l-name" name="name" autocomplete="name" placeholder="홍길동"></div>
            ${tab === 'student'
              ? `<div class="field"><label for="l-sid">학번<span class="req">*</span></label><input class="input" id="l-sid" name="studentId" inputmode="numeric" maxlength="8" placeholder="8자리 숫자"><span class="hint">학번 인증 후 수업 제안을 할 수 있어요.</span></div>
                 ${X.consentBox('agree', '이름, 학번', '본인 확인, 대관·수업 신청 처리와 결과 안내')}`
              : `<div class="field"><label for="l-phone">휴대폰 번호<span class="req">*</span></label><input class="input" id="l-phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="010-0000-0000"></div>
                 ${X.consentBox('agree', '이름, 휴대폰 번호', '본인 확인, 대관·수업 신청 처리와 결과 안내 연락')}
                 <label class="check" style="margin-bottom:14px"><input type="checkbox" name="age14"><span>만 14세 이상입니다. <span class="req">(필수)</span><br><span class="hint">만 14세 미만은 보호자가 대신 로그인해 신청해 주세요.</span></span></label>`}
            <button class="btn btn-navy btn-block" type="submit" style="height:52px">${tab === 'student' ? '학번 인증하고 로그인' : '로그인'}</button>
          </form>
          <div class="notice">${X.I.info}<span>시연용 화면이에요. 실제 학사 시스템·본인인증과 연결되지 않고, 입력한 정보는 이 브라우저에만 저장돼요.</span></div>
          <p class="small muted" style="text-align:center">운영팀이신가요? <button type="button" id="admin-demo" style="border:0;background:none;color:var(--blue);font-weight:700;cursor:pointer;padding:4px">관리자 화면 체험하기</button></p>
        </div></div>`;
      $$('.seg button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
      $('#login-form').addEventListener('submit', submit);
      $('#admin-demo').addEventListener('click', () => { X.login({ id: 'admin', role: 'admin', name: '운영팀' }); location.href = 'admin.html'; });
    }
    function submit(e) {
      e.preventDefault(); const f = e.target; X.clearErrors(f);
      const v = Object.fromEntries(new FormData(f)); let bad = false;
      const name = String(v.name || '').trim();
      if (!name) { X.fieldError(f, 'name', '이름을 입력해 주세요'); bad = true; }
      if (tab === 'student') { if (!/^\d{8}$/.test(String(v.studentId || '').trim())) { X.fieldError(f, 'studentId', '학번 8자리 숫자를 입력해 주세요'); bad = true; } }
      else {
        if (!/^01[016789]-?\d{3,4}-?\d{4}$/.test(String(v.phone || '').trim())) { X.fieldError(f, 'phone', '휴대폰 번호 형식을 확인해 주세요'); bad = true; }
        if (!f.elements.age14.checked) { X.fieldError(f, 'age14', '만 14세 미만은 보호자가 신청해 주세요'); bad = true; }
      }
      if (!f.elements.agree.checked) { X.fieldError(f, 'agree', '개인정보 수집·이용에 동의해야 이용할 수 있어요'); bad = true; }
      if (bad) { const first = $('.invalid', f); if (first) first.focus(); return; }
      if (tab === 'student') { const sid = v.studentId.trim(); X.login({ id: 'student:' + sid, role: 'student', name, studentId: sid, agreedAt: Date.now() }); }
      else { const d = v.phone.replace(/\D/g, ''); X.login({ id: 'resident:' + d, role: 'resident', name, phone: d.replace(/(\d{3})(\d{3,4})(\d{4})/, '$1-$2-$3'), agreedAt: Date.now() }); }
      X.toast(`${name}님, 환영해요`);
      setTimeout(() => { location.href = NEXT[params.get('next')] || 'index.html'; }, 500);
    }
    draw();
  }

  /* =========================================================
     내 예약
     ========================================================= */
  function viewMy() {
    const u = X.me();
    if (!u || u.role === 'admin') {
      app.innerHTML = `${pageHead('홈 › 내 예약', '내 예약 · 신청 내역')}<div class="container section"><div class="card stack" style="max-width:520px;gap:12px">
        <strong style="font-size:19px">${u ? '관리자 계정은 관리자 화면을 이용해 주세요' : '로그인 후 볼 수 있어요'}</strong>
        <a class="btn btn-navy" style="align-self:flex-start" href="${u ? 'admin.html' : 'login.html?next=mypage'}">${u ? '관리자 화면' : '로그인'}</a></div></div>`;
      return;
    }
    function draw() {
      const mine = S().reservations.filter(r => r.userId === u.id && r.kind === 'rental').sort((a, b) => b.createdAt - a.createdAt);
      const apps = S().applications.filter(a => a.userId === u.id);
      const props = S().proposals.filter(p => p.userId === u.id).sort((a, b) => b.createdAt - a.createdAt);
      const count = st => mine.filter(r => st(r)).length;
      app.innerHTML = `${pageHead('홈 › 내 예약', '내 예약 · 신청 내역', '', `<a class="btn btn-white" href="reserve.html">새로 신청하기</a>`)}
      <div class="container section"><div class="split">
        <aside class="side" style="flex:1 1 260px">
          <div class="card stack" style="gap:12px">
            <div style="display:flex;gap:12px;align-items:center"><div style="width:48px;height:48px;border-radius:50%;background:var(--blue-soft);color:var(--blue);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px">${esc(u.name[0])}</div>
              <div><strong style="font-size:17px">${esc(u.name)}님</strong><div class="muted small">${X.roleLabel(u.role)} · ${esc(u.role === 'student' ? '학번 ' + u.studentId.slice(0, 4) + '****' : X.maskPhone(u.phone))}</div></div></div>
            <nav aria-label="내 예약 메뉴" style="display:flex;flex-direction:column;gap:2px">
              <a href="#rentals" class="btn btn-sm btn-outline" style="justify-content:flex-start">대관 신청 내역</a>
              <a href="#classes" class="btn btn-sm btn-outline" style="justify-content:flex-start">수업 신청 내역</a>
              ${u.role === 'student' ? '<a href="#proposals" class="btn btn-sm btn-outline" style="justify-content:flex-start">내 수업 제안</a>' : ''}
              <a href="#privacy" class="btn btn-sm btn-outline" style="justify-content:flex-start">내 개인정보</a>
            </nav>
          </div>
        </aside>
        <div class="main stack" style="flex:999 1 640px">
          <div class="stat-grid">
            <div class="stat"><span>승인 대기</span><b style="color:var(--wait)">${count(r => r.status === 'pending')}</b></div>
            <div class="stat"><span>승인 완료</span><b>${count(r => r.status === 'approved' && X.daysFromToday(r.date) >= 0)}</b></div>
            <div class="stat"><span>이용 완료</span><b style="color:var(--ok)">${count(r => r.status === 'approved' && X.daysFromToday(r.date) < 0)}</b></div>
            <div class="stat"><span>반려·취소</span><b style="color:var(--muted)">${count(r => r.status === 'rejected' || r.status === 'cancelled')}</b></div>
          </div>
          <section class="card" id="rentals"><div class="card-head"><h3>대관 신청 <span class="count">${mine.length}</span></h3></div>
            <div class="table-wrap" style="border:0"><table class="tbl"><thead><tr><th>공간</th><th>이용 일시</th><th>모임 · 목적</th><th>상태</th><th class="actions"><span class="sr-only">관리</span></th></tr></thead><tbody>
            ${mine.length ? mine.map(r => `<tr><td style="font-weight:600">${esc(X.spaceById(r.spaceId).name)}</td><td>${X.fmtDate(r.date)}<br><span class="muted small">${X.rangeText(r.start, r.end)}</span></td>
              <td>${esc(r.group)}<br><span class="muted small">${esc(r.purpose)} · ${r.count}명</span></td>
              <td>${statusBadge(r)}${r.status === 'pending' ? `<br><span class="hint">${X.fmtDate(X.ymd(X.approveDeadline(r)))}까지 안내</span>` : ''}${r.status === 'rejected' ? `<br><span class="hint">사유: ${esc(r.rejectReason || '')}</span>` : ''}</td>
              <td class="actions">${(r.status === 'pending' || r.status === 'approved') && X.daysFromToday(r.date) >= 0 ? `<button class="btn btn-sm btn-danger" data-cancel="${r.id}">${r.status === 'pending' ? '신청 취소' : '예약 취소'}</button>` : ''}</td></tr>`).join('')
              : '<tr><td colspan="5" class="empty">아직 대관 신청이 없어요. <a href="reserve.html">대관신청</a></td></tr>'}
            </tbody></table></div></section>
          <section class="card" id="classes"><div class="card-head"><h3>수업 신청 <span class="count">${apps.filter(a => a.status !== 'cancelled').length}</span></h3><a href="classes.html" class="small" style="font-weight:600">수업 둘러보기 ›</a></div>
            <div class="table-wrap" style="border:0"><table class="tbl"><thead><tr><th>수업</th><th>일시</th><th>인원</th><th>상태</th><th class="actions"><span class="sr-only">관리</span></th></tr></thead><tbody>
            ${apps.length ? apps.map(a => { const c = S().classes.find(x => x.id === a.classId) || {}; return `<tr><td style="font-weight:600">${esc(c.title)}</td><td>${c.date ? X.fmtDate(c.date) : ''} ${esc(c.start || '')}</td><td>${a.count}명</td>
              <td>${a.status === 'cancelled' ? '<span class="badge badge-off">취소</span>' : '<span class="badge badge-blue">신청 완료</span>'}</td>
              <td class="actions">${a.status !== 'cancelled' && c.date && X.daysFromToday(c.date) >= 0 ? `<button class="btn btn-sm btn-danger" data-cancel-app="${a.id}">신청 취소</button>` : ''}</td></tr>`; }).join('')
              : '<tr><td colspan="5" class="empty">아직 신청한 수업이 없어요.</td></tr>'}
            </tbody></table></div></section>
          ${u.role === 'student' ? `<section class="card" id="proposals"><div class="card-head"><h3>내 수업 제안 <span class="count">${props.length}</span></h3><a href="propose.html" class="small" style="font-weight:600">새 수업 제안 ›</a></div>
            <div class="table-wrap" style="border:0"><table class="tbl"><thead><tr><th>수업</th><th>희망 공간 · 일시</th><th>상태</th><th class="actions"><span class="sr-only">관리</span></th></tr></thead><tbody>
            ${props.length ? props.map(p => `<tr><td style="font-weight:600">${esc(p.title)}</td><td>${esc(X.spaceById(p.spaceId).name)}<br><span class="muted small">${X.fmtDate(p.date)} ${esc(p.start)}~${esc(p.end)}</span></td>
              <td>${p.status === 'pending' ? `<span class="badge badge-wait">검토 중</span><br><span class="hint">${X.fmtDate(X.ymd(X.approveDeadline(p)))}까지 안내</span>` : p.status === 'approved' ? '<span class="badge badge-ok">승인 · 수업 게시</span>' : p.status === 'rejected' ? `<span class="badge badge-bad">반려</span><br><span class="hint">사유: ${esc(p.rejectReason || '')}</span>` : '<span class="badge badge-off">취소</span>'}</td>
              <td class="actions">${p.status === 'pending' ? `<button class="btn btn-sm btn-danger" data-cancel-prop="${p.id}">제안 취소</button>` : ''}</td></tr>`).join('')
              : '<tr><td colspan="4" class="empty">아직 제안한 수업이 없어요.</td></tr>'}
            </tbody></table></div></section>` : ''}
          <section class="card stack" id="privacy" style="gap:12px"><h3 style="font-size:18px">내 개인정보</h3>
            <div class="table-wrap"><table class="tbl" style="min-width:0"><tbody>
              <tr><th style="width:120px">보관 중인 항목</th><td>${u.role === 'student' ? '이름, 학번' : '이름, 휴대폰 번호'}${props.length ? ', 학과·학년(수업 제안)' : ''}, 신청 내역</td></tr>
              <tr><th>동의한 날</th><td>${u.agreedAt ? new Date(u.agreedAt).toLocaleDateString('ko-KR') : '-'}</td></tr>
              <tr><th>보관 기간</th><td>시범 운영 종료 시까지 (종료 후 지체 없이 파기)</td></tr>
            </tbody></table></div>
            <p class="muted small">개인정보 보호법에 따라 내 정보를 열람·정정·삭제하거나 처리를 멈춰 달라고 요청할 수 있어요.</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-outline btn-sm" href="privacy.html#rights">권리 행사 방법 보기</a><button class="btn btn-danger btn-sm" id="delete-me">내 정보와 신청 내역 삭제</button></div>
          </section>
        </div></div></div>`;
      bind();
      if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
    }
    function confirmBox(title, sub, okText, ok) {
      const m = X.openModal(`<h2>${title}</h2><p class="sub">${sub}</p><div class="modal-actions"><button class="btn btn-outline" data-close>아니요</button><button class="btn btn-danger" id="ok">${okText}</button></div>`);
      $('#ok', m).addEventListener('click', () => { ok(); X.persist(); X.closeModal(); draw(); });
    }
    function bind() {
      $$('[data-cancel]').forEach(b => b.addEventListener('click', () => { const r = S().reservations.find(x => x.id === b.dataset.cancel);
        confirmBox('예약을 취소할까요?', `${esc(X.spaceById(r.spaceId).name)} · ${X.fmtDate(r.date)} ${X.rangeText(r.start, r.end)}`, '취소하기', () => { r.status = 'cancelled'; r.decidedAt = Date.now(); X.toast('취소했어요'); }); }));
      $$('[data-cancel-app]').forEach(b => b.addEventListener('click', () => { const a = S().applications.find(x => x.id === b.dataset.cancelApp);
        confirmBox('수업 신청을 취소할까요?', '취소하면 자리가 다른 분에게 돌아가요.', '취소하기', () => { a.status = 'cancelled'; const c = S().classes.find(x => x.id === a.classId); if (c) c.applied = Math.max(0, c.applied - a.count); X.toast('취소했어요'); }); }));
      $$('[data-cancel-prop]').forEach(b => b.addEventListener('click', () => { const p = S().proposals.find(x => x.id === b.dataset.cancelProp);
        confirmBox('수업 제안을 취소할까요?', esc(p.title), '취소하기', () => { p.status = 'cancelled'; X.toast('취소했어요'); }); }));
      $('#delete-me').addEventListener('click', () => {
        const m = X.openModal(`<h2>내 정보와 신청 내역을 삭제할까요?</h2><p class="sub">이름·연락처(학번)와 대관·수업 신청, 수업 제안 기록이 모두 지워지고 로그아웃돼요. 되돌릴 수 없어요.</p>
          <div class="modal-actions"><button class="btn btn-outline" data-close>아니요</button><button class="btn btn-danger" id="ok">삭제하기</button></div>`);
        $('#ok', m).addEventListener('click', () => {
          const s = S();
          s.reservations = s.reservations.filter(r => r.userId !== u.id);
          s.applications.filter(a => a.userId === u.id && a.status !== 'cancelled').forEach(a => { const c = s.classes.find(x => x.id === a.classId); if (c) c.applied = Math.max(0, c.applied - a.count); });
          s.applications = s.applications.filter(a => a.userId !== u.id);
          s.proposals = s.proposals.filter(p => p.userId !== u.id);
          s.session = null; X.persist();
          X.closeModal(); X.toast('삭제했어요'); setTimeout(() => location.href = 'index.html', 700);
        });
      });
    }
    draw();
  }

  /* =========================================================
     관리자
     ========================================================= */
  function viewAdmin() {
    const u = X.me();
    if (!u || u.role !== 'admin') {
      app.innerHTML = `${pageHead('관리자', '관리자 화면', '운영팀 전용 화면이에요.')}<div class="container section"><div class="card stack" style="max-width:560px;gap:12px">
        <strong style="font-size:19px">운영팀만 들어올 수 있어요</strong>
        <p class="muted">시제품에서는 시연용 관리자 계정으로 둘러볼 수 있어요. 실제 운영 때는 지정된 운영팀 계정 로그인과 권한 확인이 필요해요.</p>
        <button class="btn btn-navy" style="align-self:flex-start" id="enter">시연용 관리자 계정으로 들어가기</button></div></div>`;
      $('#enter').addEventListener('click', () => { X.login({ id: 'admin', role: 'admin', name: '운영팀' }); location.reload(); });
      return;
    }
    let tab = params.get('tab') || 'rentals', weekOffset = -1;
    const TABS = [['rentals', '대관 승인'], ['proposals', '수업 제안 검토'], ['upcoming', '예약 현황'], ['report', '총무팀 주간 보고'], ['settings', '설정']];

    function draw() {
      const s = S();
      const pending = s.reservations.filter(r => r.status === 'pending').sort((a, b) => a.createdAt - b.createdAt);
      const props = s.proposals.filter(p => p.status === 'pending');
      const overdue = pending.filter(r => X.approveDeadline(r) < X.today()).length;
      const wk = weekRange(0);
      const thisWeek = s.reservations.filter(r => r.status === 'approved' && r.date >= wk.from && r.date <= wk.to).length;
      app.innerHTML = `${pageHead('관리자', '관리자 화면', '대관 승인, 학생 수업 제안 검토, 총무팀 주간 보고를 처리해요.')}
        <div class="container section stack">
          <div class="notice notice-warm">${X.I.info}<span><strong>운영팀 전용 화면이에요.</strong> 신청자의 이름·연락처는 이 화면에서만 보이고, 총무팀 보고에는 개인을 알 수 없는 통계만 들어가요. 시제품이라 주소만 알면 열 수 있지만, 실제 운영 때는 운영팀 계정 로그인이 필요해요.</span></div>
          <div class="stat-grid">
            <div class="stat"><span>승인 대기</span><b style="color:var(--wait)">${pending.length}</b></div>
            <div class="stat"><span>처리 기한 지남</span><b style="color:${overdue ? 'var(--bad)' : 'var(--navy)'}">${overdue}</b></div>
            <div class="stat"><span>수업 제안 대기</span><b>${props.length}</b></div>
            <div class="stat"><span>이번 주 승인된 예약</span><b>${thisWeek}</b></div>
          </div>
          <div class="tabs" role="tablist">${TABS.map(([k, v]) => `<button role="tab" data-tab="${k}" aria-selected="${tab === k}">${v}${k === 'rentals' && pending.length ? ` <span class="count">${pending.length}</span>` : ''}${k === 'proposals' && props.length ? ` <span class="count">${props.length}</span>` : ''}</button>`).join('')}</div>
          <div id="tab-body"></div>
        </div>`;
      $$('.tabs button').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
      ({ rentals: tabRentals, proposals: tabProposals, upcoming: tabUpcoming, report: tabReport, settings: tabSettings })[tab](pending, props);
    }

    function tabRentals(pending) {
      $('#tab-body').innerHTML = `<div class="card"><div class="card-head"><h3>승인 대기 대관 <span class="count">${pending.length}</span></h3><span class="muted small">학교 일정과 이용 기준을 확인한 뒤, 신청 후 ${C.approvalDays}일(평일) 안에 처리해 주세요</span></div>
        <div class="table-wrap" style="border:0"><table class="tbl"><thead><tr><th>처리 기한</th><th>공간 · 이용 일시</th><th>신청자</th><th>모임 · 목적 · 인원</th><th class="actions">처리</th></tr></thead><tbody>
        ${pending.length ? pending.map(r => { const dl = X.approveDeadline(r), late = dl < X.today(); return `<tr>
          <td><b style="color:${late ? 'var(--bad)' : 'inherit'}">${X.fmtDate(X.ymd(dl))}</b><br><span class="hint">신청 ${new Date(r.createdAt).toLocaleDateString('ko-KR')}</span></td>
          <td style="font-weight:600">${esc(X.spaceById(r.spaceId).name)}<br><span class="muted small" style="font-weight:400">${X.fmtDate(r.date)} ${X.rangeText(r.start, r.end)}</span></td>
          <td>${esc(r.name)} <span class="badge badge-blue">${X.roleLabel(r.role)}</span><br><span class="muted small">${esc(r.role === 'student' ? '학번 ' + (r.studentId || '-') : r.phone)}</span></td>
          <td>${esc(r.group)}<br><span class="muted small">${esc(r.purpose)} · ${r.count}명${r.detail ? ' · ' + esc(r.detail) : ''}</span></td>
          <td class="actions"><button class="btn btn-sm btn-primary" data-ok="${r.id}">승인</button><button class="btn btn-sm btn-danger" data-no="${r.id}">반려</button></td></tr>`; }).join('')
          : '<tr><td colspan="5" class="empty">처리할 신청이 없어요</td></tr>'}
        </tbody></table></div></div>`;
      $$('[data-ok]').forEach(b => b.addEventListener('click', () => { const r = S().reservations.find(x => x.id === b.dataset.ok); r.status = 'approved'; r.decidedAt = Date.now(); X.persist(); X.toast('승인했어요. 신청자에게 결과가 안내돼요'); draw(); }));
      $$('[data-no]').forEach(b => b.addEventListener('click', () => rejectModal('대관 반려', reason => { const r = S().reservations.find(x => x.id === b.dataset.no); r.status = 'rejected'; r.rejectReason = reason; r.decidedAt = Date.now(); })));
    }

    function rejectModal(title, apply) {
      const m = X.openModal(`<h2>${title} 사유</h2><p class="sub">신청자에게 그대로 보여요.</p>
        <form id="rj"><div class="field"><label for="rj-r">사유</label><select class="input" id="rj-r" name="r">${BS.rejectReasons.map(x => `<option>${x}</option>`).join('')}</select></div>
        <div class="field"><label for="rj-m">덧붙일 말 (선택)</label><input class="input" id="rj-m" name="m" placeholder="예) 그날은 학과 행사가 있어요"></div>
        <div class="modal-actions"><button type="button" class="btn btn-outline" data-close>닫기</button><button class="btn btn-danger" type="submit">반려하기</button></div></form>`);
      $('#rj', m).addEventListener('submit', e => { e.preventDefault(); const f = e.target; const t = f.elements.r.value + (f.elements.m.value.trim() ? ' — ' + f.elements.m.value.trim() : ''); apply(t); X.persist(); X.closeModal(); X.toast('반려했어요'); draw(); });
    }

    function tabProposals(_, props) {
      $('#tab-body').innerHTML = `<div class="stack">${props.length ? props.map(p => { const sp = X.spaceById(p.spaceId); return `<div class="card stack" style="gap:10px">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start"><div><span class="tag">${esc(p.field)}</span><h3 style="font-size:19px;margin-top:6px">${esc(p.title)}</h3>
          <span class="muted small">제안: ${esc(p.hostName)} · ${esc(p.dept)}${p.studentId ? ' · 학번 ' + esc(p.studentId) : ''}</span></div>
          <div style="display:flex;gap:6px"><button class="btn btn-sm btn-primary" data-pok="${p.id}">승인하고 공간 예약</button><button class="btn btn-sm btn-danger" data-pno="${p.id}">반려</button></div></div>
        <dl class="kv"><dt>공간 · 일시</dt><dd>${esc(sp.name)} · ${X.fmtDate(p.date)} ${esc(p.start)}~${esc(p.end)}</dd><dt>정원 · 참가비</dt><dd>${p.capacity}명 · ${esc(p.fee)}</dd><dt>대상</dt><dd>${esc(p.target)}</dd><dt>준비물</dt><dd>${esc(p.supplies || '-')}</dd><dt>처리 기한</dt><dd>${X.fmtDate(X.ymd(X.approveDeadline(p)))}</dd></dl>
        <p style="color:var(--ink-2)">${esc(p.desc)}</p></div>`; }).join('') : '<div class="card empty">검토할 수업 제안이 없어요</div>'}</div>`;
      $$('[data-pok]').forEach(b => b.addEventListener('click', () => {
        const p = S().proposals.find(x => x.id === b.dataset.pok), s = X.timeToSlot(p.start), e = X.timeToSlot(p.end), occ = X.occupancy(p.spaceId, p.date);
        for (let i = s; i < e; i++) if (occ[i]) { X.toast('그 시간에 이미 다른 예약이 있어요. 반려하고 다른 시간을 안내해 주세요'); return; }
        const cid = X.uid('c');
        S().classes.push({ id: cid, title: p.title, field: p.field, host: p.host, dept: p.dept, spaceId: p.spaceId, date: p.date, start: p.start, end: p.end, capacity: p.capacity, applied: 0, target: p.target, fee: p.fee, desc: p.desc, status: 'open' });
        S().reservations.push({ id: X.uid('r'), kind: 'class', classId: cid, spaceId: p.spaceId, date: p.date, start: s, end: e, status: 'approved', name: p.hostName, role: 'student', purpose: '학생 원데이클래스', group: p.title, count: p.capacity, userId: p.userId, createdAt: Date.now(), decidedAt: Date.now() });
        p.status = 'approved'; p.classId = cid; X.persist(); X.toast('승인했어요. 공간이 예약되고 수업 목록에 올라갔어요'); draw();
      }));
      $$('[data-pno]').forEach(b => b.addEventListener('click', () => rejectModal('수업 제안 반려', reason => { const p = S().proposals.find(x => x.id === b.dataset.pno); p.status = 'rejected'; p.rejectReason = reason; })));
    }

    function tabUpcoming() {
      const to = X.ymd(X.addDays(X.today(), 13)), from = X.ymd(X.today());
      const list = S().reservations.filter(r => r.status === 'approved' && r.date >= from && r.date <= to).sort((a, b) => (a.date + String(a.start).padStart(2, '0')).localeCompare(b.date + String(b.start).padStart(2, '0')));
      $('#tab-body').innerHTML = `<div class="card"><div class="card-head"><h3>앞으로 2주 승인된 예약 <span class="count">${list.length}</span></h3></div>
        <div class="table-wrap" style="border:0"><table class="tbl"><thead><tr><th>날짜</th><th>시간</th><th>공간</th><th>모임</th><th>구분</th><th>인원</th></tr></thead><tbody>
        ${list.map(r => `<tr><td>${X.fmtDate(r.date)}</td><td>${X.rangeText(r.start, r.end)}</td><td>${esc(X.spaceById(r.spaceId).name)}</td><td>${esc(r.group)}</td><td>${r.kind === 'class' ? '학생 수업' : X.roleLabel(r.role)}</td><td>${r.count}명</td></tr>`).join('') || '<tr><td colspan="6" class="empty">예약이 없어요</td></tr>'}
        </tbody></table></div></div>`;
    }

    /* ----- 총무팀 주간 보고 ----- */
    function weekRange(off) {
      const t = X.today(), mon = X.addDays(t, -((t.getDay() + 6) % 7) + off * 7);
      return { from: X.ymd(mon), to: X.ymd(X.addDays(mon, 6)) };
    }
    function buildReport(off) {
      const wk = weekRange(off), s = S();
      const inWeek = d => d >= wk.from && d <= wk.to;
      const used = s.reservations.filter(r => r.status === 'approved' && inWeek(r.date));
      const created = s.reservations.filter(r => r.kind === 'rental' && inWeek(X.ymd(new Date(r.createdAt))));
      const by = (arr, key) => arr.reduce((m, x) => { const k = key(x); m[k] = (m[k] || 0) + 1; return m; }, {});
      const hoursBySpace = BS.spaces.map(sp => [sp.name, used.filter(r => r.spaceId === sp.id).reduce((n, r) => n + r.end - r.start, 0) / 2]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
      const totalH = hoursBySpace.reduce((n, x) => n + x[1], 0);
      const roles = by(used.filter(r => r.kind === 'rental'), r => X.roleLabel(r.role));
      const purposes = by(used.filter(r => r.kind === 'rental'), r => r.purpose);
      const st = by(created, r => r.status);
      const rejects = by(created.filter(r => r.status === 'rejected'), r => (r.rejectReason || '').split(' — ')[0]);
      const classes = s.classes.filter(c => inWeek(c.date));
      const newProps = s.proposals.filter(p => inWeek(X.ymd(new Date(p.createdAt))));
      const fmt = o => Object.entries(o).map(([k, v]) => `${k} ${v}건`).join(', ') || '없음';
      const title = `[Bearshare] 주간 운영 보고 (${X.fmtDate(wk.from)} ~ ${X.fmtDate(wk.to)})`;
      const text = [
        `총무팀 담당자님께,`, ``,
        `Bearshare 운영팀입니다. ${X.fmtDate(wk.from)}부터 ${X.fmtDate(wk.to)}까지의 공간 이용 현황을 보고드립니다.`,
        `(개인을 알아볼 수 있는 이름·연락처는 빼고 통계만 담았습니다.)`, ``,
        `1. 이용 현황`,
        `- 승인된 이용: ${used.length}건, 총 ${totalH}시간`,
        ...hoursBySpace.map(([n, h]) => `  · ${n}: ${h}시간`),
        `- 이용자 구분: ${fmt(roles)}`,
        `- 이용 목적: ${fmt(purposes)}`, ``,
        `2. 신청 처리 (이 기간 접수 ${created.length}건)`,
        `- 승인 ${st.approved || 0}건 · 반려 ${st.rejected || 0}건 · 대기 ${st.pending || 0}건 · 취소 ${st.cancelled || 0}건`,
        `- 반려 사유: ${fmt(rejects)}`, ``,
        `3. 학생 원데이클래스`,
        `- 진행 수업 ${classes.length}개${classes.length ? ': ' + classes.map(c => `${c.title}(${X.fmtDate(c.date)}, 신청 ${c.applied}/${c.capacity}명)`).join(', ') : ''}`,
        `- 새 수업 제안 ${newProps.length}건`, ``,
        `4. 특이사항`, `- [시설 파손, 민원, 학교 일정 충돌 등이 있으면 적어 주세요]`, ``,
        `학교 일정과 겹치는 예약이 있으면 회신 부탁드립니다.`, `감사합니다.`, `${C.teamName} 드림`
      ].join('\n');
      return { wk, title, text, used, totalH, hoursBySpace, roles, created, st, classes };
    }
    function tabReport() {
      const R = buildReport(weekOffset);
      const max = Math.max(1, ...R.hoursBySpace.map(x => x[1]));
      const hasAddr = !/^\[/.test(C.adminOfficeEmail);
      $('#tab-body').innerHTML = `<div class="split">
        <div class="main card stack" style="gap:14px">
          <div class="card-head" style="margin:0"><h3>${X.fmtDate(R.wk.from)} ~ ${X.fmtDate(R.wk.to)}</h3>
            <div style="display:flex;gap:6px"><button class="btn btn-sm btn-outline" id="wk-prev">${X.I.left} 지난 주</button><button class="btn btn-sm btn-outline" id="wk-next" ${weekOffset >= 0 ? 'disabled' : ''}>다음 주 ${X.I.right}</button></div></div>
          <div class="stat-grid">
            <div class="stat"><span>승인된 이용</span><b>${R.used.length}건</b></div><div class="stat"><span>총 이용 시간</span><b>${R.totalH}시간</b></div>
            <div class="stat"><span>이 기간 접수</span><b>${R.created.length}건</b></div><div class="stat"><span>학생 수업</span><b>${R.classes.length}개</b></div>
          </div>
          <div class="stack" style="gap:8px"><strong>공간별 이용 시간</strong>
            ${R.hoursBySpace.map(([n, h]) => `<div style="display:grid;grid-template-columns:150px 1fr 56px;gap:10px;align-items:center;font-size:14px"><span>${esc(n)}</span><div class="bar"><i style="width:${h / max * 100}%"></i></div><b style="text-align:right">${h}시간</b></div>`).join('') || '<p class="muted small">이용 기록이 없어요</p>'}
          </div>
          <div><strong>보낼 내용 미리보기</strong><pre class="report-pre" id="report-text">${esc(R.text)}</pre></div>
        </div>
        <aside class="side">
          <div class="card stack" style="gap:12px"><strong style="font-size:17px">매주 총무팀에 메일로 보내요</strong>
            <dl class="kv"><dt>받는 사람</dt><dd>${esc(C.adminOfficeEmail)}</dd><dt>제목</dt><dd>${esc(R.title)}</dd><dt>주기</dt><dd>매주 월요일 (지난 주 기준)</dd></dl>
            <a class="btn btn-primary" id="mail-btn" href="mailto:${hasAddr ? encodeURIComponent(C.adminOfficeEmail) : ''}?subject=${encodeURIComponent(R.title)}&body=${encodeURIComponent(R.text)}">메일 앱으로 보내기</a>
            <button class="btn btn-outline" id="copy-btn">내용 복사하기</button>
            <p class="hint">버튼을 누르면 내 메일 앱이 열리고 제목과 내용이 채워져요. 확인한 뒤 보내기만 누르면 돼요.${hasAddr ? '' : ' 총무팀 메일 주소가 정해지면 data.js의 adminOfficeEmail에 적어 주세요.'}</p>
          </div>
          <div class="notice">${X.I.info}<span>보고에는 이름·연락처·학번이 들어가지 않아요. 개인정보처리방침의 '제3자 제공 없음' 원칙에 맞춘 거예요.</span></div>
        </aside></div>`;
      $('#wk-prev').addEventListener('click', () => { weekOffset--; tabReport(); });
      $('#wk-next').addEventListener('click', () => { if (weekOffset < 0) { weekOffset++; tabReport(); } });
      $('#copy-btn').addEventListener('click', () => {
        const txt = R.title + '\n\n' + R.text;
        const done = () => X.toast('복사했어요. 메일에 붙여 넣으면 돼요');
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
        function fallback() { const ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { X.toast('복사하지 못했어요. 미리보기 내용을 직접 선택해 주세요'); } ta.remove(); }
      });
    }

    function tabSettings() {
      $('#tab-body').innerHTML = `<div class="grid">
        <div class="card stack" style="gap:10px"><strong style="font-size:17px">예시 데이터로 초기화</strong><p class="muted small">이 브라우저에 저장된 예약, 수업 신청, 수업 제안이 모두 지워지고 처음 예시 상태로 돌아가요. 시연 전에 쓰면 좋아요.</p><button class="btn btn-danger" style="align-self:flex-start" id="reset">초기화하기</button></div>
        <div class="card stack" style="gap:10px"><strong style="font-size:17px">운영 규칙 (data.js에서 바꿔요)</strong>
          <dl class="kv"><dt>신청 기간</dt><dd>이용 ${C.applyFromDays}일 전 ~ ${C.applyUntilDays}일 전</dd><dt>승인 기한</dt><dd>신청 후 ${C.approvalDays}일(평일)</dd><dt>1회 최대</dt><dd>${X.durText(C.maxSlots)}</dd><dt>이용료</dt><dd>${esc(C.feeText)}</dd></dl></div>
      </div>`;
      $('#reset').addEventListener('click', () => {
        const m = X.openModal(`<h2>예시 데이터로 초기화할까요?</h2><p class="sub">되돌릴 수 없어요. 관리자 로그인은 유지돼요.</p><div class="modal-actions"><button class="btn btn-outline" data-close>아니요</button><button class="btn btn-danger" id="ok">초기화</button></div>`);
        $('#ok', m).addEventListener('click', () => { X.reset(true); X.closeModal(); X.toast('초기화했어요'); draw(); });
      });
    }
    draw();
  }

  /* =========================================================
     개인정보처리방침
     ========================================================= */
  function viewPrivacy() {
    const toc = [['purpose', '처리 목적'], ['items', '처리하는 항목과 근거'], ['period', '보유·이용 기간'], ['destroy', '파기 절차와 방법'], ['third', '제3자 제공'], ['entrust', '처리 위탁'],
      ['rights', '정보주체의 권리와 행사 방법'], ['child', '만 14세 미만 아동'], ['safety', '안전성 확보 조치'], ['auto', '자동 수집 장치'], ['officer', '개인정보 보호책임자'], ['remedy', '권익침해 구제 방법'], ['change', '처리방침의 변경']];
    let n = 0; const h = id => `<h2 id="${id}">${++n}. ${toc.find(t => t[0] === id)[1]}`;
    app.innerHTML = `${pageHead('홈 › 개인정보처리방침', '개인정보처리방침', `${esc(C.teamName)}은(는) 「개인정보 보호법」 제30조에 따라 이용자의 개인정보를 보호하고 관련 고충을 빠르게 처리하기 위해 이 처리방침을 둡니다.`)}
      <div class="container section"><article class="doc card" style="margin:0 auto">
        <div class="notice notice-warm" style="margin-bottom:20px">${X.I.info}<span><strong>시제품용 처리방침 시안이에요.</strong> 실제 운영 전에 지도교수님과 학교 개인정보 담당 부서의 검토를 받아야 해요. 현재 시제품은 입력 정보를 서버로 보내지 않고 이용자의 브라우저에만 저장해요.</span></div>
        <strong>목차</strong>
        <ol class="toc">${toc.map(t => `<li><a href="#${t[0]}">${t[1]}</a></li>`).join('')}</ol>

        ${h('purpose')}<span class="law">제15조</span></h2>
        <p>Bearshare는 다음 목적을 위해서만 개인정보를 처리하며, 목적이 바뀌면 미리 동의를 받습니다.</p>
        <ul><li>회원 확인: 재학생 여부 확인, 지역주민 본인 확인</li><li>공간 대관: 신청 접수, 승인·반려 결과 안내, 이용 일정 연락</li><li>학생 원데이클래스: 수업 제안 검토, 수업 게시, 수업 신청 관리</li><li>운영 개선: 개인을 알아볼 수 없는 이용 통계 작성</li></ul>

        ${h('items')}<span class="law">제15조 · 제16조 · 제22조</span></h2>
        <p>서비스에 꼭 필요한 최소한의 정보만 받습니다. 모든 항목은 이용자의 동의(제15조 제1항 제1호)를 받아 처리합니다.</p>
        <div class="table-wrap" style="margin:10px 0"><table class="tbl" style="min-width:520px"><thead><tr><th>구분</th><th>필수 항목</th><th>언제</th></tr></thead><tbody>
          <tr><td>재학생 로그인</td><td>이름, 학번</td><td>로그인할 때</td></tr>
          <tr><td>지역주민 로그인</td><td>이름, 휴대폰 번호, 만 14세 이상 여부</td><td>로그인할 때</td></tr>
          <tr><td>대관 신청</td><td>모임·단체 이름, 이용 목적, 인원, 활동 내용(선택)</td><td>대관 신청할 때</td></tr>
          <tr><td>수업 제안</td><td>학과·학년, 수업 정보</td><td>재학생이 수업을 제안할 때</td></tr>
          <tr><td>수업 신청</td><td>함께 오는 인원</td><td>수업을 신청할 때</td></tr>
        </tbody></table></div>
        <p>주민등록번호, 주소, 계좌번호 같은 정보와 민감정보는 받지 않습니다.</p>

        ${h('period')}<span class="law">제21조</span></h2>
        <p>개인정보는 <b>시범 운영 종료 시까지</b> 보관하고, 종료 후 지체 없이 파기합니다. 이용자가 '내 정보 삭제'를 요청하면 즉시 파기합니다. 총무팀 보고와 연구에 쓰는 통계는 개인을 알아볼 수 없는 숫자로만 남깁니다.</p>

        ${h('destroy')}<span class="law">제21조</span></h2>
        <ul><li>절차: 보유 기간이 끝나거나 목적을 달성한 개인정보는 정당한 사유가 없는 한 5일 이내에 파기합니다.</li><li>전자 파일: 다시 살릴 수 없는 방법으로 영구 삭제합니다.</li><li>종이 문서: 분쇄하거나 소각합니다.</li></ul>

        ${h('third')}<span class="law">제17조</span></h2>
        <p>개인정보를 외부에 제공하지 않습니다. 학교 총무팀에는 매주 이용 현황을 보고하지만, 이름·연락처·학번을 빼고 <b>개인을 알아볼 수 없는 통계만</b> 보냅니다. 법령에 특별한 규정이 있는 경우에만 예외로 합니다.</p>

        ${h('entrust')}<span class="law">제26조</span></h2>
        <p>개인정보 처리 업무를 외부에 맡기지 않습니다. 실제 운영에서 문자 발송이나 데이터 저장을 외부 업체에 맡기게 되면, 업체 이름과 맡기는 업무를 이 방침에 미리 공개합니다.</p>

        ${h('rights')}<span class="law">제35조 · 제36조 · 제37조</span></h2>
        <p>이용자는 언제든지 다음을 요청할 수 있습니다.</p>
        <ul><li>내 개인정보 열람</li><li>잘못된 정보의 정정·삭제</li><li>처리 정지</li><li>동의 철회</li></ul>
        <p>방법: <b>내 예약 › 내 개인정보</b>에서 바로 확인하고 삭제할 수 있고, 운영팀 이메일(${esc(C.teamEmail)})로도 요청할 수 있습니다. 요청을 받으면 10일 안에 처리 결과를 알려 드립니다. 대리인을 통해서도 요청할 수 있습니다.</p>

        ${h('child')}<span class="law">제22조의2</span></h2>
        <p>만 14세 미만 아동의 개인정보는 받지 않습니다. 만 14세 미만이 수업이나 공간을 이용하려면 보호자가 본인 이름으로 로그인해 신청해야 합니다.</p>

        ${h('safety')}<span class="law">제29조</span></h2>
        <ul><li>관리적 조치: 개인정보를 볼 수 있는 사람을 운영팀 관리자로 최소화합니다.</li><li>기술적 조치: 관리자 화면 접근 제한(실제 운영 시 계정 로그인), 화면 표시 때 연락처·학번 일부 가림(예: 010-****-1234).</li><li>외부 보고 시 개인 식별 정보 제외.</li></ul>

        ${h('auto')}</h2>
        <p>쿠키를 쓰지 않습니다. 시제품은 로그인 상태와 신청 내역을 이용자 브라우저의 저장소(localStorage)에만 저장하며, 브라우저의 사이트 데이터를 지우면 함께 삭제됩니다.</p>

        ${h('officer')}<span class="law">제31조</span></h2>
        <div class="table-wrap" style="margin:10px 0"><table class="tbl" style="min-width:0"><tbody>
          <tr><th style="width:140px">개인정보 보호책임자</th><td>${esc(C.teamName)} 대표 [이름]</td></tr>
          <tr><th>연락처</th><td>${esc(C.teamEmail)}</td></tr>
        </tbody></table></div>

        ${h('remedy')}</h2>
        <p>개인정보 침해로 상담이 필요하면 아래 기관에 문의할 수 있습니다.</p>
        <ul><li>개인정보침해신고센터: (국번 없이) 118 · privacy.kisa.or.kr</li><li>개인정보분쟁조정위원회: 1833-6972 · www.kopico.go.kr</li><li>대검찰청: (국번 없이) 1301 · www.spo.go.kr</li><li>경찰청: (국번 없이) 182 · ecrm.police.go.kr</li></ul>

        ${h('change')}<span class="law">제30조</span></h2>
        <p>이 처리방침은 ${esc(C.policyDate)}부터 적용합니다. 내용이 바뀌면 시행 7일 전에 공지사항으로 알립니다.</p>
      </article></div>`;
  }

  X.renderChrome(page === 'privacy' || page === 'login' || page === 'propose' || page === 'mypage' || page === 'admin' ? (page === 'propose' ? 'classes' : '') : page);
  ({ index: viewHome, spaces: viewSpaces, guide: viewGuide, reserve: viewReserve, classes: viewClasses, propose: viewPropose, login: viewLogin, mypage: viewMy, admin: viewAdmin, privacy: viewPrivacy }[page] || viewHome)();
  if (location.hash && page !== 'mypage') { const t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(() => t.scrollIntoView(), 0); }
})();
