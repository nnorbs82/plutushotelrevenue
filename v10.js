(()=>{
'use strict';
const header=document.querySelector('[data-v10-header]');
const footer=document.querySelector('[data-v10-footer]');
if(header){
 header.innerHTML=`<header class="v10-header"><div class="v10-nav">
  <a class="v10-brand" href="index.html"><img src="logo/logo.png" alt="Plutus Hotel Revenue"><div><strong>PLUTUS</strong><span>HOTEL REVENUE</span></div></a>
  <nav class="v10-links" aria-label="Main navigation"><a href="index.html">Home</a><a href="about.html">About</a><a href="revenue_management.html">Revenue</a><div class="v10-group"><button type="button">Software</button><div class="v10-drop"><a href="software.html">Software overview</a><a href="mews_pms.html">Mews</a><a href="cloudbeds_pms.html">Cloudbeds</a><a href="siteminder_chm.html">SiteMinder</a></div></div><div class="v10-group"><button type="button">Tips</button><div class="v10-drop"><a href="tips.html">All tips & tools</a><a href="hotel_photoshoot_tips.html">Hotel photography</a><a href="web_design_tips.html">Hotel website</a><a href="digital_marketing_tips.html">Digital marketing</a><a href="hotel-break-even-calculator.html">Break-even calculator</a></div></div><a href="blog.html">Blog</a></nav>
  <a class="v10-talk" href="contact.html">Discuss your hotel</a><button class="v10-mobile" type="button" aria-expanded="false">MENU</button>
 </div></header><nav class="v10-mobile-panel" aria-label="Mobile navigation"><a href="index.html">Home</a><a href="about.html">About</a><a href="revenue_management.html">Revenue</a><a href="software.html">Software</a><div class="v10-mobile-sub"><a href="mews_pms.html">Mews</a><a href="cloudbeds_pms.html">Cloudbeds</a><a href="siteminder_chm.html">SiteMinder</a></div><a href="tips.html">Tips</a><div class="v10-mobile-sub"><a href="hotel_photoshoot_tips.html">Hotel photography</a><a href="web_design_tips.html">Hotel website</a><a href="digital_marketing_tips.html">Digital marketing</a><a href="hotel-break-even-calculator.html">Break-even calculator</a></div><a href="blog.html">Blog</a><a href="contact.html">Contact</a></nav>`;
 const m=header.querySelector('.v10-mobile');
 m?.addEventListener('click',()=>{document.body.classList.toggle('nav-open');m.setAttribute('aria-expanded',String(document.body.classList.contains('nav-open')))});
 header.querySelectorAll('.v10-group>button').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();const g=b.parentElement;header.querySelectorAll('.v10-group').forEach(x=>x!==g&&x.classList.remove('open'));g.classList.toggle('open')}));
 document.addEventListener('click',e=>{if(!e.target.closest('.v10-group'))header.querySelectorAll('.v10-group').forEach(x=>x.classList.remove('open'))});
}
if(footer){footer.innerHTML=`<footer class="v10-footer"><div class="footer-grid"><div class="footer-brand"><img src="logo/logo.png" alt="Plutus Hotel Revenue"><p>Independent hotel revenue management by Norbert Nica - pricing, forecasting, distribution and commercial strategy.</p></div><div class="footer-col"><b>PLUTUS</b><a href="about.html">About</a><a href="revenue_management.html">Revenue Management</a><a href="contact.html">Contact</a></div><div class="footer-col"><b>RESOURCES</b><a href="software.html">Software</a><a href="tips.html">Tips</a><a href="hotel-break-even-calculator.html">Break-even Calculator</a><a href="blog.html">Blog</a></div><div class="footer-col"><b>LEGAL</b><a href="privacy_policy.html">Privacy</a><a href="terms_and_conditions.html">Terms</a></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} Plutus Hotel Revenue</span><span>Barcelona · Independent consultancy</span></div></footer>`}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.1});
document.querySelectorAll('[data-reveal]').forEach(el=>{el.classList.add('reveal');io.observe(el)});
const hero=document.querySelector('.home-hero');
const sculpture=document.querySelector('.signal-sculpture');
if(hero&&sculpture&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
 hero.addEventListener('pointermove',e=>{
  const hr=hero.getBoundingClientRect();hero.style.setProperty('--mx',`${((e.clientX-hr.left)/hr.width)*100}%`);hero.style.setProperty('--my',`${((e.clientY-hr.top)/hr.height)*100}%`);
  const r=sculpture.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
  sculpture.style.transform=`rotateY(${x*2.2}deg) rotateX(${-y*1.7}deg)`;
  sculpture.querySelectorAll('.signal-plane').forEach((p,i)=>{p.style.translate=`${x*(i+1)*14}px ${y*(i+1)*10}px`});
  sculpture.querySelectorAll('.signal-float').forEach((p,i)=>{p.style.translate=`${x*(i?18:-16)}px ${y*(i?12:-10)}px`});
 });
 hero.addEventListener('pointerleave',()=>{sculpture.style.transform='';sculpture.querySelectorAll('.signal-plane,.signal-float').forEach(p=>p.style.translate='0 0')});
}
})();
