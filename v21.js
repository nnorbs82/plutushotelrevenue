(()=>{
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Revenue cockpit */
const stage=document.querySelector('[data-rev21-stage]');
if(stage){const k=stage.querySelector('[data-rev-kicker]'),v=stage.querySelector('[data-rev-value]'),t=stage.querySelector('[data-rev-title]'),bars=[...stage.querySelectorAll('.rev21-bar')];const chapters=[...document.querySelectorAll('[data-rev21-chapter]')];const apply=(c)=>{if(!c)return;const accent=c.dataset.accent||'#d9ff4a';stage.style.setProperty('--stage-accent',accent);if(k)k.textContent=c.dataset.kpi||'';if(v)v.textContent=c.dataset.value||'';if(t)t.textContent=c.dataset.stageTitle||'';const vals=(c.dataset.bars||'60,50,40').split(',');bars.forEach((b,i)=>{b.style.setProperty('--bar',`${vals[i]||50}%`);const out=b.querySelector('b');if(out)out.textContent=`${vals[i]||50}`})};const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)apply(e.target)}),{rootMargin:'-32% 0px -48% 0px',threshold:0});chapters.forEach(c=>io.observe(c));apply(chapters[0])}
/* Cloudbeds stack pointer */
if(!reduce){document.querySelectorAll('.cloud21-layer').forEach((el,i)=>{el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;el.style.transform=`translateX(0) translateY(-8px) rotateX(${-y*2.2}deg) rotateY(${x*2.5}deg) scale(1.015)`});el.addEventListener('pointerleave',()=>el.style.transform='')})}
/* Blog filters */
const filters=[...document.querySelectorAll('[data-dispatch-filter]')],rows=[...document.querySelectorAll('[data-dispatch-row]')];if(filters.length){filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(x=>x.classList.remove('active'));btn.classList.add('active');const cat=btn.dataset.dispatchFilter;rows.forEach(r=>r.classList.toggle('is-hidden',cat!=='all'&&r.dataset.category!==cat))}))}
})();