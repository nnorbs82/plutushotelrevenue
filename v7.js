(() => {
  'use strict';

  const page = document.body.dataset.page || '';
  const year = new Date().getFullYear();
  const active = (...names) => names.includes(page) ? ' active' : '';

  const headerTarget = document.querySelector('[data-v7-header]');
  if (headerTarget) {
    headerTarget.innerHTML = `
      <header class="v7-header">
        <nav class="v7-nav" aria-label="Main navigation">
          <a class="v7-brand" href="index.html" aria-label="Plutus Hotel Revenue - home">
            <img src="logo/logo.png" alt="Plutus Hotel Revenue">
            <span class="v7-brand-copy"><strong>Plutus</strong><span>Hotel Revenue</span></span>
          </a>
          <div class="v7-links">
            <a class="${active('home').trim()}" href="index.html">Home</a>
            <a class="${active('about').trim()}" href="about.html">About</a>
            <a class="${active('revenue').trim()}" href="revenue_management.html">Revenue management</a>
            <div class="v7-drop">
              <button type="button" aria-expanded="false">Software</button>
              <div class="v7-drop-panel">
                <a href="software.html">Software overview</a>
                <a href="mews_pms.html">Mews PMS</a>
                <a href="cloudbeds_pms.html">Cloudbeds PMS</a>
                <a href="siteminder_chm.html">SiteMinder channel manager</a>
              </div>
            </div>
            <div class="v7-drop">
              <button type="button" aria-expanded="false">Tips & tools</button>
              <div class="v7-drop-panel">
                <a href="tips.html">Tips library</a>
                <a href="hotel_photoshoot_tips.html">Hotel photography</a>
                <a href="web_design_tips.html">Hotel website design</a>
                <a href="digital_marketing_tips.html">Digital marketing</a>
                <a href="hotel-break-even-calculator.html">Break-even calculator</a>
              </div>
            </div>
            <a class="${active('blog').trim()}" href="blog.html">Journal</a>
          </div>
          <a class="v7-nav-cta" href="contact.html">Talk to me</a>
          <button class="v7-menu" type="button" aria-expanded="false" aria-label="Open menu">☰</button>
        </nav>
        <div class="v7-mobile">
          <a href="index.html">Home</a>
          <a href="about.html">About</a>
          <a href="revenue_management.html">Revenue management</a>
          <a href="software.html">Software</a>
          <a href="tips.html">Tips & tools</a>
          <a href="blog.html">Journal</a>
          <a href="contact.html">Talk to me</a>
        </div>
      </header>`;
  }

  const footerTarget = document.querySelector('[data-v7-footer]');
  if (footerTarget) {
    footerTarget.innerHTML = `
      <footer class="v7-footer">
        <div class="shell">
          <div class="v7-footer-grid">
            <div class="v7-footer-brand">
              <img src="logo/logo.png" alt="Plutus Hotel Revenue">
              <p>Independent hotel revenue management and commercial guidance by Norbert Nica.</p>
            </div>
            <div class="v7-footer-col"><strong>Company</strong><a href="about.html">About</a><a href="revenue_management.html">Revenue management</a><a href="contact.html">Contact</a></div>
            <div class="v7-footer-col"><strong>Software</strong><a href="software.html">Overview</a><a href="mews_pms.html">Mews</a><a href="cloudbeds_pms.html">Cloudbeds</a><a href="siteminder_chm.html">SiteMinder</a></div>
            <div class="v7-footer-col"><strong>Tips & tools</strong><a href="tips.html">Library</a><a href="hotel-break-even-calculator.html">Break-even calculator</a><a href="hotel_photoshoot_tips.html">Photography</a><a href="web_design_tips.html">Website design</a></div>
            <div class="v7-footer-col"><strong>Legal</strong><a href="privacy_policy.html">Privacy</a><a href="terms_and_conditions.html">Terms</a></div>
          </div>
          <div class="v7-footer-bottom"><span>© ${year} Plutus Hotel Revenue.</span><span>Barcelona, Spain · Independent consultancy</span></div>
        </div>
      </footer>`;
  }

  document.querySelectorAll('.v7-drop').forEach((drop) => {
    const button = drop.querySelector('button');
    button?.addEventListener('click', (event) => {
      event.stopPropagation();
      const open = !drop.classList.contains('open');
      document.querySelectorAll('.v7-drop.open').forEach((other) => {
        if (other !== drop) {
          other.classList.remove('open');
          other.querySelector('button')?.setAttribute('aria-expanded', 'false');
        }
      });
      drop.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', () => {
    document.querySelectorAll('.v7-drop.open').forEach((drop) => {
      drop.classList.remove('open');
      drop.querySelector('button')?.setAttribute('aria-expanded', 'false');
    });
  });

  const menu = document.querySelector('.v7-menu');
  const mobile = document.querySelector('.v7-mobile');
  menu?.addEventListener('click', () => {
    const open = !mobile?.classList.contains('open');
    mobile?.classList.toggle('open', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.textContent = open ? '×' : '☰';
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealItems.forEach((item) => item.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((item) => observer.observe(item));
  }

  // Animated hero orbit metric - visual only, deliberately labelled as an example signal.
  const orbitValue = document.querySelector('[data-orbit-value]');
  if (orbitValue && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const values = ['72.4', '73.1', '74.0', '73.6', '74.8'];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % values.length;
      orbitValue.textContent = values[i];
    }, 2400);
  }

  // Subtle pointer parallax on hero visual.
  const orbit = document.querySelector('.v7-orbit');
  if (orbit && matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    orbit.addEventListener('pointermove', (event) => {
      const rect = orbit.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      orbit.style.transform = `translate3d(${x * 10}px,${y * 10}px,0)`;
    });
    orbit.addEventListener('pointerleave', () => { orbit.style.transform = ''; });
  }
})();
