/* Klevercomms enrolment: 3 steps (course, details, payment) and the confirmation screen shown after Paystack sends the person back.
   Plain JavaScript. The amount is never sent from here: the server looks the price up itself (functions/_lib/core.js).
   If the online checkout is not available (not deployed yet, or the page is opened from a folder) the form falls back to WhatsApp. */
(() => {
  const K = window.KCD, root = document.getElementById('enrol'); if (!K || !root) return;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const naira = (n) => '₦' + Number(n).toLocaleString('en-NG');
  const Q = new URLSearchParams(location.search), wa = (t) => `https://wa.me/${root.dataset.wa}?text=${encodeURIComponent(t)}`;
  const base = document.documentElement.dataset.base || '/', here = (p) => base + p;
  const st = { step: 1, slug: Q.get('course') || '', mode: '', date: '', name: '', email: '', phone: '', org: '', notes: '', pay: 'online' };
  const C = (s) => K.courses.find((c) => c.s === s);
  const ref = () => 'KC-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  const bank = K.site.pay && K.site.pay.bank, online = K.site.pay && K.site.pay.online;
  const live = (m) => root.setAttribute('aria-busy', m ? 'true' : 'false');

  /* ---------- coming back from Paystack ---------- */
  const R = Q.get('reference') || Q.get('trxref');

  /* ---------- the form ---------- */
  if (!C(st.slug)) st.slug = '';
  const c0 = C(st.slug); if (c0) { st.mode = c0.md[0]; st.date = c0.ss[0] ? c0.ss[0].i : ''; }
  const labels = ['Course', 'Your details', 'Payment'];
  const sum = () => { const c = C(st.slug); if (!c) return '<p class="meta">Pick a course to see your summary.</p>';
    return `<div class="os"><b>${esc(c.n)}</b><dl><div><dt>Mode</dt><dd>${esc(st.mode || '-')}</dd></div><div><dt>Date</dt><dd>${esc(dateLabel(c) || 'To be confirmed')}</dd></div><div><dt>Duration</dt><dd>${esc(c.du || 'To be confirmed')}</dd></div></dl><div class="tot"><span>Total</span><b>${c.p ? naira(c.p.a) : 'Price on request'}</b></div></div>`; };
  const dateLabel = (c) => { const s = c.ss.find((x) => x.i === st.date); return s ? s.d + (s.m ? ' (' + s.m + ')' : '') : ''; };
  const modeStep = (c) => c.md.map((m, i) => `<label class="chip"><input type="radio" name="mode" value="${esc(m)}"${st.mode === m ? ' checked' : ''}><span>${esc(m)}</span></label>`).join('');
  const courseOpts = () => K.cats.map((cat, ci) => `<optgroup label="${esc(cat.n)}">${K.courses.filter((c) => c.c === ci).map((c) => `<option value="${esc(c.s)}"${c.s === st.slug ? ' selected' : ''}>${esc(c.short || c.n)}${c.p ? ' · ' + naira(c.p.a) : ''}</option>`).join('')}</optgroup>`).join('');
  const field = (id, label, type = 'text', extra = '') => `<div class="fld"><label for="f-${id}">${label}</label><input id="f-${id}" name="${id}" type="${type}" value="${esc(st[id === 'organization' ? 'org' : id])}" ${extra}><div class="fe" id="e-${id}" role="alert"></div></div>`;

  function paint() {
    const c = C(st.slug), steps = `<ol class="stp" aria-label="Progress">${labels.map((l, i) => `<li class="${i + 1 === st.step ? 'cur' : i + 1 < st.step ? 'done' : ''}"${i + 1 === st.step ? ' aria-current="step"' : ''}><b>${i + 1 < st.step ? '✓' : i + 1}</b><span>${l}</span></li>`).join('')}</ol>`;
    let body = '';
    if (st.step === 1) body = `<div class="fld"><label for="f-course">Course</label><select id="f-course" name="course"><option value="">Choose a course…</option>${courseOpts()}</select><div class="fe" id="e-course" role="alert"></div></div>
      ${c ? `<fieldset class="fld"><legend>Training mode</legend><div class="chips2">${modeStep(c)}</div></fieldset>${c.ss.length ? `<div class="fld"><label for="f-date">Training date</label><select id="f-date" name="date">${c.ss.map((s) => `<option value="${esc(s.i)}"${s.i === st.date ? ' selected' : ''}>${esc(s.d)}${s.m ? ' (' + esc(s.m) + ')' : ''}</option>`).join('')}</select></div>` : '<p class="meta">No dates are published for this course yet. Our team will confirm your date after you register.</p>'}` : ''}
      <div class="nav"><span></span><button class="btn" type="submit">Continue</button></div>`;
    if (st.step === 2) body = `<div class="g2">${field('name', 'Full name', 'text', 'autocomplete="name" required')}${field('phone', 'Phone number', 'tel', 'autocomplete="tel" required')}</div>${field('email', 'Email address', 'email', 'autocomplete="email" required')}${field('organization', 'Organization (optional)', 'text', 'autocomplete="organization"')}<div class="fld"><label for="f-notes">Anything we should know? (optional)</label><textarea id="f-notes" name="notes" rows="3">${esc(st.notes)}</textarea></div>
      <div class="nav"><button class="btn ghost" type="button" data-back>Back</button><button class="btn" type="submit">Continue to payment</button></div>`;
    if (st.step === 3) { const pay = c && c.p;
      const opt = (v, t, d, off) => off ? '' : `<label class="opt"><input type="radio" name="pay" value="${v}"${st.pay === v ? ' checked' : ''}><span><b>${t}</b><small>${d}</small></span></label>`;
      if (pay && !online && st.pay === 'online') st.pay = bank ? 'bank' : 'later'; if (!pay) st.pay = 'later';
      body = `${sum()}${pay ? `<fieldset class="fld"><legend>How would you like to pay?</legend><div class="opts">${opt('online', 'Pay online now', 'Card, bank transfer or USSD, securely through Paystack. Instant confirmation.', !online)}${opt('bank', 'Bank transfer', 'Transfer to our account and send us the receipt on WhatsApp.', !bank)}${opt('later', 'Reserve now, pay later', 'Our team will contact you to arrange payment.', false)}</div></fieldset>` : '<p class="meta">This course is priced on enquiry. Send your registration and our team will reply with the price and next steps.</p>'}
        <label class="chk"><input type="checkbox" name="terms" required${st.terms ? ' checked' : ''}> <span>I agree to the <a href="${here('terms/')}" target="_blank" rel="noopener">Terms of Use</a> and <a href="${here('refund-policy/')}" target="_blank" rel="noopener">Payment &amp; Refund Policy</a>.</span></label><div class="fe" id="e-terms" role="alert"></div><div class="fe" id="e-form" role="alert"></div>
        <div class="nav"><button class="btn ghost" type="button" data-back>Back</button><button class="btn" type="submit" id="go">${pay && st.pay === 'online' ? 'Pay ' + naira(c.p.a) + ' securely' : pay ? 'Complete registration' : 'Send registration'}</button></div>`; }
    root.innerHTML = `<div class="fcard">${steps}<form id="ef" novalidate>${body}</form></div>${st.step < 3 && c ? `<div class="fcard os-side">${sum()}</div>` : ''}`;
    root.querySelector('[data-back]')?.addEventListener('click', () => { grab(); st.step--; paint(); focusTop(); });
    const f = root.querySelector('#ef'); f.addEventListener('submit', (e) => { e.preventDefault(); grab(); next(); });
    f.addEventListener('change', (e) => { grab(); if (e.target.name === 'course') { const c = C(st.slug); st.mode = c ? c.md[0] : ''; st.date = c && c.ss[0] ? c.ss[0].i : ''; paint(); } else if (e.target.name === 'pay') paint(); else if (st.step === 1) { root.querySelector('.os-side') && (root.querySelector('.os-side').innerHTML = sum()); } });
  }
  const focusTop = () => root.scrollIntoView({ block: 'start', behavior: 'smooth' });
  const grab = () => { const g = (n) => { const e = root.querySelector(`[name="${n}"]`); return e && e.type !== 'radio' && e.type !== 'checkbox' ? e.value.trim() : undefined; };
    if (st.step === 1) { st.slug = g('course') ?? st.slug; const m = root.querySelector('[name=mode]:checked'); if (m) st.mode = m.value; const d = g('date'); if (d !== undefined) st.date = d; }
    if (st.step === 2) { st.name = g('name') ?? st.name; st.phone = g('phone') ?? st.phone; st.email = g('email') ?? st.email; st.org = g('organization') ?? st.org; st.notes = g('notes') ?? st.notes; }
    if (st.step === 3) { const p = root.querySelector('[name=pay]:checked'); if (p) st.pay = p.value; const t = root.querySelector('[name=terms]'); if (t) st.terms = t.checked; } };
  const bad = (id, msg) => { const e = root.querySelector('#e-' + id); if (e) e.textContent = msg; const i = root.querySelector('#f-' + id); if (i) i.setAttribute('aria-invalid', 'true'); return msg; };
  function next() {
    root.querySelectorAll('.fe').forEach((e) => (e.textContent = '')); root.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
    if (st.step === 1) { if (!C(st.slug)) { bad('course', 'Please choose a course.'); return root.querySelector('#f-course').focus(); } st.step = 2; paint(); return focusTop(); }
    if (st.step === 2) { const errs = []; if (st.name.length < 2) errs.push(['name', 'Enter your full name.']); if (!/^\+?[0-9 ()-]{7,20}$/.test(st.phone)) errs.push(['phone', 'Enter a valid phone number.']); if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(st.email)) errs.push(['email', 'Enter a valid email address.']);
      if (errs.length) { errs.forEach(([i, m]) => bad(i, m)); return root.querySelector('#f-' + errs[0][0]).focus(); } st.step = 3; paint(); return focusTop(); }
    if (!root.querySelector('[name=terms]').checked) { bad('terms', 'Please tick the box to continue.'); return root.querySelector('[name=terms]').focus(); }
    submit();
  }
  const summaryText = (r, how) => { const c = C(st.slug); return `Registration request${r ? ' ' + r : ''}\nCourse: ${c.n}\nMode: ${st.mode}\nDate: ${dateLabel(c) || 'To be confirmed'}\nPrice: ${c.p ? naira(c.p.a) : 'On request'}\nName: ${st.name}\nPhone: ${st.phone}\nEmail: ${st.email}${st.org ? '\nOrganization: ' + st.org : ''}${st.notes ? '\nNotes: ' + st.notes : ''}\nPayment: ${how}`; };
  async function submit() {
    const c = C(st.slug), btn = root.querySelector('#go'), msg = root.querySelector('#e-form'); btn.disabled = true; live(true);
    if (c.p && st.pay === 'online') {
      try {
        const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course: st.slug, name: st.name, email: st.email, phone: st.phone, organization: st.org, notes: st.notes, mode: st.mode, date: st.date }) });
        const j = await r.json().catch(() => null);
        if (r.ok && j && /^https:\/\/checkout\.paystack\.com\//.test(j.authorizationUrl || '')) { location.href = j.authorizationUrl; return; }
        if (r.status === 422 && j && j.error && j.error.fields) { st.step = 2; paint(); Object.entries(j.error.fields).forEach(([k, m]) => bad(k === 'organization' ? 'organization' : k, m)); return; }
        throw new Error(j && j.error && j.error.message || 'unavailable');
      } catch (e) {
        live(false); btn.disabled = false;
        msg.innerHTML = `Online payment is not available right now. You can <a href="${wa(summaryText('', 'Wants to pay online (checkout unavailable)'))}" target="_blank" rel="noopener">send your registration on WhatsApp</a> and we will help you pay, or choose another payment option.`; return;
      }
    }
    live(false); done(c);
  }
  function done(c) {
    const r = ref(), how = st.pay === 'bank' ? 'Bank transfer (receipt to follow)' : st.pay === 'later' ? 'Pay later' : 'To be arranged', w = wa(summaryText(r, how));
    const bankBox = st.pay === 'bank' && bank ? `<div class="bankbox"><h3>Bank transfer details</h3><dl><div><dt>Bank</dt><dd>${esc(bank.bankName)}</dd></div><div><dt>Account name</dt><dd>${esc(bank.accountName)}</dd></div><div><dt>Account number</dt><dd>${esc(bank.accountNumber)}</dd></div><div><dt>Amount</dt><dd>${c.p ? naira(c.p.a) : ''}</dd></div><div><dt>Narration</dt><dd>${r}</dd></div></dl><p class="meta">Use the reference above as your narration, then send the receipt on WhatsApp. Your place is confirmed once we verify the transfer.</p></div>` : '';
    root.innerHTML = `<div class="fcard res ok"><div class="tick" aria-hidden="true">✓</div><h2>${st.pay === 'bank' ? 'Almost done: send your receipt' : 'Registration ready to send'}</h2><p>Reference <b class="ref">${r}</b></p>${sum()}${bankBox}<p>${st.pay === 'bank' ? 'Send your receipt with this registration so we can confirm your place.' : 'Tap below to send your registration to our team on WhatsApp. We will reply to confirm your place and arrange payment.'}</p><p class="row"><a class="btn wa" href="${w}" target="_blank" rel="noopener">Send on WhatsApp</a><a class="btn ghost" style="color:var(--ink)" href="${here('courses/')}">Browse more courses</a></p><p class="meta">No money has been taken. Your place is held only after our team replies.</p></div>`;
    focusTop();
  }

  /* ---------- after Paystack ---------- */
  async function status(reference, tries = 0) {
    root.innerHTML = '<div class="fcard res"><h2>Confirming your payment…</h2><p>This usually takes a few seconds. Please do not pay again.</p></div>'; live(true);
    let j = null, code = 0;
    try { const r = await fetch('/api/verify?reference=' + encodeURIComponent(reference)); code = r.status; j = await r.json().catch(() => null); } catch { code = 0; }
    live(false);
    const help = `<p class="row"><a class="btn wa" href="${wa('Hello, I need help with payment reference ' + reference)}" target="_blank" rel="noopener">Get help on WhatsApp</a></p>`;
    if (j && j.state === 'confirmed') { const kobo = Number(j.amountKobo) / 100; root.innerHTML = `<div class="fcard res ok"><div class="tick" aria-hidden="true">✓</div><h2>Payment received${j.name ? ', ' + esc(j.name) : ''}!</h2><p>Your place is confirmed. A receipt is on its way to your email.</p><div class="os"><b>${esc(j.course)}</b><dl><div><dt>Mode</dt><dd>${esc(j.mode || '-')}</dd></div><div><dt>Date</dt><dd>${esc(j.date || 'To be confirmed')}</dd></div><div><dt>Paid</dt><dd>${naira(kobo)}</dd></div><div><dt>Reference</dt><dd>${esc(reference)}</dd></div></dl></div><p>Our team will send joining details closer to the training date.</p><p class="meta">Certificate details are confirmed by Klevercomms for each course. Completing a training does not automatically grant an external professional certification.</p><p class="row"><a class="btn" href="${here('courses/')}">Browse more courses</a><a class="btn ghost" style="color:var(--ink)" href="${wa('Hello, I have paid. Reference ' + reference)}" target="_blank" rel="noopener">Message us on WhatsApp</a></p></div>`; focusTop(); return; }
    if (j && j.state === 'pending' && tries < 6) return void setTimeout(() => status(reference, tries + 1), 3000);
    if (j && j.state === 'failed') { root.innerHTML = `<div class="fcard res bad"><h2>Payment not completed</h2><p>Your place is not confirmed yet and you have not been charged for this attempt. You can try again.</p><p class="row"><a class="btn" href="${here('enrol.html')}">Try again</a></p>${help}</div>`; return; }
    if (j && j.state === 'pending') { root.innerHTML = `<div class="fcard res wait"><h2>Still confirming</h2><p>Your bank or card provider is taking longer than usual. If you were charged, your registration will be confirmed automatically. Please do not pay again. Reference: <b class="ref">${esc(reference)}</b></p>${help}</div>`; return; }
    root.innerHTML = `<div class="fcard res bad"><h2>We could not check that payment</h2><p>${code === 404 ? 'We could not find a payment with that reference.' : 'We could not reach the payment service. If you were charged, please message us with your reference.'}</p><p>Reference: <b class="ref">${esc(reference)}</b></p>${help}</div>`;
  }
  if (R) status(R); else paint();
})();
