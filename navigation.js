// Navigation scroll detection
document.addEventListener('DOMContentLoaded', function() {
    const navMenu = document.querySelector('.nav-menu');
    
    if (!navMenu) return;
    
    let ticking = false;
    
    function updateNavOnScroll() {
        if (window.scrollY > 40) {
            navMenu.classList.add('scrolled');
        } else {
            navMenu.classList.remove('scrolled');
        }
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateNavOnScroll);
            ticking = true;
        }
    }
    
    // Initial check
    updateNavOnScroll();
    
    // Listen to scroll events with requestAnimationFrame throttling
    window.addEventListener('scroll', requestTick);
});
