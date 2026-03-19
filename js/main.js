// ========== Header scroll effect ==========
window.addEventListener('scroll', () => {
  const header = document.querySelector('.header');
  if (header) header.classList.toggle('scrolled', window.scrollY > 20);
});

// ========== Mobile menu toggle ==========
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
  }

  // ========== Fade-in on scroll ==========
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.05 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

  // ========== Number counter animation (stats overlay) ==========
  document.querySelectorAll('.num[data-target]').forEach(el => {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const target = +el.dataset.target;
        const duration = 2000;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          el.textContent = Math.floor(p * target).toLocaleString();
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
  });

  // ========== Legacy number counter (.stat-num) for sub-pages ==========
  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const target = +el.dataset.target;
        const suffix = el.dataset.suffix || '';
        const duration = 2000;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          el.textContent = Math.floor(p * target).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
  });

  // ========== Count-up animation (algo stats etc.) ==========
  document.querySelectorAll('.count-up[data-target]').forEach(el => {
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const target = +el.dataset.target;
        const suffix = el.dataset.suffix || '';
        const duration = 1500;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          // easeOutCubic for a satisfying deceleration
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(ease * target) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(el);
  });

  // ========== Hero Slide Carousel ==========
  // 如果 drone3d.js 存在（首页3D banner），由 drone3d.js 统一控制切换，避免双计时器冲突
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.hero-indicator');
  const hasDrone3d = !!document.getElementById('drone-3d-canvas');
  if (slides.length > 1 && !hasDrone3d) {
    let current = 0;
    let timer = null;

    function goToSlide(index) {
      slides.forEach(s => s.classList.remove('active'));
      indicators.forEach(i => i.classList.remove('active'));
      slides[index].classList.add('active');
      indicators[index].classList.add('active');
      current = index;
    }

    function nextSlide() {
      goToSlide((current + 1) % slides.length);
    }

    function startTimer() {
      stopTimer();
      timer = setInterval(nextSlide, 5000);
    }

    function stopTimer() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    indicators.forEach(ind => {
      ind.addEventListener('click', () => {
        goToSlide(+ind.dataset.index);
        startTimer();
      });
    });

    startTimer();
  }

  // ========== Image fallback for 404 ==========
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('error', function() {
      this.style.display = 'none';
      if (this.parentElement) {
        this.parentElement.style.background = 'linear-gradient(135deg, var(--primary-2, #D2D7FB), var(--primary-1, #EFF1FD))';
      }
    });
  });
  // Background-image 404 check for divs
  document.querySelectorAll('.feature-img, .solution-img, .solution-card-img, .cert-img, .case-thumb').forEach(el => {
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg !== 'none') {
      const url = bg.match(/url\(["']?(.*?)["']?\)/);
      if (url && url[1]) {
        const testImg = new Image();
        testImg.onerror = () => {
          el.style.backgroundImage = 'none';
          el.style.background = 'linear-gradient(135deg, #D2D7FB, #EFF1FD)';
        };
        testImg.src = url[1];
      }
    }
  });

  // ========== Floating Contact Bubbles ==========
  (function(){
    if (document.querySelector('.float-contact')) return;

    // Determine about.html link path based on current page location
    var aboutHref = 'pages/about.html#contact';
    if (location.pathname.indexOf('/pages/solutions/') > -1 || location.pathname.indexOf('/pages/products/') > -1) aboutHref = '../about.html#contact';
    else if (location.pathname.indexOf('/pages/') > -1) aboutHref = 'about.html#contact';

    var wrap = document.createElement('div');
    wrap.className = 'float-contact';
    wrap.innerHTML =
      // 微信
      '<div class="float-btn" title="微信咨询">' +
        '<svg viewBox="0 0 24 24"><path d="M9.5 4C5.36 4 2 6.69 2 10c0 1.89 1.08 3.57 2.78 4.67L4 17l2.5-1.29c.89.26 1.85.29 2.5.29"/><circle cx="7.5" cy="9.5" r=".5" fill="currentColor" stroke="none"/><circle cx="11" cy="9.5" r=".5" fill="currentColor" stroke="none"/><path d="M14.5 7.5c3.87 0 7.5 2.37 7.5 5.5s-3.13 5.5-7.5 5.5c-.96 0-1.87-.12-2.71-.34L9 19.5l.75-2.39C8.09 16.1 7 14.68 7 13c0-3.13 3.13-5.5 7.5-5.5z"/><circle cx="12.5" cy="13" r=".5" fill="currentColor" stroke="none"/><circle cx="16.5" cy="13" r=".5" fill="currentColor" stroke="none"/></svg>' +
        '<div class="float-panel"><div class="float-panel-qr"><img src="" alt="微信二维码"><span>微信扫码添加咨询</span></div></div>' +
      '</div>' +
      // 在线客服
      '<a class="float-btn" href="' + aboutHref + '" title="在线客服">' +
        '<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>' +
        '<div class="float-panel"><div class="float-panel-title">在线咨询</div><div class="float-panel-desc">在线实时沟通，快速响应您的问题<br>工作时间：周一至周五 9:00-18:00</div></div>' +
      '</a>' +
      // 电话
      '<a class="float-btn" href="tel:15782221141" title="联系电话">' +
        '<svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
        '<div class="float-panel"><div class="float-panel-title">联系电话</div><div class="float-panel-phone">157-8222-1141</div><div class="float-panel-sub">7×24小时紧急事件响应</div></div>' +
      '</a>' +
      // 回到顶部
      '<button class="float-btn back-top" title="回到顶部">' +
        '<svg viewBox="0 0 24 24" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>' +
      '</button>';

    document.body.appendChild(wrap);

    // Back to top button
    var backTop = wrap.querySelector('.back-top');
    backTop.addEventListener('click', function(){ window.scrollTo({top:0, behavior:'smooth'}); });
    window.addEventListener('scroll', function(){
      backTop.classList.toggle('show', window.scrollY > 400);
    });
  })();

  // ========== Case filter ==========
  document.querySelectorAll('.case-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.case-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.category;
      document.querySelectorAll('.case-card').forEach(card => {
        card.style.display = (cat === 'all' || card.dataset.category === cat) ? '' : 'none';
      });
    });
  });
});
