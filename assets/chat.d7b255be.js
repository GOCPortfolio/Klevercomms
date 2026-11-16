/* ASSISTANT: a guided chat that answers ONLY from the site's own data (courses, prices, contact details), compiled into /assets/kcd.*.js at build time.
   It never invents prices, dates, accreditation or certificates, and hands over to a person on WhatsApp for anything else.
   It is an enhancement: the page works without it. */
(() => {
  const D = window.KCD; if (!D) return;
  const S = D.site, root = document.documentElement, B = root.dataset.base || '/', IX = root.dataset.idx || '';
  const A = { name: 'Klever Assistant', greeting: 'Hello! I am the Klevercomms assistant (automated). Ask me about courses, prices, duration, registration or where we are.', chips: ['What courses do you offer?', 'How much is ISO 9001?', 'How do I register?', 'Where are you located?', 'Corporate training'] };
  const E = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const $ = (s, r = document) => r.querySelector(s), rm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  /* site link that also works when the pages are opened straight from a folder (data-base / data-idx are set by the build) */
  const href = (p) => { if (!p.startsWith('/')) return p; const m = /^([^?#]*)(.*)$/.exec(p); let q = m[1]; if (IX && q.endsWith('/')) q += IX; return B + q.slice(1) + m[2]; };
  const wa = (t) => 'https://wa.me/' + S.wa + '?text=' + encodeURIComponent(t), tel = () => 'tel:' + S.phone.replace(/\s/g, '');
  const link = (u, l) => `<a href="${E(/^(https?:|tel:|mailto:)/.test(u) ? u : href(u))}">${E(l)}</a>`, waL = (t) => link(wa(t), 'WhatsApp us'), cl = (c) => link('/courses/' + c.s + '/', c.n);
  const norm = (s) => ' ' + s.toLowerCase().replace(/[^a-z0-9₦ ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  const ALIAS = { 'iso 9001': 'iso-9001', ' 9001 ': 'iso-9001', 'iso 45001': 'iso-45001', ' 45001 ': 'iso-45001', 'iso 14001': 'iso-14001', ' 14001 ': 'iso-14001', ' ims ': 'ims', 'integrated management': 'ims', ' pmp ': 'pmp', 'project management professional': 'pmp', ' scrum ': 'scrum', 'ms project': 'ms-project', 'microsoft project': 'ms-project', ' hse ': 'hse-levels-1-2-3', 'health and safety': 'hse-levels-1-2-3', ' cisa ': 'cisa', ' cbap ': 'cbap', 'business analysis': 'cbap', ' sphri ': 'sphri', ' hr ': 'sphri', 'facility': 'operations-facility-management', 'data analysis': 'data-analysis', ' data ': 'data-analysis', ' ai ': 'ai-essentials', 'artificial intelligence': 'ai-essentials', 'web dev': 'web-development', 'website': 'web-development', 'microsoft office': 'microsoft-office', ' excel ': 'microsoft-office', ' word ': 'microsoft-office', 'computer appreciation': 'computer-appreciation', 'cyber': 'cybersecurity', ' vapt ': 'vapt-pci-dss', 'pci': 'vapt-pci-dss', 'penetration': 'vapt-pci-dss' };
  const bySlug = (s) => D.courses.find((c) => c.s === s);
  const course = (q) => { const t = norm(q); let hit = null, best = 0;
    for (const [k, slug] of Object.entries(ALIAS)) if (t.includes(k)) { const c = bySlug(slug); if (c && k.length > best) { hit = c; best = k.length; } }
    if (!hit) for (const c of D.courses) { const s = ' ' + c.short.toLowerCase() + ' '; if (t.includes(s) && s.length > best) { hit = c; best = s.length; } }
    return hit; };
  const priceLine = (c) => c.p ? `${cl(c)}: <b>${E(c.p.t)}</b>${c.p.promo ? ' (promotional price)' : ''}, ${E(c.du || 'duration to be confirmed')}.` : `${cl(c)}: price on enquiry. ${waL('Hello, please send me the price for ' + c.n)}.`;
  const R = [ /* [test, answer(question, course) -> {h, chips}]  first match wins */
    [/\b(hi|hello|hey|good (morning|afternoon|evening)|howdy)\b/, () => ({ h: 'Hello! How can I help? You can ask about courses, prices, registration or our location.' })],
    [/(thank|thanks|bye|goodbye)/, () => ({ h: 'You are welcome! If you need anything else, I am here. ' + waL('Hello, I would like to know more about Klevercomms Solutions.') + ' for a human.' })],
    [/(human|agent|real person|someone|speak to|talk to|whatsapp|call me)/, () => ({ h: `Our team is happy to help. ${waL('Hello, I would like to speak with someone at Klevercomms Solutions.')} or call ${link(tel(), S.phone)}.` })],
    [/(phone|number|email|e-mail|contact|reach)/, () => ({ h: `Call or WhatsApp ${link(tel(), S.phone)}${S.emails.length ? ', or email ' + S.emails.map((m) => link('mailto:' + m, m)).join(' / ') : ''}. Or use the ${link('/contact/', 'contact page')}.` })],
    [/(where|address|location|office|map|direction|find you|visit|located)/, () => ({ h: `We are at <b>${E(S.address)}</b>. ${link('https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(S.mapQuery), 'Get directions')} or see the ${link('/contact/', 'contact page')}.` })],
    [/(refund|cancel|reschedul|transfer my)/, () => ({ h: `Our refund and rescheduling rules are being finalised, so I will not guess. Please ${waL('Hello, I have a question about refunds or rescheduling.')} or read the ${link('/refund-policy/', 'Payment & Refund page')} once it is approved.` })],
    [/(certificate|certified|certification|accredit|exam)/, (q, c) => ({ h: `Certificate details are confirmed by Klevercomms for each course. Completing a training does not automatically grant an external professional certification; the exam or certifying body sets its own requirements.${c ? ' See ' + cl(c) + '.' : ''}` })],
    [/(how much|price|cost|fee|naira|₦|promo|discount|cheap)/, (q, c) => { if (c) return { h: priceLine(c), chips: ['How do I register?'] };
      const L = D.courses.filter((x) => x.p).sort((a, b) => a.p.a - b.p.a); return { h: L.length ? `Course fees range from <b>${E(L[0].p.t)}</b> to <b>${E(L[L.length - 1].p.t)}</b>, depending on the course. Tell me the course (for example “How much is PMP?”) or see all prices on the ${link('/courses/', 'courses page')}. Some courses are by enquiry.` : `Prices are on the ${link('/courses/', 'courses page')}.` }; }],
    [/(how long|duration|days|weeks|how many)/, (q, c) => c ? { h: `${cl(c)} runs for <b>${E(c.du || 'a duration still to be confirmed')}</b>. ${c.du ? '' : waL('Hello, how long is the ' + c.n + ' course?') + ' to ask.'}` } : { h: 'Durations differ by course (for example 5 days for HSE, ISO, PMP and CISA, and 2 weeks for Data Analysis). Which course are you asking about?' }],
    [/(online|physical|in person|in-person|virtual|onsite|on site|class room|classroom)/, (q, c) => ({ h: `Courses are offered online or physically. Choose your preferred mode when you register${c ? ' for ' + cl(c) : ''}.` })],
    [/(when|date|schedule|start|next class|upcoming|intake)/, (q, c) => { const L = (c ? [c] : D.courses).flatMap((x) => x.ss.map((s) => ({ x, s }))).slice(0, 3); return { h: L.length ? 'Upcoming dates: ' + L.map(({ x, s }) => `${E(x.short)} starts ${E(s.d)} (${E(s.m)})`).join('; ') + '.' : `No dates are published yet. ${waL('Hello, when is the next class' + (c ? ' for ' + c.n : '') + '?')} and we will tell you the next available date.` }; }],
    [/(pay|payment|card|paystack|bank|transfer|installment|instalment|part)/, () => ({ h: 'Online payment is being connected. Register for your course and our team will confirm your place and share the payment details.', chips: ['How do I register?'] })],
    [/(register|enrol|enroll|sign up|signup|book|join|apply)/, (q, c) => ({ h: `Registering takes a few minutes: choose the course, fill in your details, preferred mode and date. ${c ? link('/enrol.html?course=' + c.s, 'Enrol for ' + c.short) : link('/courses/', 'Choose a course')}.` })],
    [/(corporate|company|organi[sz]ation|my team|staff|employees|group|business)/, () => ({ h: `Yes, we train teams onsite, online and in groups, starting with a training needs assessment. ${link('/corporate-training/#proposal', 'Request a corporate proposal')}.` })],
    [/(consult|advis|audit|compliance support)/, () => ({ h: `Our consultancy service list is being finalised. Tell us what you need and we will advise whether and how we can help: ${link('/consultancy/', 'Consultancy')} or ${waL('Hello, I need consultancy support.')}.` })],
    [/(course|training|offer|learn|program|list|categor|what do you)/, (q, c) => c ? { h: `${cl(c)}: ${E(c.sm)} ${E(c.du || '')}` } : { h: 'We offer courses in: ' + D.cats.map((x) => link('/courses/category/' + x.slug + '/', x.n)).join(', ') + '. Ask about a specific course for price and duration.', chips: ['How much is ISO 9001?', 'Tell me about PMP'] }],
  ];
  const answer = (q) => { const c = course(q), t = norm(q);
    for (const [re, fn] of R) if (re.test(t.trim())) return fn(q, c);
    if (c) return { h: `${cl(c)}: ${E(c.sm)} ${priceLine(c)}`, chips: ['How do I register?'] };
    return { h: `I am not sure about that one. You can ask about courses, prices, duration, registration or our location, or ${waL('Hello, I have a question: ' + q)} and a person will reply.`, chips: A.chips.slice(0, 3) }; };
  let panel, log;
  const add = (cls, html) => { const d = document.createElement('div'); d.className = 'msg ' + cls; d.innerHTML = html; log.append(d); log.scrollTop = log.scrollHeight; return d; };
  const chips = (arr) => { if (!arr?.length) return; const d = document.createElement('div'); d.className = 'qr'; arr.forEach((t) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.addEventListener('click', () => send(t)); d.append(b); }); log.lastChild.append(d); log.scrollTop = log.scrollHeight; };
  async function send(text) {
    text = text.trim(); if (!text) return; log.querySelectorAll('.qr').forEach((q) => q.remove()); add('me', E(text));
    const ty = document.createElement('div'); ty.className = 'typ'; ty.innerHTML = '<i></i><i></i><i></i>'; log.append(ty); log.scrollTop = log.scrollHeight;
    const out = answer(text); await new Promise((r) => setTimeout(r, rm ? 0 : 450 + Math.random() * 350)); ty.remove(); add('bot', out.h); chips(out.chips);
  }
  const w = document.createElement('div'); w.className = 'cb';
  w.innerHTML = `<div class="cp" id="cp" role="dialog" aria-label="${E(A.name)}"><div class="ch"><div><b>${E(A.name)}</b><small>Automated assistant · replies instantly</small></div><button type="button" aria-label="Close chat">✕</button></div><div class="cm" role="log" aria-live="polite" aria-label="Conversation"></div><form class="cf"><label class="sr" for="cin">Your message</label><input id="cin" placeholder="Ask about a course…" autocomplete="off" maxlength="300"><button type="submit" aria-label="Send">➤</button></form><div class="cw">I cannot take payments or give legal advice. For anything else, ${waL('Hello, I would like to speak with someone at Klevercomms Solutions.')}.</div></div><button class="fab" type="button" aria-expanded="false" aria-controls="cp"><i></i><span class="lg">Ask ${E(A.name.split(' ')[0])}</span><span class="sm">Chat</span></button>`;
  document.body.append(w); panel = $('.cp', w); log = $('.cm', w); const fab = $('.fab', w), input = $('#cin', w);
  const set = (o) => { panel.classList.toggle('open', o); fab.setAttribute('aria-expanded', o); if (o) { if (!log.children.length) { add('bot', E(A.greeting)); chips(A.chips); } input.focus(); } else fab.focus(); };
  fab.addEventListener('click', () => set(!panel.classList.contains('open'))); $('.ch button', w).addEventListener('click', () => set(false));
  w.addEventListener('keydown', (e) => e.key === 'Escape' && panel.classList.contains('open') && set(false));
  $('.cf', w).addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; send(v); });
})();
