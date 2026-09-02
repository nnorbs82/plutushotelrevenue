(function (global) {
  'use strict';

  const CORE_FIELDS = ['rooms', 'days', 'adr', 'variableCost', 'fixedCost'];
  const OPTIONAL_FIELDS = ['currentOccupancy', 'targetProfit', 'ancillaryRevenue', 'otaShare', 'otaCommission', 'paymentFee'];
  const ALL_FIELDS = [...CORE_FIELDS, ...OPTIONAL_FIELDS];

  const rawNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (value === null || value === undefined) return NaN;
    const text = String(value).trim().replace(/\s/g, '').replace(',', '.');
    return text === '' ? NaN : Number(text);
  };

  const optionalNumber = (value) => {
    const parsed = rawNumber(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function normaliseValues(input) {
    return {
      currency: String(input.currency || 'EUR').toUpperCase(),
      rooms: rawNumber(input.rooms),
      days: rawNumber(input.days),
      adr: rawNumber(input.adr),
      variableCost: rawNumber(input.variableCost),
      fixedCost: rawNumber(input.fixedCost),
      currentOccupancy: optionalNumber(input.currentOccupancy),
      targetProfit: optionalNumber(input.targetProfit),
      ancillaryRevenue: optionalNumber(input.ancillaryRevenue),
      otaShare: optionalNumber(input.otaShare),
      otaCommission: optionalNumber(input.otaCommission),
      paymentFee: optionalNumber(input.paymentFee),
      revenueFee: optionalNumber(input.revenueFee),
      outOfOrder: optionalNumber(input.outOfOrder)
    };
  }

  function validateValues(input) {
    const values = normaliseValues(input);
    const errors = [];
    const add = (field, message) => errors.push({ field, message });

    if (!Number.isFinite(values.rooms) || values.rooms <= 0) add('rooms', 'Enter the number of rooms.');
    if (!Number.isFinite(values.days) || values.days <= 0 || values.days > 366) add('days', 'Enter a period between 1 and 366 days.');
    if (!Number.isFinite(values.adr) || values.adr <= 0) add('adr', 'Enter an ADR above zero.');
    if (!Number.isFinite(values.variableCost) || values.variableCost < 0) add('variableCost', 'Enter the variable cost per occupied room.');
    if (!Number.isFinite(values.fixedCost) || values.fixedCost < 0) add('fixedCost', 'Enter the fixed costs for the period.');

    OPTIONAL_FIELDS.forEach((field) => {
      if (values[field] < 0) add(field, 'Optional values cannot be negative.');
    });
    ['currentOccupancy', 'otaShare', 'otaCommission', 'paymentFee'].forEach((field) => {
      if (values[field] > 100) add(field, 'Percentages must be between 0 and 100.');
    });

    return { values, errors };
  }

  function calculateModel(input) {
    const checked = validateValues(input);
    const values = checked.values;
    if (checked.errors.length) return { valid: false, errors: checked.errors, values };

    const availableRooms = values.rooms - values.outOfOrder;
    if (availableRooms <= 0) return { valid: false, errors: [{ field: 'rooms', message: 'Available rooms must be above zero.' }], values };

    const availableRoomNights = availableRooms * values.days;
    const occupancy = values.currentOccupancy / 100;
    const otaShare = values.otaShare / 100;
    const otaCommission = values.otaCommission / 100;
    const paymentRate = values.paymentFee / 100;

    const revenuePerOccupiedRoom = values.adr + values.ancillaryRevenue;
    const weightedOtaCost = values.adr * otaShare * otaCommission;
    const paymentFees = revenuePerOccupiedRoom * paymentRate;
    const variableCostPerOccupiedRoom = values.variableCost + weightedOtaCost + paymentFees;
    const contributionPerOccupiedRoom = revenuePerOccupiedRoom - variableCostPerOccupiedRoom;

    if (contributionPerOccupiedRoom <= 0) {
      return { valid: false, errors: [{ field: 'adr', message: 'Revenue per occupied room must be higher than variable and distribution costs.' }], values };
    }

    const fixedCost = values.fixedCost;
    const breakEvenNights = fixedCost / contributionPerOccupiedRoom;
    const breakEvenOccupancy = (breakEvenNights / availableRoomNights) * 100;
    const roomsPerDay = breakEvenNights / values.days;
    const breakEvenRevenue = breakEvenNights * revenuePerOccupiedRoom;
    const roomRevparAtBreakEven = values.adr * (breakEvenOccupancy / 100);

    const targetNights = (fixedCost + values.targetProfit) / contributionPerOccupiedRoom;
    const targetOccupancy = (targetNights / availableRoomNights) * 100;

    const currentOccupiedNights = availableRoomNights * occupancy;
    const currentRevenue = currentOccupiedNights * revenuePerOccupiedRoom;
    const currentVariableCost = currentOccupiedNights * variableCostPerOccupiedRoom;
    const currentTotalCost = fixedCost + currentVariableCost;
    const currentProfit = currentRevenue - currentTotalCost;
    const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : null;

    const adrCoefficient = 1 - paymentRate - (otaShare * otaCommission);
    let requiredAdr = null;
    if (currentOccupiedNights > 0 && adrCoefficient > 0) {
      const requiredContribution = (fixedCost + values.targetProfit) / currentOccupiedNights;
      requiredAdr = (requiredContribution + values.variableCost - (values.ancillaryRevenue * (1 - paymentRate))) / adrCoefficient;
      requiredAdr = Math.max(0, requiredAdr);
    }

    const fullOccupancyRevenue = availableRoomNights * revenuePerOccupiedRoom;
    const fullOccupancyTotalCost = fixedCost + availableRoomNights * variableCostPerOccupiedRoom;

    const graph = [];
    for (let percent = 0; percent <= 100; percent += 2) {
      const nights = availableRoomNights * percent / 100;
      graph.push({ occupancy: percent, revenue: nights * revenuePerOccupiedRoom, totalCost: fixedCost + nights * variableCostPerOccupiedRoom });
    }

    return {
      valid: true, errors: [], values, availableRooms, availableRoomNights,
      revenuePerOccupiedRoom, weightedOtaCost, paymentAndRevenueFees: paymentFees,
      variableCostPerOccupiedRoom, contributionPerOccupiedRoom, fixedCost,
      breakEvenNights, breakEvenOccupancy, roomsPerDay, breakEvenRevenue,
      roomRevparAtBreakEven, targetNights, targetOccupancy, currentOccupiedNights,
      currentRevenue, currentVariableCost, currentTotalCost, currentProfit, currentMargin,
      requiredAdr, fullOccupancyRevenue, fullOccupancyTotalCost, graph
    };
  }

  const api = { calculateModel, validateValues, normaliseValues };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.PlutusBreakEven = api;
  if (typeof document === 'undefined') return;

  const ready = (callback) => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', callback, { once: true })
    : callback();

  ready(() => {
    const root = document.querySelector('[data-v5-calculator]');
    const form = document.getElementById('breakEvenForm');
    if (!root || !form) return;

    const fields = {};
    ALL_FIELDS.forEach((name) => { fields[name] = document.getElementById(name); });
    fields.currency = document.getElementById('currency');

    const results = {};
    document.querySelectorAll('[data-result]').forEach((el) => { results[el.dataset.result] = el; });
    const meter = document.querySelector('[data-break-even-meter]');
    const errorBox = document.querySelector('[data-calculator-error]');
    const chart = document.getElementById('breakEvenChart');
    const resetButton = document.querySelector('[data-reset-calculator]');

    const symbol = (currency) => ({ EUR:'€', GBP:'£', USD:'$', CAD:'$', AUD:'$', CHF:'CHF', RON:'RON' }[currency] || currency);
    const formatNumber = (value, decimals=0) => Number.isFinite(value) ? new Intl.NumberFormat(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value) : '-';
    const formatPercent = (value) => Number.isFinite(value) ? `${formatNumber(value,1)}%` : '-';
    const formatMoney = (value,currency,decimals=0) => {
      if (!Number.isFinite(value)) return '-';
      try { return new Intl.NumberFormat(undefined,{style:'currency',currency,minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(value); }
      catch (_) { return `${symbol(currency)} ${formatNumber(value,decimals)}`; }
    };

    const read = () => {
      const values = { currency: fields.currency?.value || 'EUR' };
      ALL_FIELDS.forEach((name) => { values[name] = fields[name]?.value ?? ''; });
      return values;
    };
    const coreIsEmpty = () => CORE_FIELDS.every((name) => !String(fields[name]?.value || '').trim());
    const set = (name,value) => { if (results[name]) results[name].textContent = value; };
    const updateSymbols = (currency) => document.querySelectorAll('[data-currency-symbol]').forEach((el) => { el.textContent = symbol(currency); });

    const clearErrors = () => {
      Object.values(fields).forEach((field) => field?.removeAttribute('aria-invalid'));
      if (errorBox) { errorBox.hidden = true; errorBox.textContent = ''; }
    };
    const showErrors = (errors) => {
      clearErrors();
      errors.forEach((error) => fields[error.field]?.setAttribute('aria-invalid','true'));
      if (errorBox) { errorBox.hidden = false; errorBox.textContent = [...new Set(errors.map((e)=>e.message))].slice(0,3).join(' '); }
    };

    const renderPrompt = () => {
      clearErrors();
      set('breakEvenOccupancy','-'); set('breakEvenNarrative','Enter the five core figures to calculate.');
      ['breakEvenNights','roomsPerDay','contributionPerRoom','currentProfit','currentMargin','targetOccupancy','targetNarrative','requiredAdr','breakEvenRevenue','breakEvenRevpar'].forEach((name)=>set(name,'-'));
      if (meter) meter.style.width='0%';
      if (chart) chart.innerHTML='<title>Hotel revenue and total cost by occupancy</title><text x="340" y="145" text-anchor="middle" class="simple-chart-text">Your chart will appear here</text>';
    };

    const niceMax = (value) => {
      if (!Number.isFinite(value) || value <= 0) return 1;
      const exp = Math.floor(Math.log10(value)); const fraction = value / Math.pow(10,exp);
      const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
      return nice * Math.pow(10,exp);
    };

    const drawChart = (model) => {
      if (!chart) return;
      const width=680,height=300,margin={top:22,right:18,bottom:38,left:62};
      const pw=width-margin.left-margin.right,ph=height-margin.top-margin.bottom;
      const ymax=niceMax(Math.max(model.fullOccupancyRevenue,model.fullOccupancyTotalCost,model.fixedCost)*1.08);
      const x=(p)=>margin.left+clamp(p,0,100)/100*pw;
      const y=(a)=>margin.top+ph-clamp(a,0,ymax)/ymax*ph;
      const path=(key)=>model.graph.map((p,i)=>`${i?'L':'M'}${x(p.occupancy).toFixed(1)},${y(p[key]).toFixed(1)}`).join(' ');
      const grid=[0,.25,.5,.75,1].map((r)=>{const amount=ymax*r,yy=y(amount);return `<line x1="${margin.left}" y1="${yy}" x2="${width-margin.right}" y2="${yy}" class="simple-chart-grid"/><text x="${margin.left-9}" y="${yy+4}" text-anchor="end" class="simple-chart-text">${Math.round(amount/1000)}k</text>`}).join('');
      const labels=[0,25,50,75,100].map((p)=>`<text x="${x(p)}" y="${height-10}" text-anchor="middle" class="simple-chart-text">${p}%</text>`).join('');
      const bx=x(model.breakEvenOccupancy),by=y(model.breakEvenRevenue);
      const marker=model.breakEvenOccupancy<=100?`<line x1="${bx}" y1="${margin.top}" x2="${bx}" y2="${height-margin.bottom}" class="simple-chart-marker"/><circle cx="${bx}" cy="${by}" r="6" class="simple-chart-point"/><text x="${Math.min(width-150,bx+9)}" y="${Math.max(margin.top+14,by-10)}" class="simple-chart-text">Break-even ${formatPercent(model.breakEvenOccupancy)}</text>`:'';
      chart.innerHTML=`<title>Hotel revenue and total cost by occupancy</title>${grid}${labels}<path d="${path('revenue')}" class="simple-chart-revenue"/><path d="${path('totalCost')}" class="simple-chart-cost"/>${marker}`;
    };

    const render = () => {
      const values=read(); updateSymbols(values.currency);
      if (coreIsEmpty()) { renderPrompt(); return; }
      const model=calculateModel(values);
      if (!model.valid) { showErrors(model.errors); renderPrompt(); showErrors(model.errors); return; }
      clearErrors(); const c=model.values.currency;
      set('breakEvenOccupancy',formatPercent(model.breakEvenOccupancy));
      set('breakEvenNarrative',model.breakEvenOccupancy>100?'Break-even is above available capacity with these assumptions.':`About ${formatNumber(model.breakEvenNights,0)} occupied room nights are needed in this period.`);
      set('breakEvenNights',formatNumber(model.breakEvenNights,0));
      set('roomsPerDay',`${formatNumber(model.roomsPerDay,1)} occupied rooms per day`);
      set('contributionPerRoom',formatMoney(model.contributionPerOccupiedRoom,c,2));
      set('breakEvenRevenue',formatMoney(model.breakEvenRevenue,c,0));
      set('breakEvenRevpar',`${formatMoney(model.roomRevparAtBreakEven,c,2)} room RevPAR at break-even`);
      if (model.values.currentOccupancy>0) {
        set('currentProfit',formatMoney(model.currentProfit,c,0));
        set('currentMargin',model.currentMargin===null?'-':`${formatPercent(model.currentMargin)} margin`);
        set('requiredAdr',model.requiredAdr===null?'-':formatMoney(model.requiredAdr,c,2));
      } else { set('currentProfit','Optional'); set('currentMargin','Enter current occupancy'); set('requiredAdr','Optional'); }
      if (model.values.targetProfit>0) { set('targetOccupancy',formatPercent(model.targetOccupancy)); set('targetNarrative',`${formatMoney(model.values.targetProfit,c,0)} target profit included`); }
      else { set('targetOccupancy','Optional'); set('targetNarrative','Enter a target profit if useful'); }
      if (meter) meter.style.width=`${clamp(model.breakEvenOccupancy,0,100)}%`;
      drawChart(model);
    };

    form.addEventListener('input',render); form.addEventListener('change',render);
    resetButton?.addEventListener('click',()=>{ ALL_FIELDS.forEach((name)=>{ if(fields[name]) fields[name].value=''; }); if(fields.currency) fields.currency.value='EUR'; render(); });
    render();
  });
})(typeof window !== 'undefined' ? window : globalThis);
