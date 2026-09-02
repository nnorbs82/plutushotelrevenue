(() => {
  'use strict';

  const page = document.body.dataset.page || '';
  const currentYear = new Date().getFullYear();
  const chevron = '<svg class="nav-chevron" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5"/></svg>';
  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';

  const isActive = (...names) => names.includes(page) ? ' is-active' : '';
  const headerTarget = document.querySelector('[data-site-header]');

  if (headerTarget) {
    headerTarget.innerHTML = `
      <header class="site-header" data-header>
        <nav class="nav-shell" aria-label="Main navigation">
          <a class="site-brand" href="index.html" aria-label="Plutus Hotel Revenue - home">
            <img class="site-brand-logo" src="logo/logo.png" alt="Plutus Hotel Revenue">
          </a>

          <div class="desktop-nav">
            <a class="nav-link${isActive('home')}" href="index.html">Home</a>
            <a class="nav-link${isActive('about')}" href="about.html">About</a>
            <a class="nav-link${isActive('revenue')}" href="revenue_management.html">Revenue management</a>

            <div class="nav-dropdown" data-dropdown>
              <button class="nav-dropdown-toggle${isActive('software')}" type="button" aria-expanded="false">Software ${chevron}</button>
              <div class="nav-dropdown-panel">
                <a href="software.html">Software overview</a>
                <a href="mews_pms.html">Mews PMS</a>
                <a href="cloudbeds_pms.html">Cloudbeds PMS</a>
                <a href="siteminder_chm.html">SiteMinder channel manager</a>
              </div>
            </div>

            <div class="nav-dropdown" data-dropdown>
              <button class="nav-dropdown-toggle${isActive('tips', 'calculator')}" type="button" aria-expanded="false">Tips &amp; tools ${chevron}</button>
              <div class="nav-dropdown-panel">
                <a href="tips.html">Tips overview</a>
                <a href="hotel_photoshoot_tips.html">Hotel photography</a>
                <a href="web_design_tips.html">Hotel web design</a>
                <a href="digital_marketing_tips.html">Digital marketing</a>
                <a class="featured-link" href="hotel-break-even-calculator.html">Free break-even calculator</a>
              </div>
            </div>

            <a class="nav-link${isActive('blog')}" href="blog.html">Journal</a>
          </div>

          <a class="nav-cta" href="contact.html">Discuss your hotel</a>
          <button class="mobile-menu-toggle" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="mobile-navigation"><span></span></button>

          <div class="mobile-navigation" id="mobile-navigation">
            <a class="${isActive('home').trim()}" href="index.html">Home</a>
            <a class="${isActive('about').trim()}" href="about.html">About</a>
            <a class="${isActive('revenue').trim()}" href="revenue_management.html">Revenue management</a>
            <div class="mobile-accordion">
              <button class="${isActive('software').trim()}" type="button" aria-expanded="false">Software ${chevron}</button>
              <div class="mobile-accordion-panel"><div>
                <a href="software.html">Software overview</a>
                <a href="mews_pms.html">Mews PMS</a>
                <a href="cloudbeds_pms.html">Cloudbeds PMS</a>
                <a href="siteminder_chm.html">SiteMinder channel manager</a>
              </div></div>
            </div>
            <div class="mobile-accordion">
              <button class="${isActive('tips', 'calculator').trim()}" type="button" aria-expanded="false">Tips &amp; tools ${chevron}</button>
              <div class="mobile-accordion-panel"><div>
                <a href="tips.html">Tips overview</a>
                <a href="hotel_photoshoot_tips.html">Hotel photography</a>
                <a href="web_design_tips.html">Hotel web design</a>
                <a href="digital_marketing_tips.html">Digital marketing</a>
                <a href="hotel-break-even-calculator.html">Free break-even calculator</a>
              </div></div>
            </div>
            <a class="${isActive('blog').trim()}" href="blog.html">Journal</a>
            <a class="mobile-contact${isActive('contact')}" href="contact.html">Discuss your hotel</a>
          </div>
        </nav>
      </header>`;
  }

  const footerTarget = document.querySelector('[data-site-footer]');
  if (footerTarget) {
    footerTarget.innerHTML = `
      <footer class="site-footer">
        <div class="shell">
          <div class="footer-main">
            <div class="footer-brand">
              <a class="site-brand footer-site-brand" href="index.html" aria-label="Plutus Hotel Revenue - home">
                <img class="site-brand-logo" src="logo/logo.png" alt="Plutus Hotel Revenue">
              </a>
              <p>Straightforward outsourced revenue management and practical commercial guidance for independent hotels.</p>
              <div class="footer-socials">
                <a href="https://www.linkedin.com/company/plutushotelrevenue/" target="_blank" rel="noopener noreferrer" aria-label="Plutus on LinkedIn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9v9M6 6.5v.1M10 18v-5c0-2 1.2-3.2 3-3.2s3 1.2 3 3.2v5M10 10v8"/></svg></a>
                <a href="https://www.facebook.com/plutushotelrevenue/" target="_blank" rel="noopener noreferrer" aria-label="Plutus on Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3 0-5 2-5 5v3H6v4h3v5h4v-5h3l1-4h-4V9c0-.7.3-1 1-1Z"/></svg></a>
              </div>
            </div>
            <div class="footer-column"><strong>Company</strong><a href="about.html">About</a><a href="revenue_management.html">Revenue management</a><a href="blog.html">Journal</a><a href="contact.html">Contact</a></div>
            <div class="footer-column"><strong>Software</strong><a href="software.html">Overview</a><a href="mews_pms.html">Mews</a><a href="cloudbeds_pms.html">Cloudbeds</a><a href="siteminder_chm.html">SiteMinder</a></div>
            <div class="footer-column"><strong>Tips &amp; tools</strong><a href="hotel-break-even-calculator.html">Break-even calculator</a><a href="hotel_photoshoot_tips.html">Photography</a><a href="web_design_tips.html">Web design</a><a href="digital_marketing_tips.html">Digital marketing</a></div>
            <div class="footer-column"><strong>Legal</strong><a href="privacy_policy.html">Privacy notice</a><a href="terms_and_conditions.html">Terms</a></div>
          </div>
          <div class="footer-bottom"><span>© ${currentYear} Plutus Hotel Revenue. All rights reserved.</span><span>Barcelona, Spain · Built for independent hotels</span></div>
        </div>
      </footer>`;
  }

  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('.mobile-menu-toggle');
  const mobileNavigation = document.querySelector('.mobile-navigation');
  const dropdowns = Array.from(document.querySelectorAll('[data-dropdown]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const updateHeader = () => {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 18);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const closeDropdowns = (except = null) => {
    dropdowns.forEach((dropdown) => {
      if (dropdown === except) return;
      dropdown.classList.remove('is-open');
      const button = dropdown.querySelector('button');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  };

  dropdowns.forEach((dropdown) => {
    const button = dropdown.querySelector('button');
    if (!button) return;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const opening = !dropdown.classList.contains('is-open');
      closeDropdowns(dropdown);
      dropdown.classList.toggle('is-open', opening);
      button.setAttribute('aria-expanded', String(opening));
    });
  });

  document.addEventListener('click', () => closeDropdowns());

  const closeMobileMenu = (restoreFocus = false) => {
    if (!header || !menuButton) return;
    header.classList.remove('is-menu-open');
    document.body.classList.remove('nav-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    if (restoreFocus) menuButton.focus();
  };

  const openMobileMenu = () => {
    if (!header || !menuButton) return;
    header.classList.add('is-menu-open');
    document.body.classList.add('nav-open');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', 'Close navigation');
    const firstLink = mobileNavigation?.querySelector('a, button');
    window.setTimeout(() => firstLink?.focus(), 60);
  };

  menuButton?.addEventListener('click', () => {
    if (header?.classList.contains('is-menu-open')) closeMobileMenu();
    else openMobileMenu();
  });

  document.querySelectorAll('.mobile-accordion').forEach((accordion) => {
    const button = accordion.querySelector(':scope > button');
    button?.addEventListener('click', () => {
      const opening = !accordion.classList.contains('is-open');
      accordion.classList.toggle('is-open', opening);
      button.setAttribute('aria-expanded', String(opening));
    });
  });

  mobileNavigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMobileMenu()));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const openDropdown = document.querySelector('.nav-dropdown.is-open');
      if (openDropdown) {
        const button = openDropdown.querySelector('button');
        closeDropdowns();
        button?.focus();
      } else if (header?.classList.contains('is-menu-open')) {
        closeMobileMenu(true);
      }
    }

    if (event.key === 'Tab' && header?.classList.contains('is-menu-open') && mobileNavigation && menuButton) {
      const focusable = [menuButton, ...mobileNavigation.querySelectorAll('a, button:not([disabled])')].filter((item) => item.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1050) closeMobileMenu();
  });

  const heroSlides = Array.from(document.querySelectorAll('.home-hero-slide'));
  if (heroSlides.length > 1) {
    const hero = document.querySelector('.home-hero');
    const current = document.querySelector('.home-hero-current');
    const total = document.querySelector('.home-hero-total');
    const progress = document.querySelector('.home-hero-progress span');
    const previous = document.querySelector('.home-hero-prev');
    const next = document.querySelector('.home-hero-next');
    let heroIndex = Math.max(0, heroSlides.findIndex((slide) => slide.classList.contains('is-active')));
    let heroTimer = null;

    const twoDigits = (number) => String(number).padStart(2, '0');
    const showHeroSlide = (nextIndex) => {
      heroIndex = (nextIndex + heroSlides.length) % heroSlides.length;
      heroSlides.forEach((slide, index) => slide.classList.toggle('is-active', index === heroIndex));
      if (current) current.textContent = twoDigits(heroIndex + 1);
      if (total) total.textContent = twoDigits(heroSlides.length);
      if (progress) progress.style.transform = `scaleX(${(heroIndex + 1) / heroSlides.length})`;
    };

    const stopHeroTimer = () => {
      if (heroTimer) window.clearInterval(heroTimer);
      heroTimer = null;
    };

    const startHeroTimer = () => {
      stopHeroTimer();
      if (!reducedMotion && !document.hidden) {
        heroTimer = window.setInterval(() => showHeroSlide(heroIndex + 1), 6500);
      }
    };

    previous?.addEventListener('click', () => {
      showHeroSlide(heroIndex - 1);
      startHeroTimer();
    });
    next?.addEventListener('click', () => {
      showHeroSlide(heroIndex + 1);
      startHeroTimer();
    });
    hero?.addEventListener('mouseenter', stopHeroTimer);
    hero?.addEventListener('mouseleave', startHeroTimer);
    hero?.addEventListener('focusin', stopHeroTimer);
    hero?.addEventListener('focusout', startHeroTimer);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopHeroTimer();
      else startHeroTimer();
    });

    showHeroSlide(heroIndex);
    startHeroTimer();
  }

  const revealItems = document.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reducedMotion) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = (element) => {
    if (element.dataset.counted === 'true') return;
    element.dataset.counted = 'true';
    const target = Number(element.dataset.count || 0);
    const prefix = element.dataset.prefix || '';
    const suffix = element.dataset.suffix || '';
    const duration = 1100;
    const start = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(target * eased);
      element.textContent = `${prefix}${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  };

  if (counters.length) {
    if (!('IntersectionObserver' in window) || reducedMotion) counters.forEach(animateCounter);
    else {
      const counterObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.45 });
      counters.forEach((counter) => counterObserver.observe(counter));
    }
  }

  const contactForm = document.querySelector('.contact-form[data-endpoint]');
  if (contactForm) {
    const status = contactForm.querySelector('.form-status');
    const submit = contactForm.querySelector('button[type="submit"]');
    const originalButton = submit?.innerHTML || '';

    contactForm.addEventListener('submit', async (event) => {
      if (!contactForm.checkValidity()) {
        event.preventDefault();
        contactForm.reportValidity();
        return;
      }

      event.preventDefault();
      status?.classList.remove('is-success', 'is-error');
      if (status) status.textContent = 'Sending securely…';
      if (submit) {
        submit.disabled = true;
        submit.textContent = 'Sending…';
      }

      try {
        const response = await fetch(contactForm.dataset.endpoint, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' }
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || 'The form could not be sent.');
        contactForm.reset();
        if (status) {
          status.textContent = 'Thank you. Your enquiry has been sent.';
          status.classList.add('is-success');
        }
      } catch (error) {
        if (status) {
          status.textContent = 'The inline form could not complete. Opening the secure fallback…';
          status.classList.add('is-error');
        }
        window.setTimeout(() => HTMLFormElement.prototype.submit.call(contactForm), 500);
        return;
      } finally {
        if (submit) {
          submit.disabled = false;
          submit.innerHTML = originalButton || `Send enquiry ${arrow}`;
        }
      }
    });
  }
})();
