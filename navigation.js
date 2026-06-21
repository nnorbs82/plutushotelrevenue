document.addEventListener('DOMContentLoaded', function() {
    const navMenu = document.querySelector('.nav-menu');

    if (!navMenu) return;

    let scrollTicking = false;
    let navigationInProgress = false;
    let softwareParallaxCleanup = null;

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
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        navigateTo(targetUrl, true);
    });

    document.addEventListener('click', function(event) {
        if (!navMenu.contains(event.target)) closeDropdowns();
    });

    document.addEventListener('keydown', function(event) {
        if (event.key !== 'Escape') return;

        const openToggle = navMenu.querySelector('.nav-dropdown.is-open .nav-dropdown-toggle');
        closeDropdowns();
        if (openToggle) openToggle.focus();
    });

    window.addEventListener('popstate', function() {
        navigateTo(new URL(window.location.href), false);
    });

    window.addEventListener('scroll', requestScrollTick, { passive: true });
    window.history.scrollRestoration = 'manual';
    window.history.replaceState({ siteNavigation: true }, '', window.location.href);

    initializeDropdowns();
    initializeSoftwareParallax();
    updateNavOnScroll();
});
