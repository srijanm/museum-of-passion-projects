/* =========================================================
   OLD INTERNET — script
   Phase 1: hit counter
   Phase 3: lightbox, Winamp player, sound toggle, drag
   ========================================================= */

(function () {
  'use strict';

  // ---------- Hit counter ----------
  (function initHitCounter() {
    const SEED = 1337;
    const KEY = 'visitorCount';
    let count = parseInt(localStorage.getItem(KEY) || '0', 10);
    if (!count || isNaN(count)) count = SEED;
    count += 1;
    localStorage.setItem(KEY, String(count));
    const el = document.getElementById('visitor-count');
    if (el) el.textContent = String(count).padStart(8, '0');
  })();

  // ---------- Sound system ----------
  // Single playSound entry point — no-ops when soundsEnabled is false.
  // Wires real audio if MP3s exist in /assets/sounds, otherwise silent.
  const soundFiles = {
    chime: 'assets/sounds/chime.mp3',
    modem: 'assets/sounds/internet.mp3',
    ding:  'assets/sounds/ding.mp3',
  };
  const audioCache = {};
  let soundsEnabled = false;

  function playSound(name) {
    if (!soundsEnabled) return;
    const src = soundFiles[name];
    if (!src) return;
    let a = audioCache[name];
    if (!a) {
      a = new Audio(src);
      a.preload = 'auto';
      audioCache[name] = a;
    }
    try {
      a.currentTime = 0;
      const p = a.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) { /* ignore */ }
  }

  // ---------- Sound toggle ----------
  const soundToggle = document.getElementById('sound-toggle');
  const soundLabel = document.getElementById('sound-toggle-label');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      soundsEnabled = !soundsEnabled;
      if (soundLabel) {
        soundLabel.textContent = soundsEnabled
          ? '🔇 TURN OFF SOUNDS'
          : '🔊 TURN ON SOUNDS';
      }
      if (soundsEnabled) playSound('chime');
    });
  }

  // ---------- Lightbox ----------
  const lightbox      = document.getElementById('lightbox');
  const lbOverlay     = document.getElementById('lightbox-overlay');
  const lbClose       = document.getElementById('lightbox-close');
  const lbImg         = document.getElementById('lightbox-img');
  const lbCaption     = document.getElementById('lightbox-caption');
  const previewTiles  = document.querySelectorAll('.preview-tile');

  function openLightbox(src, caption, alt) {
    if (!lightbox) return;
    lbImg.src = src || '';
    lbImg.alt = alt || '';
    lbCaption.textContent = caption || '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    playSound('ding');
  }
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  previewTiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      const src     = tile.getAttribute('data-img');
      const caption = tile.getAttribute('data-caption');
      const tag     = tile.getAttribute('data-tag') || '';
      openLightbox(src, caption + (tag ? ' — ' + tag : ''), caption);
    });
  });
  if (lbOverlay) lbOverlay.addEventListener('click', closeLightbox);
  if (lbClose)   lbClose.addEventListener('click',   closeLightbox);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox && !lightbox.hidden) closeLightbox();
  });

  // ---------- DOWNLOAD button — modem sound on click ----------
  document.querySelectorAll('.btn-download').forEach((btn) => {
    btn.addEventListener('click', () => playSound('modem'));
  });


  // ---------- Banner ad — shake + ding on click ----------
  const adBanner = document.getElementById('ad-banner');
  if (adBanner) {
    const triggerAd = () => {
      adBanner.classList.remove('shaking');
      // force reflow so the animation can replay on rapid clicks
      void adBanner.offsetWidth;
      adBanner.classList.add('shaking');
      playSound('ding');
    };
    adBanner.addEventListener('click', triggerAd);
    adBanner.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerAd(); }
    });
  }

  // ---------- Dial-up modal (first visit) ----------
  const dialupModal   = document.getElementById('dialup-modal');
  const dialupOverlay = document.getElementById('dialup-overlay');
  const dialupClose   = document.getElementById('dialup-close');
  const dialupConnect = document.getElementById('dialup-connect');
  const dialupCancel  = document.getElementById('dialup-cancel');
  const dialupStatus  = document.getElementById('dialup-status');
  const dialupBar     = document.getElementById('dialup-progress-bar');

  const DIALUP_KEY = 'visited';
  const DIALUP_STEPS = [
    { text: 'Initializing modem...',           pct: 5  },
    { text: 'Dialing 1-800-OLD-NET...',        pct: 20 },
    { text: 'Carrier detected at 28.8k baud...', pct: 45 },
    { text: 'Authenticating user...',          pct: 65 },
    { text: 'Loading oldinternet.com...',      pct: 85 },
    { text: 'Connected!',                      pct: 100 }
  ];
  let dialupTimer = null;
  let dialupAudio = null;

  function setDialupVisited() {
    try { localStorage.setItem(DIALUP_KEY, '1'); } catch (_) {}
  }
  function openDialup() {
    if (!dialupModal) return;
    dialupModal.hidden = false;
    if (dialupStatus) dialupStatus.textContent = DIALUP_STEPS[0].text;
    if (dialupBar)    dialupBar.style.width = '0%';
  }
  function closeDialup() {
    if (!dialupModal) return;
    dialupModal.hidden = true;
    if (dialupTimer) { clearTimeout(dialupTimer); dialupTimer = null; }
    if (dialupAudio) { try { dialupAudio.pause(); } catch (_) {} dialupAudio = null; }
    setDialupVisited();
  }
  function applyDialupStep(i) {
    const step = DIALUP_STEPS[i];
    if (!step) return;
    if (dialupStatus) dialupStatus.textContent = step.text;
    if (dialupBar)    dialupBar.style.width = step.pct + '%';
  }
  function startAutoSequence() {
    // No audio on auto-play — browsers block it without a user gesture.
    let i = 0;
    applyDialupStep(i);
    const tick = () => {
      i++;
      if (i < DIALUP_STEPS.length) {
        applyDialupStep(i);
        dialupTimer = setTimeout(tick, 800);
      } else {
        // "Connected!" already showing; hold 1s then close.
        dialupTimer = setTimeout(closeDialup, 1000);
      }
    };
    dialupTimer = setTimeout(tick, 800);
  }
  function clickConnect() {
    // User gesture — audio is allowed. Skip to "Connected!" and close after 1s.
    if (dialupTimer) { clearTimeout(dialupTimer); dialupTimer = null; }
    try {
      dialupAudio = new Audio('assets/sounds/internet.mp3');
      const p = dialupAudio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (_) {}
    applyDialupStep(DIALUP_STEPS.length - 1);
    dialupTimer = setTimeout(closeDialup, 1000);
  }

  if (dialupConnect) dialupConnect.addEventListener('click', clickConnect);
  if (dialupCancel)  dialupCancel.addEventListener('click',  closeDialup);
  if (dialupClose)   dialupClose.addEventListener('click',   closeDialup);
  if (dialupOverlay) dialupOverlay.addEventListener('click', closeDialup);

  // Show on first visit, 500ms after load
  try {
    if (!localStorage.getItem(DIALUP_KEY)) {
      setTimeout(() => {
        openDialup();
        startAutoSequence();
      }, 500);
    }
  } catch (_) { /* localStorage unavailable */ }

  // ---------- Functional poll ----------
  (function initPoll() {
    const body = document.getElementById('poll-body');
    if (!body) return;

    const POLL_KEY   = 'oi:poll';
    const TALLY_KEY  = 'oi:polltally';
    const SEED       = { geocities: 47, jeeves: 23, hampsterdance: 89, all: 156 };
    const OPTIONS    = [
      { key: 'geocities',     label: 'Geocities',    color: 'poll-bar-purple' },
      { key: 'jeeves',        label: 'AskJeeves',    color: 'poll-bar-green'  },
      { key: 'hampsterdance', label: 'Hampsterdance',color: 'poll-bar-pink'   },
      { key: 'all',           label: 'all of the above', color: 'poll-bar-orange' },
    ];

    function loadTally() {
      try {
        const t = JSON.parse(localStorage.getItem(TALLY_KEY) || 'null');
        if (t && typeof t === 'object') return Object.assign({}, SEED, t);
      } catch (_) {}
      return Object.assign({}, SEED);
    }
    function saveTally(t) {
      try { localStorage.setItem(TALLY_KEY, JSON.stringify(t)); } catch (_) {}
    }
    function loadVote() {
      try { return localStorage.getItem(POLL_KEY); } catch (_) { return null; }
    }
    function saveVote(opt) {
      try { localStorage.setItem(POLL_KEY, opt); } catch (_) {}
    }

    function renderForm() {
      const radios = OPTIONS.map((o, i) =>
        `<label><input type="radio" name="poll" value="${o.key}"${i===0?' checked':''}> ${o.label}</label>`
      ).join('');
      body.innerHTML =
        '<p class="poll-q">What was the BEST website of all time?</p>' +
        '<div class="poll-options">' + radios + '</div>' +
        '<div class="poll-buttons">' +
          '<button class="poll-btn" id="poll-vote-btn">VOTE</button>' +
        '</div>';
      const btn = document.getElementById('poll-vote-btn');
      btn.addEventListener('click', () => {
        const sel = body.querySelector('input[name="poll"]:checked');
        if (!sel) return;
        const t = loadTally();
        t[sel.value] = (t[sel.value] || 0) + 1;
        saveTally(t);
        saveVote(sel.value);
        playSound('ding');
        renderResults(sel.value);
      });
    }

    function renderResults(youOpt) {
      const t = loadTally();
      const total = Object.values(t).reduce((a,b)=>a+b, 0) || 1;
      const you   = youOpt || loadVote();
      const youOption = OPTIONS.find(o => o.key === you);
      const rows = OPTIONS.map(o => {
        const n   = t[o.key] || 0;
        const pct = Math.round((n / total) * 100);
        return (
          '<div class="poll-row">' +
            '<div class="poll-row-label"><span>' + o.label + '</span><span>' + pct + '%</span></div>' +
            '<div class="poll-bar-track">' +
              '<div class="poll-bar-fill ' + o.color + '" style="width:' + pct + '%"></div>' +
            '</div>' +
          '</div>'
        );
      }).join('');
      body.innerHTML =
        '<p class="poll-q">What was the BEST website of all time?</p>' +
        '<div class="poll-bars">' + rows + '</div>' +
        '<p class="poll-you">you voted for <strong>' + (youOption ? youOption.label : '—') + '</strong> · total votes: ' + total + '</p>';
    }

    if (loadVote()) renderResults(); else renderForm();
  })();

  // ---------- Webring (Internet Archive snapshots) ----------
  (function initWebring() {
    const SITES = [
      'https://web.archive.org/web/1999/https://www.spacejam.com/',
      'https://web.archive.org/web/1999/https://www.hampsterdance.com/',
      'https://web.archive.org/web/1999/https://www.askjeeves.com/',
      'https://web.archive.org/web/1999/https://www.geocities.com/',
      'https://web.archive.org/web/1999/https://www.altavista.com/',
    ];
    let idx = 0;
    function open(i) {
      const url = SITES[((i % SITES.length) + SITES.length) % SITES.length];
      window.open(url, '_blank', 'noopener');
      playSound('ding');
    }
    const prev = document.getElementById('webring-prev');
    const next = document.getElementById('webring-next');
    const rand = document.getElementById('webring-random');
    if (prev) prev.addEventListener('click', (e) => { e.preventDefault(); idx -= 1; open(idx); });
    if (next) next.addEventListener('click', (e) => { e.preventDefault(); idx += 1; open(idx); });
    if (rand) rand.addEventListener('click', (e) => { e.preventDefault(); idx = Math.floor(Math.random() * SITES.length); open(idx); });
  })();

  // ---------- Guestbook ----------
  (function initGuestbook() {
    const list  = document.getElementById('guestbook-entries');
    const form  = document.getElementById('guestbook-form');
    const meta  = document.getElementById('gb-meta');
    if (!list || !form) return;

    const GB_KEY = 'oi:guestbook';
    const FAKE_TOTAL = 1847;

    const SEEDS = [
      { name: 'xXxDarkSkaterxXx',  iso: '1999-12-31T23:47:00', message: 'Y2K is gonna be SICK!!!! see u all on the other side' },
      { name: 'PrincessPeach99',   iso: '2000-01-14T15:22:00', message: 'omg ur site is sooo cool can u sign mine? geocities.com/area51/9000/peach' },
      { name: 'webmaster_dave',    iso: '2000-02-08T09:15:00', message: 'first' },
      { name: 'Skaterboi2001',     iso: '2000-04-03T18:48:00', message: 'this site is da bomb!!! a/s/l?' },
      { name: 'ChattyCathy',       iso: '2000-06-17T14:33:00', message: "Hi there! I'm Cathy from Ohio. I love your website! Would you like to be in my webring? It's about cats. Email me at cathy_cats_99@hotmail.com :)" },
      { name: 'NSYNC4Lyfe',        iso: '2000-09-22T22:01:00', message: 'Bye Bye Bye to the new internet!!!! ✌' },
      { name: 'GamerKid',          iso: '2000-11-30T19:14:00', message: 'does this work with my Pentium II? my dad says we cant upgrade till next year' },
      { name: 'linkin_park_fan',   iso: '2001-02-14T16:20:00', message: "in the end... it doesn't even matter. great site tho" },
      { name: 'mom',               iso: '2001-05-05T11:22:00', message: "honey i'm so proud of you. dinner is ready. please come downstairs." },
      { name: 'webringmaster',     iso: '2001-08-11T01:55:00', message: 'would you be interested in joining my GeoCities webring? we have over 47 members. respond by ICQ.' },
    ];

    function loadUser() {
      try { return JSON.parse(localStorage.getItem(GB_KEY) || '[]') || []; }
      catch (_) { return []; }
    }
    function saveUser(arr) {
      try { localStorage.setItem(GB_KEY, JSON.stringify(arr)); } catch (_) {}
    }

    function fmtDate(iso) {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '';
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      let h = d.getHours(); const m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear() + ', ' + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
    }

    function escapeHTML(s) {
      return String(s).replace(/[&<>"']/g, ch => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
      }[ch]));
    }

    function render() {
      const userPosts = loadUser();
      const all = userPosts.concat(SEEDS); // newest user posts first, then seeds
      list.innerHTML = all.map(e => (
        '<div class="gb-entry">' +
          '<div class="gb-entry-header">' +
            '<span class="gb-entry-name">' + escapeHTML(e.name) + '</span>' +
            '<span class="gb-entry-date"> · ' + fmtDate(e.iso) + '</span>' +
          '</div>' +
          '<div class="gb-entry-msg">' + escapeHTML(e.message) + '</div>' +
        '</div>'
      )).join('');
      if (meta) {
        meta.textContent = '[ showing ' + all.length + ' of ' + (FAKE_TOTAL + userPosts.length).toLocaleString() + ' entries ]';
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameEl = document.getElementById('gb-name');
      const msgEl  = document.getElementById('gb-message');
      const errEl  = document.getElementById('gb-error');
      const name = (nameEl.value || '').trim().slice(0, 100);
      const msg  = (msgEl.value  || '').trim().slice(0, 280);
      if (!name || !msg) {
        if (errEl) errEl.hidden = false;
        return;
      }
      if (errEl) errEl.hidden = true;
      const userPosts = loadUser();
      userPosts.unshift({ name, iso: new Date().toISOString(), message: msg });
      saveUser(userPosts);
      nameEl.value = '';
      msgEl.value  = '';
      playSound('ding');
      render();
    });

    render();
  })();

  // ---------- Shoutbox ----------
  // Fake "live chat" that periodically adds a random message.
  // Pure visual — no input. Period-correct names + chatter.
  (function initShoutbox() {
    const feed = document.getElementById('shoutbox-feed');
    if (!feed) return;

    const USERS = [
      'xXxDarkSkaterxXx','PrincessPeach99','gamerdad42','l33tH4x0r',
      'aim_4_glory','napsterfan22','ChattyCathy','mom','moonlight_kitty',
      'webmaster_dave','Skaterboi2001','NSYNC4Lyfe','linkin_park_fan',
      'pogsKing','BeaniE_BB','yahoo_user_404','frosted_tipz'
    ];
    const MSGS = [
      "anyone else's modem disconnects when mom picks up the phone??",
      "y2k DIDN'T crash my computer 😎",
      "brb dialing in",
      "this site rules!!1!",
      "a/s/l?",
      "i miss winamp so bad",
      "downloading napster... 2 hrs remaining",
      "anyone wanna trade pogs",
      "lol my CRT is heating up the whole room",
      "the html on this page is SICK",
      "my dad just unplugged the modem AGAIN",
      "twitter was so much better before",
      "OMG remember angelfire??",
      "askJeeves > google fight me",
      "i voted for hampsterdance ★",
      "is this a virus",
      "no this is great actually",
      "geocities forever 🌐",
      "can i print this page out",
      "what's a 'tweet'",
      "BRB pizza rolls done",
      "u guys hear the new NSYNC?",
      "my buddy list is empty :(",
      "first time on the OLD internet — i love it here"
    ];
    const SYSTEM = [
      'webmaster_dave joined the chat',
      'mom left the chat',
      'NSYNC4Lyfe joined the chat',
      'linkin_park_fan was kicked (afk)',
      'PrincessPeach99 joined the chat'
    ];

    const MAX_VISIBLE = 7;

    function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
    function time() {
      const d = new Date();
      let h = d.getHours(); const m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12; if (h === 0) h = 12;
      return h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
    }
    function escapeHTML(s) {
      return String(s).replace(/[&<>"']/g, ch => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
      }[ch]));
    }

    function addMsg(opts) {
      const isSystem = !!opts.system;
      const wrap = document.createElement('div');
      wrap.className = 'shoutbox-msg' + (isSystem ? ' sb-system' : '');
      if (isSystem) {
        wrap.innerHTML =
          '<span class="sb-time">[' + time() + ']</span>' +
          '<span class="sb-user">★</span>' +
          '<span class="sb-text">' + escapeHTML(opts.text) + '</span>';
      } else {
        wrap.innerHTML =
          '<span class="sb-time">[' + time() + ']</span>' +
          '<span class="sb-user">' + escapeHTML(opts.user) + ':</span>' +
          '<span class="sb-text">' + escapeHTML(opts.text) + '</span>';
      }
      feed.appendChild(wrap);
      while (feed.children.length > MAX_VISIBLE) feed.removeChild(feed.firstChild);
    }

    // Seed initial visible messages without animation flash
    for (let i = 0; i < 5; i++) {
      addMsg({ user: pick(USERS), text: pick(MSGS) });
    }

    // Drip new messages
    function drip() {
      // ~1 in 6 chance of a system message
      if (Math.random() < 0.16) {
        addMsg({ system: true, text: pick(SYSTEM) });
      } else {
        addMsg({ user: pick(USERS), text: pick(MSGS) });
      }
      // random interval 2.2–4.5s
      const next = 2200 + Math.random() * 2300;
      setTimeout(drip, next);
    }
    setTimeout(drip, 1800);
  })();

  // ---------- Sparkle trail ----------
  // Period-correct cursor effect; throttled to keep the DOM sane.
  // Disabled on touch devices and when the user prefers reduced motion.
  (function initSparkles() {
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia &&
      window.matchMedia('(hover: none)').matches;
    if (reduceMotion || isTouch) return;

    const GLYPHS = ['✦', '✧', '✨', '★', '·'];
    let last = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - last < 60) return;
      last = now;
      const s = document.createElement('span');
      s.className = 'sparkle';
      s.textContent = GLYPHS[(Math.random() * GLYPHS.length) | 0];
      s.style.left = e.clientX + 'px';
      s.style.top  = e.clientY + 'px';
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 750);
    });
  })();

})();
