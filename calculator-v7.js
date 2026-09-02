(() => {
  'use strict';
  const root = document.querySelector('[data-v7-calculator]');
  if (!root) return;

  const ids = ['currency','rooms','days','adr','variableCost','fixedCost','currentOccupancy','targetProfit','ancillaryRevenue','otaShare','otaCommission','paymentFee'];
  const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const out = {
    occupancy: document.getElementById('breakEvenOccupancy'),
    narrative: document.getElementById('breakEvenNarrative'),
    nights: document.getElementById('breakEvenNights'),
    contribution: document.getElementById('contribution'),
    profit: document.getElementById('projectedProfit'),
    target: document.getElementById('targetOccupancy'),
    meter: document.getElementById('breakEvenMeter'),
    error: document.getElementById('calcError'),
    chart: document.getElementById('breakEvenChart')
  };

  const n = (id, fallback = 0) => {
    const raw = el[id]?.value?.trim();
    if (!raw) return fallback;
    const value = Number(raw.replace(',', '.'));
    return Number.isFinite(value) ? value : NaN;
  };
  const symbol = (currency) => ({EUR:'€',GBP:'£',USD:'$',CAD:'$',AUD:'$',CHF:'CHF ',RON:'RON '}[currency] || `${currency} `);
  const money = (value) => Number.isFinite(value) ? `${symbol(el.currency.value)}${new Intl.NumberFormat(undefined,{maximumFractionDigits:2}).format(value)}` : '-';
  const number = (value, digits = 0) => Number.isFinite(value) ? new Intl.NumberFormat(undefined,{maximumFractionDigits:digits}).format(value) : '-';
  const pct = (value) => Number.isFinite(value) ? `${number(value,1)}%` : '-';
  const clamp = (v,min,max) => Math.min(max,Math.max(min,v));

  function read() {
    return {
      rooms:n('rooms',NaN), days:n('days',NaN), adr:n('adr',NaN), variableCost:n('variableCost',NaN), fixedCost:n('fixedCost',NaN),
      currentOccupancy:n('currentOccupancy',0), targetProfit:n('targetProfit',0), ancillaryRevenue:n('ancillaryRevenue',0),
      otaShare:n('otaShare',0), otaCommission:n('otaCommission',0), paymentFee:n('paymentFee',0)
    };
  }

  function validate(v) {
    const errors = [];
    if (!(v.rooms > 0)) errors.push('Enter the number of rooms.');
    if (!(v.days > 0 && v.days <= 366)) errors.push('Enter a valid number of days.');
    if (!(v.adr >= 0)) errors.push('Enter ADR.');
    if (!(v.variableCost >= 0)) errors.push('Enter variable cost per occupied room.');
    if (!(v.fixedCost >= 0)) errors.push('Enter fixed costs for the period.');
    ['currentOccupancy','otaShare','otaCommission','paymentFee'].forEach(k => { if (!(v[k] >= 0 && v[k] <= 100)) errors.push('Percentages must be between 0 and 100.'); });
    return errors;
  }

  function model(v) {
    const available = v.rooms * v.days;
    const revenuePerRoom = v.adr + v.ancillaryRevenue;
    const otaCost = v.adr * (v.otaShare/100) * (v.otaCommission/100);
    const paymentCost = revenuePerRoom * (v.paymentFee/100);
    const variable = v.variableCost + otaCost + paymentCost;
    const contribution = revenuePerRoom - variable;
    if (!(contribution > 0)) return {error:'Revenue per occupied room must be higher than variable and distribution costs.'};
    const beNights = v.fixedCost / contribution;
    const beOcc = (beNights / available) * 100;
    const currentNights = available * (v.currentOccupancy/100);
    const currentProfit = v.currentOccupancy > 0 ? (currentNights * contribution) - v.fixedCost : null;
    const targetNights = (v.fixedCost + v.targetProfit) / contribution;
    const targetOcc = v.targetProfit > 0 ? (targetNights/available)*100 : null;
    const graph = [];
    for(let occ=0;occ<=100;occ+=4){const nights=available*(occ/100);graph.push({occ,revenue:nights*revenuePerRoom,cost:v.fixedCost+nights*variable});}
    return {available,revenuePerRoom,variable,contribution,beNights,beOcc,currentProfit,targetOcc,graph};
  }

  function draw(m){
    const svg=out.chart;if(!svg)return;
    const W=620,H=300,L=58,R=18,T=18,B=36,PW=W-L-R,PH=H-T-B;
    const max=Math.max(...m.graph.flatMap(d=>[d.revenue,d.cost]),1)*1.08;
    const x=o=>L+(o/100)*PW,y=v=>T+PH-(v/max)*PH;
    const path=key=>m.graph.map((d,i)=>`${i?'L':'M'}${x(d.occ).toFixed(1)},${y(d[key]).toFixed(1)}`).join(' ');
    const grid=[0,.25,.5,.75,1].map(r=>{const yy=y(max*r);return `<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" class="v7-grid-line"/><text x="${L-8}" y="${yy+4}" text-anchor="end" class="v7-chart-text">${Math.round(max*r/1000)}k</text>`}).join('');
    const xs=[0,25,50,75,100].map(o=>`<text x="${x(o)}" y="${H-10}" text-anchor="middle" class="v7-chart-text">${o}%</text>`).join('');
    const marker=m.beOcc<=100?`<line x1="${x(m.beOcc)}" y1="${T}" x2="${x(m.beOcc)}" y2="${H-B}" class="v7-marker"/><circle cx="${x(m.beOcc)}" cy="${y(m.beNights*m.revenuePerRoom)}" r="6" fill="#d2b47a"/>`:'';
    svg.innerHTML=`${grid}${xs}<path d="${path('revenue')}" class="v7-revenue-line"/><path d="${path('cost')}" class="v7-cost-line"/>${marker}`;
  }

  function clear(){
    out.occupancy.textContent='-';out.narrative.textContent='Enter the five core numbers to calculate.';out.nights.textContent='-';out.contribution.textContent='-';out.profit.textContent='-';out.target.textContent='-';out.meter.style.width='0%';out.chart.innerHTML='';
  }

  function update(){
    const v=read();const errors=validate(v);
    if(errors.length){out.error.style.display='block';out.error.textContent=errors[0];clear();return;}
    out.error.style.display='none';
    const m=model(v);if(m.error){out.error.style.display='block';out.error.textContent=m.error;clear();return;}
    out.occupancy.textContent=pct(m.beOcc);out.nights.textContent=number(m.beNights,0);out.contribution.textContent=money(m.contribution);
    out.profit.textContent=m.currentProfit===null?'Add occupancy':money(m.currentProfit);out.target.textContent=m.targetOcc===null?'Add target':pct(m.targetOcc);
    out.meter.style.width=`${clamp(m.beOcc,0,100)}%`;
    out.narrative.textContent=m.beOcc>100?'Break-even is above available capacity with these assumptions.':`About ${number(m.beNights,0)} occupied room nights are needed in this period.`;
    draw(m);
  }

  ids.forEach(id=>{el[id]?.addEventListener('input',update);el[id]?.addEventListener('change',update);});
  clear();
})();
