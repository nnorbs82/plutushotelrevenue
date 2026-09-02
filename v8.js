
(() => {
  'use strict';
  const page=document.body.dataset.page||'';
  const active=(p)=>page===p?' is-active':'';
  const header=document.querySelector('[data-v8-header]');
  if(header){
    header.innerHTML=`<header class="site-header" data-header><nav class="nav-shell" aria-label="Main navigation">
      <a class="site-brand" href="index.html"><img src="logo/logo.png" alt="Plutus Hotel Revenue"><span class="brand-word">PLUTUS<small>Hotel Revenue</small></span></a>
      <div class="desktop-nav">
        <a class="nav-link${active('home')}" href="index.html">Home</a>
        <a class="nav-link${active('about')}" href="about.html">About</a>
        <a class="nav-link${active('revenue')}" href="revenue_management.html">Revenue</a>
        <div class="nav-dropdown" data-drop><button class="${['software','mews','cloudbeds','siteminder'].includes(page)?'is-active':''}" type="button">Software</button><div class="nav-dropdown-panel"><a href="software.html">Software lab</a><a href="mews_pms.html">Mews</a><a href="cloudbeds_pms.html">Cloudbeds</a><a href="siteminder_chm.html">SiteMinder</a></div></div>
        <div class="nav-dropdown" data-drop><button class="${['tips','photo','web','marketing','calculator'].includes(page)?'is-active':''}" type="button">Ideas</button><div class="nav-dropdown-panel"><a href="tips.html">Tips & tools</a><a href="hotel_photoshoot_tips.html">Photography</a><a href="web_design_tips.html">Web design</a><a href="digital_marketing_tips.html">Marketing</a><a class="featured" href="hotel-break-even-calculator.html">Break-even calculator</a></div></div>
        <a class="nav-link${active('blog')}" href="blog.html">Journal</a>
      </div>
      <a class="nav-cta" href="contact.html">Start a conversation</a>
      <button class="mobile-toggle" type="button" aria-label="Open menu" aria-expanded="false"><span></span></button>
      <div class="mobile-nav"><a href="index.html">Home</a><a href="about.html">About</a><a href="revenue_management.html">Revenue</a><a href="software.html">Software</a><div class="mobile-group"><a href="mews_pms.html">Mews</a><a href="cloudbeds_pms.html">Cloudbeds</a><a href="siteminder_chm.html">SiteMinder</a></div><a href="tips.html">Ideas</a><div class="mobile-group"><a href="hotel_photoshoot_tips.html">Photography</a><a href="web_design_tips.html">Web design</a><a href="digital_marketing_tips.html">Marketing</a><a href="hotel-break-even-calculator.html">Break-even calculator</a></div><a href="blog.html">Journal</a><a href="contact.html">Contact</a></div>
    </nav></header>`;
  }
  const footer=document.querySelector('[data-v8-footer]');
  if(footer){footer.innerHTML=`<footer class="site-footer"><div class="shell"><div class="footer-top"><div class="footer-brand"><img src="logo/logo.png" alt="Plutus Hotel Revenue"><p>Independent hotel revenue management and commercial thinking by Norbert Nica.</p></div><div class="footer-col"><strong>Plutus</strong><a href="about.html">About</a><a href="revenue_management.html">Revenue</a><a href="contact.html">Contact</a></div><div class="footer-col"><strong>Software</strong><a href="software.html">Software lab</a><a href="mews_pms.html">Mews</a><a href="cloudbeds_pms.html">Cloudbeds</a><a href="siteminder_chm.html">SiteMinder</a></div><div class="footer-col"><strong>Ideas</strong><a href="tips.html">Tips & tools</a><a href="hotel-break-even-calculator.html">Calculator</a><a href="blog.html">Journal</a></div><div class="footer-col"><strong>Legal</strong><a href="privacy_policy.html">Privacy</a><a href="terms_and_conditions.html">Terms</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Plutus Hotel Revenue</span><span>Barcelona · Independent consultancy</span></div></div></footer>`}
  document.querySelectorAll('[data-drop]').forEach(d=>{const b=d.querySelector('button');b.addEventListener('click',e=>{e.stopPropagation();document.querySelectorAll('[data-drop]').forEach(x=>x!==d&&x.classList.remove('is-open'));d.classList.toggle('is-open')})});
  document.addEventListener('click',()=>document.querySelectorAll('[data-drop]').forEach(x=>x.classList.remove('is-open')));
  const h=document.querySelector('[data-header]'),mb=document.querySelector('.mobile-toggle');mb?.addEventListener('click',()=>{const open=h.classList.toggle('is-menu-open');document.body.classList.toggle('nav-open',open);mb.setAttribute('aria-expanded',String(open))});
  document.querySelectorAll('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>{h?.classList.remove('is-menu-open');document.body.classList.remove('nav-open')}));
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('[data-reveal]').forEach(el=>{el.classList.add('reveal');io.observe(el)});
  const sculpture=document.querySelector('.signal-sculpture');if(sculpture&&!matchMedia('(prefers-reduced-motion: reduce)').matches){sculpture.addEventListener('pointermove',e=>{const r=sculpture.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;sculpture.querySelectorAll('.signal-plane').forEach((p,i)=>p.style.translate=`${x*(i+1)*10}px ${y*(i+1)*8}px`)})}
})();
