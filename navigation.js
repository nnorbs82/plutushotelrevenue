document.addEventListener('DOMContentLoaded', function() {
    const navMenu = document.querySelector('.nav-menu');

    if (!navMenu) return;

    let scrollTicking = false;
    let navigationInProgress = false;
    let softwareParallaxCleanup = null;
    let contactFormCleanup = null;
    let mobileMenuToggle = null;

    function updateNavOnScroll() {
        navMenu.classList.toggle('scrolled', window.scrollY > 40);
        scrollTicking = false;
    }

    function requestScrollTick() {
        if (scrollTicking) return;

        window.requestAnimationFrame(updateNavOnScroll);
        scrollTicking = true;
    }

    function closeDropdowns(exception) {
        navMenu.querySelectorAll('.nav-dropdown').forEach(function(dropdown) {
            if (dropdown === exception) return;

            dropdown.classList.remove('is-open');
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
    }

    function initializeDropdowns() {
        navMenu.querySelectorAll('.nav-dropdown').forEach(function(dropdown) {
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            if (!toggle) return;

            toggle.addEventListener('click', function(event) {
                event.stopPropagation();
                const willOpen = !dropdown.classList.contains('is-open');

                closeDropdowns(dropdown);
                dropdown.classList.toggle('is-open', willOpen);
                toggle.setAttribute('aria-expanded', String(willOpen));

                if (event.detail > 0) toggle.blur();
            });
        });
    }

    function closeMobileMenu() {
        navMenu.classList.remove('mobile-menu-open');
        if (mobileMenuToggle) mobileMenuToggle.setAttribute('aria-expanded', 'false');
    }

    function initializeMobileMenu() {
        const navLinks = navMenu.querySelector('.nav-links');
        if (!navLinks) return;

        mobileMenuToggle = document.createElement('button');
        mobileMenuToggle.type = 'button';
        mobileMenuToggle.className = 'nav-mobile-toggle';
        mobileMenuToggle.title = 'Menu';
        mobileMenuToggle.setAttribute('aria-label', 'Menu');
        mobileMenuToggle.setAttribute('aria-expanded', 'false');
        mobileMenuToggle.setAttribute('aria-controls', 'mobile-navigation-panel');
        mobileMenuToggle.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><rect x="2" y="5" width="28" height="5" rx="1.5"></rect><rect x="2" y="13.5" width="28" height="5" rx="1.5"></rect><rect x="2" y="22" width="28" height="5" rx="1.5"></rect></svg>';

        navLinks.id = 'mobile-navigation-panel';
        navMenu.insertBefore(mobileMenuToggle, navLinks);

        const mobileDestinations = {
            SOFTWARE: 'software.html',
            TIPS: 'tips.html'
        };

        navMenu.querySelectorAll('.nav-dropdown').forEach(function(dropdown) {
            const toggle = dropdown.querySelector('.nav-dropdown-toggle');
            if (!toggle) return;

            const label = toggle.textContent.trim().toUpperCase();
            const destination = mobileDestinations[label];
            if (!destination) return;

            const link = document.createElement('a');
            link.className = 'nav-mobile-direct-link';
            link.href = destination;
            link.textContent = label;
            dropdown.insertBefore(link, toggle);
        });

        mobileMenuToggle.addEventListener('click', function(event) {
            event.stopPropagation();
            if (!window.matchMedia('(max-width: 999px)').matches) return;
            if (navMenu.classList.contains('mobile-menu-open')) return;

            closeDropdowns();
            navMenu.classList.add('mobile-menu-open');
            mobileMenuToggle.setAttribute('aria-expanded', 'true');
        });
    }

    function initializeSoftwareParallax() {
        if (softwareParallaxCleanup) {
            softwareParallaxCleanup();
            softwareParallaxCleanup = null;
        }

        const image = document.querySelector('.software-parallax-image');
        if (!image) return;

        let ticking = false;

        function updateParallax() {
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const travel = maxScroll * 0.3;
            const offset = Math.min(window.scrollY, maxScroll) * -0.3;

            image.style.setProperty('--software-parallax-travel', `${travel}px`);
            image.style.setProperty('--software-parallax-offset', `${offset}px`);
            ticking = false;
        }

        function requestParallaxUpdate() {
            if (ticking) return;

            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }

        window.addEventListener('scroll', requestParallaxUpdate, { passive: true });
        window.addEventListener('resize', requestParallaxUpdate);
        updateParallax();

        softwareParallaxCleanup = function() {
            window.removeEventListener('scroll', requestParallaxUpdate);
            window.removeEventListener('resize', requestParallaxUpdate);
        };
    }

    function initializeContactForm() {
        if (contactFormCleanup) {
            contactFormCleanup();
            contactFormCleanup = null;
        }

        const form = document.querySelector('.contact-form');
        if (!form) return;

        const submitButton = form.querySelector('button[type="submit"]');
        const status = form.querySelector('.contact-form-status');

        function setStatus(message, state) {
            if (!status) return;

            status.textContent = message;
            if (state) {
                status.dataset.state = state;
            } else {
                delete status.dataset.state;
            }
        }

        async function handleSubmit(event) {
            event.preventDefault();

            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            if (!form.dataset.endpoint) {
                setStatus('Unable to send. Please try again.', 'error');
                return;
            }

            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());

            submitButton.disabled = true;
            submitButton.textContent = 'SENDING...';
            setStatus('', '');

            try {
                const response = await window.fetch(form.dataset.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                const result = await response.json().catch(function() {
                    return {};
                });

                if (!response.ok || result.success === false || result.success === 'false') {
                    throw new Error(result.message || 'Contact form submission failed');
                }

                form.reset();
                setStatus('Message Sent!', 'success');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : '';
                const needsActivation = /activat|confirm|unable to submit form|failed to fetch/i.test(errorMessage);

                if (needsActivation) {
                    setStatus('Check your inbox for the FormSubmit activation email, then try again.', 'error');
                } else {
                    setStatus('Unable to send. Please try again.', 'error');
                }

                console.error('Contact form submission failed:', errorMessage);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'SUBMIT';
            }
        }

        form.addEventListener('submit', handleSubmit);
        contactFormCleanup = function() {
            form.removeEventListener('submit', handleSubmit);
        };
    }

    async function ensurePageStyles(targetDocument, targetUrl) {
        const loadedStyles = new Set(
            Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(function(link) {
                return link.href;
            })
        );

        const missingStyles = Array.from(targetDocument.querySelectorAll('link[rel="stylesheet"]'))
            .map(function(link) {
                return new URL(link.getAttribute('href'), targetUrl).href;
            })
            .filter(function(href) {
                return !loadedStyles.has(href);
            });

        await Promise.all(missingStyles.map(function(href) {
            return new Promise(function(resolve) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.addEventListener('load', resolve, { once: true });
                link.addEventListener('error', resolve, { once: true });
                document.head.appendChild(link);
            });
        }));
    }

    function importPageContent(targetDocument) {
        const fragment = document.createDocumentFragment();

        Array.from(targetDocument.body.children).forEach(function(element) {
            if (element.matches('.nav-menu, script')) return;
            fragment.appendChild(document.importNode(element, true));
        });

        return fragment;
    }

    function removeCurrentPageContent() {
        Array.from(document.body.children).forEach(function(element) {
            if (element === navMenu) return;
            element.remove();
        });
    }

    async function navigateTo(targetUrl, addHistoryEntry) {
        if (navigationInProgress) return;

        navigationInProgress = true;
        document.body.setAttribute('aria-busy', 'true');
        closeDropdowns();
        closeMobileMenu();

        try {
            const response = await window.fetch(targetUrl.href, {
                headers: { 'X-Requested-With': 'site-navigation' }
            });

            if (!response.ok) throw new Error(`Navigation failed with ${response.status}`);

            const markup = await response.text();
            const targetDocument = new DOMParser().parseFromString(markup, 'text/html');

            if (!targetDocument.body || !targetDocument.querySelector('.nav-menu')) {
                throw new Error('Target page does not use the shared site layout');
            }

            await ensurePageStyles(targetDocument, targetUrl);

            if (softwareParallaxCleanup) {
                softwareParallaxCleanup();
                softwareParallaxCleanup = null;
            }

            if (contactFormCleanup) {
                contactFormCleanup();
                contactFormCleanup = null;
            }

            const pageContent = importPageContent(targetDocument);
            removeCurrentPageContent();

            document.body.className = targetDocument.body.className;
            document.body.appendChild(pageContent);
            document.title = targetDocument.title;

            if (addHistoryEntry) {
                window.history.pushState({ siteNavigation: true }, '', targetUrl.href);
            }

            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
            updateNavOnScroll();
            initializeSoftwareParallax();
            initializeContactForm();

            document.dispatchEvent(new CustomEvent('site:pagechange', {
                detail: { url: targetUrl.href }
            }));
        } catch (error) {
            window.location.assign(targetUrl.href);
            return;
        } finally {
            document.body.removeAttribute('aria-busy');
            navigationInProgress = false;
        }
    }

    function getInternalPageUrl(anchor) {
        if (!anchor || anchor.target || anchor.hasAttribute('download')) return null;

        const rawHref = anchor.getAttribute('href');
        if (!rawHref || rawHref.startsWith('#')) return null;

        const targetUrl = new URL(anchor.href, window.location.href);
        if (targetUrl.origin !== window.location.origin) return null;
        if (!targetUrl.pathname.endsWith('.html')) return null;

        return targetUrl;
    }

    document.addEventListener('click', function(event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        const anchor = event.target.closest('a[href]');
        const targetUrl = getInternalPageUrl(anchor);
        if (!targetUrl) return;

        event.preventDefault();

        if (anchor && event.detail > 0) anchor.blur();

        if (targetUrl.pathname === window.location.pathname && targetUrl.search === window.location.search) {
            closeDropdowns();
            closeMobileMenu();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        closeMobileMenu();
        navigateTo(targetUrl, true);
    });

    document.addEventListener('click', function(event) {
        if (!navMenu.contains(event.target)) {
            closeDropdowns();
            closeMobileMenu();
        }
    });

    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') return;

        const openToggle = navMenu.querySelector('.nav-dropdown.is-open .nav-dropdown-toggle');
        const mobileMenuWasOpen = navMenu.classList.contains('mobile-menu-open');
        closeDropdowns();
        closeMobileMenu();
        if (openToggle) openToggle.focus();
        if (!openToggle && mobileMenuWasOpen && mobileMenuToggle) mobileMenuToggle.focus();
    });

    window.addEventListener('popstate', function() {
        navigateTo(new URL(window.location.href), false);
    });

    window.addEventListener('scroll', requestScrollTick, { passive: true });
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 1000) closeMobileMenu();
    });
    window.history.scrollRestoration = 'manual';
    window.history.replaceState({ siteNavigation: true }, '', window.location.href);

    initializeMobileMenu();
    initializeDropdowns();
    initializeSoftwareParallax();
    initializeContactForm();
    updateNavOnScroll();
});
