(()=>{
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Mews OS deck */
const mStage=document.querySelector('.m23-deck');
if(mStage){const cards=[...mStage.querySelectorAll('.m23-card')],chapters=[...document.querySelectorAll('[data-m23-chapter]')];const setActive=(idx)=>cards.forEach((c,i)=>c.classList.toggle('is-active',i===idx));const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)setActive(Number(e.target.dataset.m23Chapter||0))}),{rootMargin:'-35% 0px -45% 0px',threshold:0});chapters.forEach(c=>io.observe(c));setActive(0)}

/* Website browser states */
const browser=document.querySelector('[data-web23-browser]');
if(browser){const screen=browser.querySelector('.web23-screen'),chapters=[...document.querySelectorAll('[data-web23-state]')];const apply=(c)=>{const state=c.dataset.web23State||'notice';screen.dataset.state=state;const title=screen.querySelector('[data-web23-title]');const kicker=screen.querySelector('[data-web23-kicker]');const minis=[...screen.querySelectorAll('.web23-mini strong')];if(kicker)kicker.textContent=c.dataset.kicker||'';if(title)title.textContent=c.dataset.screenTitle||'';(c.dataset.mini||'').split('|').forEach((x,i)=>{if(minis[i])minis[i].textContent=x})};const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)apply(e.target)}),{rootMargin:'-32% 0px -48% 0px',threshold:0});chapters.forEach(c=>io.observe(c));apply(chapters[0])}

/* Marketing machine */
const machine=document.querySelector('[data-mark23-machine]');
if(machine){const nodes=[...machine.querySelectorAll('.mark23-node')],chapters=[...document.querySelectorAll('[data-mark23-step]')];const apply=(c)=>{const i=Number(c.dataset.mark23Step||0);machine.style.setProperty('--flow',`${20+i*25}%`);nodes.forEach((n,x)=>n.classList.toggle('is-active',x<=i));const out=machine.querySelector('[data-mark23-value]');if(out)out.textContent=c.dataset.value||'NET VALUE'};const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)apply(e.target)}),{rootMargin:'-32% 0px -48% 0px',threshold:0});chapters.forEach(c=>io.observe(c));apply(chapters[0])}

/* Blog article journey */
const journey=document.querySelector('[data-blog23-journey]');
if(journey){const img=journey.querySelector('[data-blog23-image]'),title=journey.querySelector('[data-blog23-title]'),meta=journey.querySelector('[data-blog23-meta]'),desc=journey.querySelector('[data-blog23-desc]'),link=journey.querySelector('[data-blog23-link]'),rail=[...journey.querySelectorAll('[data-blog23-rail]')],thumbs=[...journey.querySelectorAll('[data-blog23-thumb]')];const articles=[...journey.querySelectorAll('[data-blog23-step]')];const apply=(i)=>{const a=articles[i];if(!a)return;const visual=journey.querySelector('.blog23-visual');if(visual)visual.classList.add('is-changing');setTimeout(()=>{if(img){img.src=a.dataset.image;img.alt=a.dataset.alt||''}if(title)title.textContent=a.dataset.title||'';if(meta)meta.textContent=a.dataset.meta||'';if(desc)desc.textContent=a.dataset.desc||'';if(link)link.href=a.dataset.href||'#';rail.forEach((b,x)=>b.classList.toggle('active',x===i));thumbs.forEach((b,x)=>b.classList.toggle('active',x===i));if(visual)visual.classList.remove('is-changing')},150)};rail.forEach((b,i)=>b.addEventListener('click',()=>apply(i)));thumbs.forEach((b,i)=>b.addEventListener('click',()=>apply(i)));const onScroll=()=>{const r=journey.getBoundingClientRect(),max=journey.offsetHeight-innerHeight,p=Math.max(0,Math.min(1,-r.top/Math.max(1,max))),i=Math.min(articles.length-1,Math.floor(p*articles.length));apply(i)};let last=-1;const paint=()=>{const r=journey.getBoundingClientRect(),max=journey.offsetHeight-innerHeight,p=Math.max(0,Math.min(1,-r.top/Math.max(1,max))),i=Math.min(articles.length-1,Math.floor(p*articles.length));if(i!==last){last=i;apply(i)}};addEventListener('scroll',paint,{passive:true});paint()}

/* Blog archive filters */
const filters=[...document.querySelectorAll('[data-blog23-filter]')],rows=[...document.querySelectorAll('[data-blog23-row]')];if(filters.length){filters.forEach(btn=>btn.addEventListener('click',()=>{filters.forEach(x=>x.classList.remove('active'));btn.classList.add('active');const cat=btn.dataset.blog23Filter;rows.forEach(r=>r.classList.toggle('is-hidden',cat!=='all'&&r.dataset.category!==cat))}))}

/* Cloudbeds pointer depth */
if(!reduce){document.querySelectorAll('.c23-hero-card').forEach((card,i)=>{card.animate([{translate:'0 0'},{translate:`${i%2?8:-7}px ${i%2?-10:9}px`} ,{translate:'0 0'}],{duration:6500+i*700,iterations:Infinity,easing:'ease-in-out'})})}
})();
