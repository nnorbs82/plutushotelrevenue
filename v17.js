(()=>{
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const aboutStage=document.querySelector('[data-about-stage]');
if(aboutStage){
 const img=aboutStage.querySelector('img');
 const cap=aboutStage.querySelector('[data-about-caption]');
 const chapters=[...document.querySelectorAll('[data-about-chapter]')];
 const swap=(chapter)=>{if(!chapter||!img)return;const src=chapter.dataset.image;if(src&&img.getAttribute('src')!==src){img.style.opacity='.18';img.style.transform='scale(.985)';setTimeout(()=>{img.src=src;img.alt=chapter.dataset.alt||'';img.style.opacity='1';img.style.transform='scale(1)'},160)}if(cap)cap.textContent=chapter.dataset.caption||'';chapters.forEach((c,i)=>{const dot=document.querySelector(`[data-about-index="${i}"]`);if(dot)dot.style.color=c===chapter?'#d9ff4a':'rgba(255,255,255,.32)'})};
 const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)swap(e.target)}),{rootMargin:'-32% 0px -48% 0px',threshold:0});chapters.forEach(io.observe.bind(io));swap(chapters[0]);
}
if(!reduce){
 document.querySelectorAll('.marketing17-ring').forEach((ring,i)=>{ring.animate([{transform:'translate(-50%,-50%) rotate(0deg)'},{transform:`translate(-50%,-50%) rotate(${i%2?'-360deg':'360deg'})`}],{duration:26000+i*7000,iterations:Infinity,easing:'linear'})});
 const cells=[...document.querySelectorAll('.home17-spectrum-cell')];cells.forEach((cell,i)=>cell.style.setProperty('--delay',`${i*55}ms`));
}
})();
