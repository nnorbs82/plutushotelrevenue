// Navigation scroll detection
document.addEventListener('DOMContentLoaded', function() {
    const navMenu = document.querySelector('.nav-menu');
    
    if (!navMenu) return;
    
    function updateNavOnScroll() {
        if (window.scrollY > 40) {
            navMenu.classList.add('scrolled');
        } else {
            navMenu.classList.remove('scrolled');
        }
    }
    
    // Initial check
    updateNavOnScroll();
    
    // Listen to scroll events
    window.addEventListener('scroll', updateNavOnScroll);
});
