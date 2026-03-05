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

  // ========== Hero Slide Carousel ==========
  const slides = document.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.hero-indicator');
  if (slides.length > 1) {
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
