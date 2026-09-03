
(() => {
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  const groups = [...document.querySelectorAll('.nav-group')];

  const closeGroups = (except = null) => {
    groups.forEach(group => {
      if (group === except) return;
      group.classList.remove('open');
      const button = group.querySelector('.nav-group-toggle');
      if (button) button.setAttribute('aria-expanded', 'false');
    });
  };

  const closeMenu = () => {
    if (!header || !toggle) return;
    header.classList.remove('menu-visible');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    closeGroups();
  };

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 14);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  if (toggle && header) {
    toggle.addEventListener('click', () => {
      const open = !header.classList.contains('menu-visible');
      header.classList.toggle('menu-visible', open);
      document.body.classList.toggle('nav-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (!open) closeGroups();
    });
  }

  groups.forEach(group => {
    const button = group.querySelector('.nav-group-toggle');
    if (!button) return;

    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = !group.classList.contains('open');
      closeGroups(group);
      group.classList.toggle('open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
    });

    group.addEventListener('mouseenter', () => {
      if (window.matchMedia('(min-width: 861px)').matches) {
        closeGroups(group);
        group.classList.add('open');
        button.setAttribute('aria-expanded', 'true');
      }
    });

    group.addEventListener('mouseleave', () => {
      if (window.matchMedia('(min-width: 861px)').matches) {
        group.classList.remove('open');
        button.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.nav-group')) closeGroups();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  if (nav) {
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.site-nav a[href]').forEach(link => {
    const target = link.getAttribute('href').split('#')[0].toLowerCase();
    if (target === path) link.setAttribute('aria-current', 'page');
  });

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll('.faq-item button').forEach(button => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq-item');
      const open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      const icon = button.querySelector('[data-faq-icon]');
      if (icon) icon.textContent = open ? '−' : '+';
    });
  });

  const contactForm = document.querySelector('.contact-form[data-endpoint]');
  if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = contactForm.querySelector('.form-status');
      const submit = contactForm.querySelector('[type="submit"]');
      if (status) status.textContent = 'Sending your message...';
      if (submit) submit.disabled = true;

      try {
        const response = await fetch(contactForm.dataset.endpoint, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error('Request failed');
        contactForm.reset();
        if (status) status.textContent = 'Thank you - your message has been sent.';
      } catch (error) {
        if (status) status.textContent = 'The form could not be sent. Please try again or contact Plutus via LinkedIn.';
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }
})();
