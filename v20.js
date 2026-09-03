(()=>{
'use strict';
const atelier=document.querySelector('[data-atelier]');
if(!atelier)return;
const frame=atelier.querySelector('[data-atelier-frame]');
const img=atelier.querySelector('[data-atelier-image]');
const number=atelier.querySelector('[data-atelier-number]');
const label=atelier.querySelector('[data-atelier-label]');
const items=[...atelier.querySelectorAll('[data-atelier-item]')];
let current=null;
const activate=(item)=>{
 if(!item||item===current)return;
 current=item;
 const next=item.dataset.image;
 atelier.style.setProperty('--atelier-accent',item.dataset.accent||'#d9ff4a');
 if(number)number.textContent=item.dataset.number||'';
 if(label)label.textContent=item.dataset.label||'';
 items.forEach(el=>el.classList.toggle('is-active',el===item));
 if(img&&next&&img.getAttribute('src')!==next){
  frame?.classList.add('is-changing');
  window.setTimeout(()=>{img.src=next;img.alt=item.dataset.alt||'';frame?.classList.remove('is-changing')},180);
 }
};
const io=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)activate(entry.target)}),{rootMargin:'-34% 0px -44% 0px',threshold:0});
items.forEach(item=>io.observe(item));
activate(items[0]);
})();
