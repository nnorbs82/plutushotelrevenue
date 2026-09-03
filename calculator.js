
(() => {
  const form = document.querySelector('[data-break-even-form]');
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const fields = [...form.querySelectorAll('input, select')];
  const currencyField = $('currency');
  const chart = $('breakEvenChart');
  const ctx = chart ? chart.getContext('2d') : null;
  const storageKey = 'plutus-hotel-break-even-v1';

  const defaults = {
    currency: 'EUR',
    rooms: 66,
    days: 30,
    targetOccupancy: 70,
    adr: 135,
    otherRevenue: 8,
    payroll: 42000,
    rent: 12000,
    fixedUtilities: 6500,
    software: 1800,
    insuranceTaxes: 2400,
    marketing: 2000,
    maintenance: 2500,
    admin: 1800,
    otherFixed: 2000,
    housekeeping: 8,
    laundry: 3.5,
    amenities: 1.5,
    variableUtilities: 3.7,
    breakfast: 0,
    otherVariable: 1.3,
    commission: 10
  };

  const symbols = { EUR: '€', GBP: '£', USD: '$' };

  const num = (id) => {
    const value = parseFloat($(id)?.value);
    return Number.isFinite(value) ? value : 0;
  };

  const money = (value, digits = 0) => {
    const currency = currencyField?.value || 'EUR';
    const safe = Number.isFinite(value) ? value : 0;
    try {
      return new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        maximumFractionDigits: digits,
        minimumFractionDigits: digits
      }).format(safe);
    } catch {
      return `${symbols[currency] || '€'}${safe.toFixed(digits)}`;
    }
  };

  const pct = (value, digits = 1) => {
    if (!Number.isFinite(value)) return '—';
    return `${value.toFixed(digits)}%`;
  };

  const integer = (value) => new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(Math.max(0, value || 0));

  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

  function calculate(occupancyOverride = null) {
    const rooms = Math.max(0, num('rooms'));
    const days = Math.max(1, num('days'));
    const occupancy = occupancyOverride === null
      ? Math.min(100, Math.max(0, num('targetOccupancy'))) / 100
      : Math.min(1, Math.max(0, occupancyOverride));
    const adr = Math.max(0, num('adr'));
    const otherRevenue = Math.max(0, num('otherRevenue'));
    const commissionRate = Math.min(0.99, Math.max(0, num('commission') / 100));

    const fixed = [
      'payroll', 'rent', 'fixedUtilities', 'software', 'insuranceTaxes',
      'marketing', 'maintenance', 'admin', 'otherFixed'
    ].reduce((sum, id) => sum + Math.max(0, num(id)), 0);

    const variableAbsolute = [
      'housekeeping', 'laundry', 'amenities', 'variableUtilities', 'breakfast', 'otherVariable'
    ].reduce((sum, id) => sum + Math.max(0, num(id)), 0);

    const available = rooms * days;
    const occupied = available * occupancy;
    const roomRevenue = occupied * adr;
    const ancillaryRevenue = occupied * otherRevenue;
    const revenue = roomRevenue + ancillaryRevenue;
    const commissionCost = roomRevenue * commissionRate;
    const variableCost = occupied * variableAbsolute + commissionCost;
    const totalCost = fixed + variableCost;
    const profit = revenue - totalCost;
    const contributionPerRoom = adr * (1 - commissionRate) + otherRevenue - variableAbsolute;
    const breakEvenOccupied = contributionPerRoom > 0 ? fixed / contributionPerRoom : Infinity;
    const breakEvenOccupancy = available > 0 ? (breakEvenOccupied / available) : Infinity;
    const adrRequired = occupied > 0 && (1 - commissionRate) > 0
      ? ((fixed / occupied) + variableAbsolute - otherRevenue) / (1 - commissionRate)
      : Infinity;

    return {
      rooms, days, occupancy, adr, otherRevenue, commissionRate, fixed, variableAbsolute,
      available, occupied, roomRevenue, ancillaryRevenue, revenue, commissionCost,
      variableCost, totalCost, profit, contributionPerRoom, breakEvenOccupied,
      breakEvenOccupancy, adrRequired,
      revpar: available > 0 ? roomRevenue / available : 0,
      trevpar: available > 0 ? revenue / available : 0,
      gopMargin: revenue > 0 ? profit / revenue : 0
    };
  }

  function updateCurrencyDecorations() {
    const symbol = symbols[currencyField?.value] || '€';
    document.querySelectorAll('[data-currency-symbol]').forEach(el => { el.textContent = symbol; });
  }

  function updateResults() {
    updateCurrencyDecorations();
    const r = calculate();
    const bePct = r.breakEvenOccupancy * 100;
    const beFeasible = Number.isFinite(bePct) && bePct <= 100;
    const targetPct = r.occupancy * 100;
    const margin = targetPct - bePct;

    setText('beOccupancy', Number.isFinite(bePct) ? pct(bePct, 1) : 'Not possible');
    setText('beRooms', Number.isFinite(r.breakEvenOccupied) ? integer(Math.ceil(r.breakEvenOccupied)) : '—');
    setText('beRoomsPerDay', Number.isFinite(r.breakEvenOccupied) ? (r.breakEvenOccupied / r.days).toFixed(1) : '—');
    setText('beRevenue', Number.isFinite(r.breakEvenOccupied) ? money(r.breakEvenOccupied * (r.adr + r.otherRevenue), 0) : '—');

    const status = $('beStatus');
    if (status) {
      status.classList.remove('positive', 'negative');
      if (!Number.isFinite(bePct)) {
        status.textContent = 'No positive contribution';
        status.classList.add('negative');
      } else if (!beFeasible) {
        status.textContent = 'Break-even above capacity';
        status.classList.add('negative');
      } else if (targetPct >= bePct) {
        status.textContent = `${pct(margin, 1)} safety margin`;
        status.classList.add('positive');
      } else {
        status.textContent = `${pct(Math.abs(margin), 1)} below break-even`;
        status.classList.add('negative');
      }
    }

    setText('targetProfit', money(r.profit, 0));
    setText('targetRevenue', money(r.revenue, 0));
    setText('targetCosts', money(r.totalCost, 0));
    setText('targetOccupied', integer(r.occupied));
    setText('targetOccupancyDisplay', pct(targetPct, 0));

    setText('neededAdr', Number.isFinite(r.adrRequired) ? money(Math.max(0, r.adrRequired), 2) : '—');
    setText('currentRevpar', money(r.revpar, 2));
    setText('currentTrevpar', money(r.trevpar, 2));
    setText('contributionRoom', money(r.contributionPerRoom, 2));
    setText('gopMargin', pct(r.gopMargin * 100, 1));
    setText('fixedCostTotal', money(r.fixed, 0));
    setText('variableRoomTotal', money(r.variableAbsolute + r.adr * r.commissionRate, 2));

    updateScenarioTable(r);
    updateCostMix(r);
    drawChart(r);
    saveValues();
  }

  function updateScenarioTable(base) {
    const body = $('scenarioBody');
    if (!body) return;
    const levels = [30, 40, 50, 60, 70, 80, 90, 100];
    const target = Math.round(base.occupancy * 100);
    body.innerHTML = levels.map(level => {
      const r = calculate(level / 100);
      const cls = Math.abs(level - target) <= 4 ? ' class="highlight"' : '';
      const pcls = r.profit >= 0 ? 'profit-positive' : 'profit-negative';
      return `<tr${cls}>
        <td>${level}%</td>
        <td>${integer(r.occupied)}</td>
        <td>${money(r.roomRevenue, 0)}</td>
        <td>${money(r.totalCost, 0)}</td>
        <td class="${pcls}">${money(r.profit, 0)}</td>
        <td>${money(r.revpar, 2)}</td>
      </tr>`;
    }).join('');
  }

  function updateCostMix(r) {
    const wrap = $('costMix');
    if (!wrap) return;

    const costs = [
      ['Fixed operating costs', r.fixed],
      ['Room servicing', r.occupied * r.variableAbsolute],
      ['Commission / payment', r.commissionCost]
    ];
    const max = Math.max(1, ...costs.map(([, value]) => value));
    wrap.innerHTML = costs.map(([label, value]) => `
      <div class="cost-row">
        <span>${label}</span>
        <div class="cost-track"><div class="cost-fill" style="--w:${Math.min(100, value / max * 100).toFixed(1)}%"></div></div>
        <strong>${money(value, 0)}</strong>
      </div>
    `).join('');
  }

  function drawChart(base) {
    if (!ctx || !chart) return;
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const cssWidth = chart.clientWidth || 760;
    const cssHeight = chart.clientHeight || 350;
    chart.width = Math.floor(cssWidth * ratio);
    chart.height = Math.floor(cssHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    const W = cssWidth;
    const H = cssHeight;
    const pad = { left: 55, right: 18, top: 18, bottom: 38 };
    const innerW = W - pad.left - pad.right;
    const innerH = H - pad.top - pad.bottom;

    const points = [];
    for (let i = 0; i <= 20; i++) {
      const occ = i / 20;
      const r = calculate(occ);
      points.push({ occ, revenue: r.revenue, cost: r.totalCost, profit: r.profit });
    }

    const yMaxRaw = Math.max(...points.flatMap(p => [p.revenue, p.cost]), 1);
    const yMax = Math.ceil(yMaxRaw / 10000) * 10000 || yMaxRaw;
    const x = occ => pad.left + occ * innerW;
    const y = value => pad.top + innerH - (value / yMax) * innerH;

    ctx.clearRect(0, 0, W, H);
    ctx.font = '10px Manrope, sans-serif';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = 'rgba(17,19,21,.09)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const value = yMax * i / 4;
      const yy = y(value);
      ctx.beginPath();
      ctx.moveTo(pad.left, yy);
      ctx.lineTo(W - pad.right, yy);
      ctx.stroke();
      ctx.fillStyle = '#7b8186';
      ctx.textAlign = 'right';
      const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
      ctx.fillText(compact, pad.left - 9, yy);
    }

    [0, .25, .5, .75, 1].forEach(tick => {
      const xx = x(tick);
      ctx.fillStyle = '#7b8186';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(tick * 100)}%`, xx, H - 13);
    });

    const drawLine = (key, color, width = 2) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      points.forEach((p, index) => {
        const xx = x(p.occ), yy = y(p[key]);
        if (index === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
      });
      ctx.stroke();
    };

    drawLine('revenue', '#9e7332', 2.4);
    drawLine('cost', '#69747a', 2.1);

    const be = base.breakEvenOccupancy;
    if (Number.isFinite(be) && be >= 0 && be <= 1) {
      const xx = x(be);
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#111315';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xx, pad.top);
      ctx.lineTo(xx, pad.top + innerH);
      ctx.stroke();
      ctx.restore();

      const label = `Break-even ${pct(be * 100, 1)}`;
      ctx.font = '700 10px Manrope, sans-serif';
      const tw = ctx.measureText(label).width;
      const bx = Math.max(pad.left + 4, Math.min(W - pad.right - tw - 20, xx + 7));
      ctx.fillStyle = '#111315';
      ctx.beginPath();
      const bw = tw + 16, bh = 25, by = pad.top + 7, radius = 8;
      ctx.roundRect(bx, by, bw, bh, radius);
      ctx.fill();
      ctx.fillStyle = '#f4f0e7';
      ctx.textAlign = 'left';
      ctx.fillText(label, bx + 8, by + bh / 2 + .5);
    }

    const targetX = x(base.occupancy);
    const targetY = y(base.revenue);
    ctx.fillStyle = '#d6a552';
    ctx.beginPath();
    ctx.arc(targetX, targetY, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function saveValues() {
    try {
      const data = {};
      fields.forEach(field => { if (field.id) data[field.id] = field.value; });
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}
  }

  function restoreValues() {
    let data = defaults;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && typeof saved === 'object') data = { ...defaults, ...saved };
    } catch {}
    Object.entries(data).forEach(([id, value]) => {
      const field = $(id);
      if (field) field.value = value;
    });
  }

  function resetValues() {
    Object.entries(defaults).forEach(([id, value]) => {
      const field = $(id);
      if (field) field.value = value;
    });
    try { localStorage.removeItem(storageKey); } catch {}
    updateResults();
  }

  function copySummary() {
    const r = calculate();
    const be = r.breakEvenOccupancy * 100;
    const summary = [
      'Plutus Hotel Break-even Summary',
      `Property: ${integer(r.rooms)} rooms / ${integer(r.days)} days`,
      `ADR: ${money(r.adr, 2)}`,
      `Break-even occupancy: ${Number.isFinite(be) ? pct(be, 1) : 'Not possible with current contribution'}`,
      `Break-even occupied room nights: ${Number.isFinite(r.breakEvenOccupied) ? integer(Math.ceil(r.breakEvenOccupied)) : '—'}`,
      `Target occupancy: ${pct(r.occupancy * 100, 1)}`,
      `Projected revenue: ${money(r.revenue, 0)}`,
      `Projected costs: ${money(r.totalCost, 0)}`,
      `Projected operating profit: ${money(r.profit, 0)}`,
      `ADR needed at target occupancy: ${Number.isFinite(r.adrRequired) ? money(Math.max(0, r.adrRequired), 2) : '—'}`
    ].join('\n');

    navigator.clipboard?.writeText(summary).then(() => {
      const button = $('copySummary');
      if (!button) return;
      const original = button.textContent;
      button.textContent = 'Copied';
      setTimeout(() => { button.textContent = original; }, 1200);
    }).catch(() => {});
  }

  restoreValues();
  updateResults();

  fields.forEach(field => {
    field.addEventListener('input', updateResults);
    field.addEventListener('change', updateResults);
  });

  $('resetCalc')?.addEventListener('click', resetValues);
  $('printCalc')?.addEventListener('click', () => window.print());
  $('copySummary')?.addEventListener('click', copySummary);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(updateResults, 120);
  });
})();
