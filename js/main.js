/* ==========================================================================
   بوصلة | Bawsala — Landing page behaviour (vanilla JS, no dependencies)
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  doc.documentElement.classList.add('js');

  /* ---------- helpers ---------- */
  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  function toAr(n) {
    return String(n).replace(/\d/g, function (d) { return AR_DIGITS.charAt(Number(d)); });
  }
  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }

  /* ---------- image fallback sweep (images that failed before this script ran) ---------- */
  $$('img[data-fallback]').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0 && !img.getAttribute('data-fb-done')) {
      img.setAttribute('data-fb-done', '1');
      img.src = img.getAttribute('data-fallback');
    }
  });

  /* ---------- toast ---------- */
  var toastEl = $('#toast');
  var toastTimer = null;
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3200);
  }

  $$('[data-toast]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      toast(el.getAttribute('data-toast'));
    });
  });

  /* ---------- header: scrolled state + mobile menu ---------- */
  var header = $('#siteHeader');
  var navToggle = $('#navToggle');
  var navMenu = $('#navMenu');

  function setMenu(open) {
    if (!navToggle || !navMenu) return;
    navMenu.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    navToggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  }
  if (navToggle) {
    navToggle.addEventListener('click', function () {
      setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    $$('a', navMenu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1000) setMenu(false); });
  }

  /* ---------- scroll spy (nav highlight) + header shadow ---------- */
  var spyLinks = $$('[data-spy]');
  var ticking = false;

  function updateOnScroll() {
    ticking = false;
    var y = window.pageYOffset || doc.documentElement.scrollTop;
    if (header) header.classList.toggle('is-scrolled', y > 8);

    var offset = 160;
    var anchors = ['steps', 'courses', 'contact'];
    var current = 'top';
    anchors.forEach(function (id) {
      var el = doc.getElementById(id);
      if (el && el.getBoundingClientRect().top <= offset) current = id;
    });
    spyLinks.forEach(function (a) {
      var on = a.getAttribute('data-spy') === current;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  function onScroll() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(updateOnScroll); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateOnScroll();

  /* ---------- reveal on scroll ---------- */
  var revealTargets = $$('.reveal, .step, .how');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealTargets.forEach(function (el) { io.observe(el); });
  } else {
    revealTargets.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- course interest buttons ---------- */
  $$('[data-interest]').forEach(function (btn) {
    var original = btn.textContent;
    btn.addEventListener('click', function () {
      var name = btn.getAttribute('data-interest');
      var done = btn.classList.toggle('is-done');
      btn.textContent = done ? 'تم تسجيل اهتمامك' : original;
      toast(done ? 'سجّلنا اهتمامك بـ' + name + '. سنراسلك عند فتح التسجيل.' : 'ألغينا تسجيل اهتمامك.');
    });
  });

  /* ---------- pricing: pick a plan ---------- */
  var plans = $$('.plan');
  $$('[data-pick]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var plan = btn.closest('.plan');
      plans.forEach(function (p) { p.classList.toggle('is-selected', p === plan); });
      toast('اخترت حزمة «' + plan.getAttribute('data-plan') + '». أنشئ حسابك لإكمال الشراء.');
    });
  });

  /* ---------- quick assessment (3 questions) ---------- */
  var quiz = $('#quiz');
  if (quiz) {
    var QUESTIONS = [
      { q: 'عندما تواجه مشكلة جديدة في العمل، ماذا تفعل أولًا؟',
        o: [['أقسّم المهمة وأضع خطة تنفيذ', 'pm'], ['أبني نموذجًا سريعًا بالكود', 'dev'], ['أجمع البيانات وأبحث عن الأنماط', 'data']] },
      { q: 'أي نشاط تفضّله في وقت فراغك؟',
        o: [['ترتيب أفكار وتنظيم مشروع', 'pm'], ['تجربة أدوات وأكواد جديدة', 'dev'], ['قراءة أرقام وتقارير', 'data']] },
      { q: 'ما الذي يرضيك في نهاية يوم العمل؟',
        o: [['فريق أنجز هدفه في موعده', 'pm'], ['ميزة تعمل أمام عينيّ', 'dev'], ['فهمت سبب نتيجة غريبة', 'data']] }
    ];
    var TOTAL_SECONDS = 30;

    var elCount = $('#quizCount');
    var elTimer = $('#quizTimer');
    var elFill = $('#quizFill');
    var elProgress = $('#quizProgress');
    var elStage = $('#quizStage');

    var state;
    var tick = null;
    var advance = null;

    function freshState() { return { i: 0, picks: [], left: TOTAL_SECONDS, started: false, locked: false, done: false }; }

    function setProgress(n) {
      elFill.style.width = Math.round((n / QUESTIONS.length) * 100) + '%';
      elProgress.setAttribute('aria-valuenow', String(n));
    }

    function renderQuestion() {
      var q = QUESTIONS[state.i];
      elCount.textContent = 'السؤال ' + toAr(state.i + 1) + ' من ' + toAr(QUESTIONS.length);
      var html = '<div class="quiz__view"><h3 class="quiz__q" id="quizQ"></h3>' +
        '<div class="quiz__options" role="radiogroup" aria-labelledby="quizQ">';
      q.o.forEach(function (opt, idx) {
        html += '<button class="quiz__opt" type="button" role="radio" aria-checked="false" data-idx="' + idx + '">' +
          '<span class="quiz__radio"><svg class="icon" aria-hidden="true"><use href="#i-tick"/></svg></span>' +
          '<span class="quiz__label"></span></button>';
      });
      html += '</div></div>';
      elStage.innerHTML = html;
      $('#quizQ', elStage).textContent = q.q;
      $$('.quiz__label', elStage).forEach(function (el, idx) { el.textContent = q.o[idx][0]; });
    }

    function stopTimers() {
      clearInterval(tick); tick = null;
      clearTimeout(advance); advance = null;
    }

    function renderResult() {
      state.done = true;
      stopTimers();
      elCount.textContent = 'النتيجة';
      elTimer.textContent = 'اكتمل التقييم';
      elTimer.classList.remove('is-low');
      setProgress(state.picks.length);

      if (state.picks.length === 0) {
        elStage.innerHTML = '<div class="result"><div class="result__head"><h3 class="result__best">انتهى الوقت</h3>' +
          '<p class="result__kicker">لم نستلم أي إجابة. جرّب مرة أخرى، فالأسئلة الثلاثة تأخذ أقل من دقيقة.</p></div>' +
          '<div class="result__actions"><button class="btn btn--primary btn--md" type="button" data-quiz-reset>ابدأ من جديد</button></div></div>';
        return;
      }

      var q = QUESTIONS[Math.min(state.picks.length - 1, state.i)];
      var lastPick = state.picks[state.picks.length - 1];
      var options = q.o.map(function (opt) {
        return '<button class="quiz__opt" type="button" role="radio" aria-checked="' + (opt[1] === lastPick) + '" disabled>' +
          '<span class="quiz__radio"><svg class="icon" aria-hidden="true"><use href="#i-tick"/></svg></span>' +
          '<span class="quiz__label"></span></button>';
      }).join('');
      elStage.innerHTML = '<div class="quiz__view quiz__view--locked"><h3 class="quiz__q" id="quizQ"></h3>' +
        '<div class="quiz__options" role="radiogroup" aria-labelledby="quizQ">' + options + '</div></div>';
      $('#quizQ', elStage).textContent = q.q;
      $$('.quiz__label', elStage).forEach(function (el, idx) { el.textContent = q.o[idx][0]; });
      elStage.insertAdjacentHTML('beforeend',
        '<div class="quiz__gate">' +
          '<div class="quiz__gate-card">' +
            '<p class="quiz__gate-note"><svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>متاح بعد إنشاء حساب مجاني</p>' +
            '<a class="btn btn--primary btn--md quiz__gate-cta" href="#pricing">أعرف نتيجتك الآن</a>' +
            '<button class="btn btn--ghost quiz__gate-retry" type="button" data-quiz-reset>إعادة التقييم</button>' +
          '</div>' +
        '</div>');
    }

    function startTimer() {
      if (state.started) return;
      state.started = true;
      tick = setInterval(function () {
        state.left -= 1;
        elTimer.textContent = toAr(Math.max(state.left, 0)) + ' ثانية';
        if (state.left <= 10) elTimer.classList.add('is-low');
        if (state.left <= 0) renderResult();
      }, 1000);
    }

    function reset() {
      stopTimers();
      state = freshState();
      elTimer.textContent = toAr(TOTAL_SECONDS) + ' ثانية';
      elTimer.classList.remove('is-low');
      setProgress(0);
      renderQuestion();
    }

    elStage.addEventListener('click', function (e) {
      var resetBtn = e.target.closest('[data-quiz-reset]');
      if (resetBtn) { reset(); return; }

      var opt = e.target.closest('.quiz__opt');
      if (!opt || state.locked || state.done) return;

      state.locked = true;
      opt.setAttribute('aria-checked', 'true');
      $('.quiz__options', elStage).classList.add('is-locked');
      state.picks.push(QUESTIONS[state.i].o[Number(opt.getAttribute('data-idx'))][1]);
      setProgress(state.picks.length);
      startTimer();

      advance = setTimeout(function () {
        state.locked = false;
        if (state.i < QUESTIONS.length - 1) {
          state.i += 1;
          renderQuestion();
        } else {
          renderResult();
        }
      }, 650);
    });

    reset();
  }

  /* ---------- contact form ---------- */
  var form = $('#contactForm');
  if (form) {
    var fields = [
      { id: 'cName', err: 'cNameErr', check: function (v) { return v.trim().length >= 2 ? '' : 'اكتب اسمك من فضلك.'; } },
      { id: 'cEmail', err: 'cEmailErr', check: function (v) {
          if (!v.trim()) return 'اكتب بريدك الإلكتروني.';
          return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'اكتب بريدًا إلكترونيًا صحيحًا مثل name@example.com.';
        } },
      { id: 'cMsg', err: 'cMsgErr', check: function (v) { return v.trim().length >= 10 ? '' : 'اكتب رسالة لا تقل عن ١٠ أحرف.'; } }
    ];
    var statusEl = $('#formStatus');
    var submitBtn = $('.form__submit', form);

    function validateField(f) {
      var input = doc.getElementById(f.id);
      var errEl = doc.getElementById(f.err);
      var msg = f.check(input.value);
      errEl.textContent = msg;
      input.closest('.field').classList.toggle('has-error', !!msg);
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      return !msg;
    }

    fields.forEach(function (f) {
      var input = doc.getElementById(f.id);
      input.addEventListener('blur', function () { if (input.value) validateField(f); });
      input.addEventListener('input', function () {
        if (input.closest('.field').classList.contains('has-error')) validateField(f);
        statusEl.classList.remove('is-visible');
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) {
        if (!validateField(f) && !firstBad) firstBad = doc.getElementById(f.id);
      });
      if (firstBad) { firstBad.focus(); return; }

      submitBtn.disabled = true;
      var label = submitBtn.textContent;
      submitBtn.textContent = 'جارٍ الإرسال…';
      setTimeout(function () {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = label;
        statusEl.classList.add('is-visible');
      }, 900);
    });
  }
})();
