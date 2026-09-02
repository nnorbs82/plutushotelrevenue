(function (global) {
  'use strict';

  const FIELD_NAMES = [
    'rooms', 'days', 'outOfOrder', 'currentOccupancy', 'targetProfit',
    'adr', 'ancillaryRevenue', 'otaShare', 'otaCommission', 'paymentFee',
    'revenueFee', 'housekeeping', 'linen', 'amenities', 'variableUtilities',
    'breakfastCost', 'otherVariable', 'payroll', 'rent', 'fixedUtilities',
    'insurance', 'technology', 'maintenance', 'salesAdmin', 'otherFixed'
  ];

  const PERCENT_FIELDS = ['currentOccupancy', 'otaShare', 'otaCommission', 'paymentFee', 'revenueFee'];
  const NON_NEGATIVE_FIELDS = FIELD_NAMES.filter((name) => !['rooms', 'days'].includes(name));
  const VARIABLE_FIELDS = ['housekeeping', 'linen', 'amenities', 'variableUtilities', 'breakfastCost', 'otherVariable'];
  const FIXED_FIELDS = ['payroll', 'rent', 'fixedUtilities', 'insurance', 'technology', 'maintenance', 'salesAdmin', 'otherFixed'];
  const STORAGE_KEY = 'plutus-break-even-calculator-v1';

  const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value !== 'string') return Number(value);
    const normalised = value.trim().replace(/\s/g, '').replace(',', '.');
    return normalised === '' ? NaN : Number(normalised);
  };

  const sum = (values) => values.reduce((total, value) => total + value, 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function normaliseValues(input) {
    const values = { currency: String(input.currency || 'EUR').toUpperCase() };
    FIELD_NAMES.forEach((field) => { values[field] = toNumber(input[field]); });
    return values;
  }

  function validateValues(input) {
    const values = normaliseValues(input);
    const errors = [];
    const add = (field, message) => errors.push({ field, message });

    if (!Number.isFinite(values.rooms) || values.rooms <= 0) add('rooms', 'Total rooms must be greater than zero.');
    if (!Number.isFinite(values.days) || values.days <= 0 || values.days > 366) add('days', 'Days in period must be between 1 and 366.');

    NON_NEGATIVE_FIELDS.forEach((field) => {
      if (!Number.isFinite(values[field])) add(field, 'Enter a valid number.');
      else if (values[field] < 0) add(field, 'This value cannot be negative.');
    });

    PERCENT_FIELDS.forEach((field) => {
      if (Number.isFinite(values[field]) && (values[field] < 0 || values[field] > 100)) {
        add(field, 'Enter a percentage from 0 to 100.');
      }
    });

    if (Number.isFinite(values.outOfOrder) && Number.isFinite(values.rooms) && values.outOfOrder >= values.rooms) {
      add('outOfOrder', 'Rooms out of order must be lower than total rooms.');
    }

    return { values, errors };
  }

  function calculateModel(input) {
    const checked = validateValues(input);
    const values = checked.values;
    const errors = checked.errors.slice();
    if (errors.length) return { values, errors, valid: false };

    const availableRooms = values.rooms - values.outOfOrder;
    const availableRoomNights = availableRooms * values.days;
    const occupancy = values.currentOccupancy / 100;
    const otaShare = values.otaShare / 100;
    const otaCommission = values.otaCommission / 100;
    const paymentRate = values.paymentFee / 100;
    const otherRevenueRate = values.revenueFee / 100;
    const totalRevenueRate = paymentRate + otherRevenueRate;

    const revenuePerOccupiedRoom = values.adr + values.ancillaryRevenue;
    const directVariableCost = sum(VARIABLE_FIELDS.map((field) => values[field]));
    const weightedOtaCost = values.adr * otaShare * otaCommission;
    const paymentAndRevenueFees = revenuePerOccupiedRoom * totalRevenueRate;
    const variableCostPerOccupiedRoom = directVariableCost + weightedOtaCost + paymentAndRevenueFees;
    const contributionPerOccupiedRoom = revenuePerOccupiedRoom - variableCostPerOccupiedRoom;
    const fixedCost = sum(FIXED_FIELDS.map((field) => values[field]));

    if (contributionPerOccupiedRoom <= 0) {
      errors.push({ field: 'adr', message: 'Revenue per occupied room must exceed variable and revenue-based costs.' });
      return { values, errors, valid: false };
    }

    const breakEvenNights = fixedCost / contributionPerOccupiedRoom;
    const breakEvenOccupancy = availableRoomNights > 0 ? (breakEvenNights / availableRoomNights) * 100 : Infinity;
    const targetNights = (fixedCost + values.targetProfit) / contributionPerOccupiedRoom;
    const targetOccupancy = availableRoomNights > 0 ? (targetNights / availableRoomNights) * 100 : Infinity;
    const currentOccupiedNights = availableRoomNights * occupancy;
    const currentRevenue = currentOccupiedNights * revenuePerOccupiedRoom;
    const currentVariableCost = currentOccupiedNights * variableCostPerOccupiedRoom;
    const currentTotalCost = fixedCost + currentVariableCost;
    const currentProfit = currentRevenue - currentTotalCost;
    const currentMargin = currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : null;
    const breakEvenRevenue = breakEvenNights * revenuePerOccupiedRoom;
    const roomRevparAtBreakEven = values.adr * (breakEvenOccupancy / 100);
    const roomsPerDay = values.days > 0 ? breakEvenNights / values.days : Infinity;

    const adrCoefficient = 1 - totalRevenueRate - (otaShare * otaCommission);
    const requiredContributionAtCurrentOccupancy = currentOccupiedNights > 0
      ? (fixedCost + values.targetProfit) / currentOccupiedNights
      : null;
    let requiredAdr = null;
    if (requiredContributionAtCurrentOccupancy !== null && adrCoefficient > 0) {
      requiredAdr = (
        requiredContributionAtCurrentOccupancy + directVariableCost -
        (values.ancillaryRevenue * (1 - totalRevenueRate))
      ) / adrCoefficient;
      requiredAdr = Math.max(0, requiredAdr);
    }

    const fullOccupancyRevenue = availableRoomNights * revenuePerOccupiedRoom;
    const fullOccupancyVariableCost = availableRoomNights * variableCostPerOccupiedRoom;
    const fullOccupancyTotalCost = fixedCost + fullOccupancyVariableCost;
    const fullOccupancyProfit = fullOccupancyRevenue - fullOccupancyTotalCost;
    const fixedCostShare = currentTotalCost > 0 ? (fixedCost / currentTotalCost) * 100 : 0;

    const graph = [];
    for (let percent = 0; percent <= 100; percent += 2) {
      const roomNights = availableRoomNights * (percent / 100);
      graph.push({
        occupancy: percent,
        revenue: roomNights * revenuePerOccupiedRoom,
        totalCost: fixedCost + (roomNights * variableCostPerOccupiedRoom)
      });
    }

    return {
      valid: true,
      errors: [],
      values,
      availableRooms,
      availableRoomNights,
      revenuePerOccupiedRoom,
      directVariableCost,
      weightedOtaCost,
      paymentAndRevenueFees,
      variableCostPerOccupiedRoom,
      contributionPerOccupiedRoom,
      fixedCost,
      breakEvenNights,
      breakEvenOccupancy,
      targetNights,
      targetOccupancy,
      currentOccupiedNights,
      currentRevenue,
      currentVariableCost,
      currentTotalCost,
      currentProfit,
      currentMargin,
      breakEvenRevenue,
      roomRevparAtBreakEven,
      roomsPerDay,
      requiredAdr,
      fullOccupancyRevenue,
      fullOccupancyTotalCost,
      fullOccupancyProfit,
      fixedCostShare,
      graph
    };
  }

  const api = { calculateModel, validateValues, normaliseValues };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (global) global.PlutusBreakEven = api;

  if (typeof document === 'undefined') return;

  const ready = (callback) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', callback, { once: true });
    else callback();
  };

  ready(() => {
    const root = document.querySelector('[data-calculator]');
    const form = document.getElementById('breakEvenForm');
    if (!root || !form) return;

    const fields = FIELD_NAMES.reduce((map, name) => {
      const element = document.getElementById(name);
      if (element) map[name] = element;
      return map;
    }, {});
    fields.currency = document.getElementById('currency');

    const defaultValues = Object.keys(fields).reduce((values, key) => {
      values[key] = fields[key].value;
      return values;
    }, {});

    const resultElements = {};
    document.querySelectorAll('[data-result]').forEach((element) => {
      resultElements[element.dataset.result] = element;
    });

    const errorBox = document.querySelector('[data-calculator-error]');
    const meter = document.querySelector('[data-break-even-meter]');
    const currentMarker = document.querySelector('[data-current-marker]');
    const donut = document.querySelector('[data-cost-donut]');
    const chart = document.getElementById('breakEvenChart');
    const copyButton = document.querySelector('[data-copy-summary]');
    const printButton = document.querySelector('[data-print-results]');
    const resetButton = document.querySelector('[data-reset-calculator]');
    let lastModel = null;
    let renderFrame = 0;

    const currencySymbol = (currency) => ({
      EUR: '€', GBP: '£', USD: '$', CAD: '$', AUD: '$', CHF: 'CHF', RON: 'RON'
    }[currency] || currency);

    const moneyFormatter = (currency, decimals = 0) => {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency', currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals
        });
      } catch (_) {
        return new Intl.NumberFormat(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      }
    };

    const formatMoney = (value, currency, decimals = 0) => {
      if (!Number.isFinite(value)) return 'Not available';
      return moneyFormatter(currency, decimals).format(value);
    };

    const formatNumber = (value, decimals = 0) => {
      if (!Number.isFinite(value)) return 'Not available';
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    };

    const formatPercent = (value, decimals = 1) => {
      if (!Number.isFinite(value)) return 'Not available';
      return `${formatNumber(value, decimals)}%`;
    };

    const compactMoney = (value, currency) => {
      if (!Number.isFinite(value)) return '';
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1
        }).format(value);
      } catch (_) {
        return `${currencySymbol(currency)}${formatNumber(value, 0)}`;
      }
    };

    const readValues = () => Object.keys(fields).reduce((values, key) => {
      values[key] = fields[key].value;
      return values;
    }, {});

    const setValues = (values) => {
      Object.keys(fields).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(values, key) && values[key] !== null && values[key] !== undefined) {
          fields[key].value = values[key];
        }
      });
    };

    const updateCurrencySymbols = (currency) => {
      const symbol = currencySymbol(currency);
      document.querySelectorAll('[data-currency-symbol]').forEach((element) => { element.textContent = symbol; });
    };

    const clearErrors = () => {
      Object.values(fields).forEach((field) => field?.removeAttribute('aria-invalid'));
      if (errorBox) {
        errorBox.hidden = true;
        errorBox.textContent = '';
      }
    };

    const showErrors = (errors) => {
      clearErrors();
      errors.forEach((error) => fields[error.field]?.setAttribute('aria-invalid', 'true'));
      if (errorBox) {
        const messages = [...new Set(errors.map((error) => error.message))];
        errorBox.textContent = messages.slice(0, 3).join(' ');
        errorBox.hidden = false;
      }
    };

    const setResult = (name, value) => {
      if (resultElements[name]) resultElements[name].textContent = value;
    };

    const renderInvalid = (errors, currency) => {
      showErrors(errors);
      lastModel = null;
      ['breakEvenOccupancy', 'breakEvenNights', 'contributionPerRoom', 'targetOccupancy', 'currentProfit', 'breakEvenRevenue', 'requiredAdr']
        .forEach((name) => setResult(name, '-'));
      setResult('breakEvenNarrative', 'Correct the highlighted assumptions to calculate.');
      setResult('roomsPerDay', '-');
      setResult('targetNarrative', '-');
      setResult('currentMargin', '-');
      setResult('breakEvenRevpar', '-');
      setResult('costMixPercent', '-');
      setResult('costMixNarrative', '-');
      setResult('interpretation', 'The model needs valid assumptions before it can interpret the scenario.');
      if (meter) meter.style.width = '0%';
      if (currentMarker) currentMarker.style.left = '0%';
      if (donut) donut.style.setProperty('--fixed-share', '50%');
      renderEmptyChart(currency);
    };

    const niceMaximum = (value) => {
      if (!Number.isFinite(value) || value <= 0) return 1;
      const exponent = Math.floor(Math.log10(value));
      const fraction = value / Math.pow(10, exponent);
      const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
      return niceFraction * Math.pow(10, exponent);
    };

    const svgEscape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
    }[character]));

    const pathFromPoints = (points) => points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');

    const renderEmptyChart = (currency) => {
      if (!chart) return;
      chart.innerHTML = `<title id="chartTitle">Hotel revenue and total cost by occupancy</title><desc id="chartDescription">Enter valid assumptions to generate the chart.</desc><text x="380" y="195" text-anchor="middle" class="chart-axis-label">Enter valid assumptions to draw the curve</text>`;
      const chartTitle = document.querySelector('[data-chart-title]');
      if (chartTitle) chartTitle.textContent = `Values shown in ${currency}`;
    };

    const renderChart = (model) => {
      if (!chart) return;
      const width = 760;
      const height = 390;
      const margin = { top: 32, right: 25, bottom: 49, left: 78 };
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const yMax = niceMaximum(Math.max(model.fullOccupancyRevenue, model.fullOccupancyTotalCost, model.fixedCost) * 1.08);
      const x = (percent) => margin.left + (clamp(percent, 0, 100) / 100) * plotWidth;
      const y = (amount) => margin.top + plotHeight - (clamp(amount, 0, yMax) / yMax) * plotHeight;
      const revenuePoints = model.graph.map((point) => ({ x: x(point.occupancy), y: y(point.revenue) }));
      const costPoints = model.graph.map((point) => ({ x: x(point.occupancy), y: y(point.totalCost) }));
      const revenuePath = pathFromPoints(revenuePoints);
      const costPath = pathFromPoints(costPoints);
      const areaPath = `${revenuePath} L${x(100)},${y(0)} L${x(0)},${y(0)} Z`;
      const grid = [];

      for (let step = 0; step <= 4; step += 1) {
        const ratio = step / 4;
        const yPosition = margin.top + plotHeight - ratio * plotHeight;
        const amount = ratio * yMax;
        grid.push(`<line class="chart-grid" x1="${margin.left}" y1="${yPosition}" x2="${width - margin.right}" y2="${yPosition}"/>`);
        grid.push(`<text class="chart-axis-label" x="${margin.left - 12}" y="${yPosition + 4}" text-anchor="end">${svgEscape(compactMoney(amount, model.values.currency))}</text>`);
      }

      for (let step = 0; step <= 4; step += 1) {
        const percent = step * 25;
        const xPosition = x(percent);
        grid.push(`<line class="chart-grid" x1="${xPosition}" y1="${margin.top}" x2="${xPosition}" y2="${margin.top + plotHeight}"/>`);
        grid.push(`<text class="chart-axis-label" x="${xPosition}" y="${height - 17}" text-anchor="middle">${percent}%</text>`);
      }

      const markers = [];
      if (model.breakEvenOccupancy >= 0 && model.breakEvenOccupancy <= 100) {
        const markerX = x(model.breakEvenOccupancy);
        const markerY = y(model.breakEvenRevenue);
        const anchor = model.breakEvenOccupancy > 78 ? 'end' : 'start';
        const labelX = markerX + (anchor === 'end' ? -8 : 8);
        markers.push(`<line class="chart-marker-line" x1="${markerX}" y1="${margin.top}" x2="${markerX}" y2="${margin.top + plotHeight}"/>`);
        markers.push(`<circle class="chart-marker-dot break-even" cx="${markerX}" cy="${markerY}" r="6"/>`);
        markers.push(`<text class="chart-marker-label" x="${labelX}" y="${Math.max(margin.top + 11, markerY - 13)}" text-anchor="${anchor}">Break-even ${svgEscape(formatPercent(model.breakEvenOccupancy, 1))}</text>`);
      }

      const currentX = x(model.values.currentOccupancy);
      const currentY = y(model.currentRevenue);
      const currentAnchor = model.values.currentOccupancy > 80 ? 'end' : 'start';
      const currentLabelX = currentX + (currentAnchor === 'end' ? -8 : 8);
      markers.push(`<line class="chart-marker-line" x1="${currentX}" y1="${margin.top}" x2="${currentX}" y2="${margin.top + plotHeight}" opacity=".55"/>`);
      markers.push(`<circle class="chart-marker-dot current" cx="${currentX}" cy="${currentY}" r="5"/>`);
      markers.push(`<text class="chart-marker-label" x="${currentLabelX}" y="${Math.min(margin.top + plotHeight - 8, currentY + 19)}" text-anchor="${currentAnchor}">Current ${svgEscape(formatPercent(model.values.currentOccupancy, 1))}</text>`);

      chart.innerHTML = `
        <title id="chartTitle">Hotel revenue and total cost by occupancy</title>
        <desc id="chartDescription">Revenue and total cost curves from zero to one hundred percent occupancy. Break-even is ${svgEscape(formatPercent(model.breakEvenOccupancy, 1))}; current occupancy is ${svgEscape(formatPercent(model.values.currentOccupancy, 1))}.</desc>
        ${grid.join('')}
        <path class="chart-area" d="${areaPath}"/>
        <path class="chart-line revenue" d="${revenuePath}"/>
        <path class="chart-line cost" d="${costPath}"/>
        ${markers.join('')}`;

      const chartTitle = document.querySelector('[data-chart-title]');
      if (chartTitle) chartTitle.textContent = `${formatMoney(0, model.values.currency, 0)} to ${formatMoney(yMax, model.values.currency, 0)}`;
    };

    const renderModel = (model) => {
      clearErrors();
      lastModel = model;
      const currency = model.values.currency;
      const breakEvenCapacityIssue = model.breakEvenOccupancy > 100;
      const targetCapacityIssue = model.targetOccupancy > 100;
      const breakEvenDisplay = formatPercent(model.breakEvenOccupancy, 1);

      setResult('breakEvenOccupancy', breakEvenDisplay);
      setResult('breakEvenNights', `${formatNumber(Math.ceil(model.breakEvenNights), 0)} nights`);
      setResult('roomsPerDay', `${formatNumber(model.roomsPerDay, 1)} occupied rooms per day`);
      setResult('contributionPerRoom', formatMoney(model.contributionPerOccupiedRoom, currency, 2));
      setResult('targetOccupancy', formatPercent(model.targetOccupancy, 1));
      setResult('currentProfit', formatMoney(model.currentProfit, currency, 0));
      setResult('currentMargin', model.currentMargin === null ? 'No revenue at 0% occupancy' : `${formatPercent(model.currentMargin, 1)} operating margin in this model`);
      setResult('breakEvenRevenue', formatMoney(model.breakEvenRevenue, currency, 0));
      setResult('breakEvenRevpar', `${formatMoney(model.roomRevparAtBreakEven, currency, 2)} room RevPAR`);
      setResult('requiredAdr', model.requiredAdr === null ? 'Not available' : formatMoney(model.requiredAdr, currency, 2));

      if (breakEvenCapacityIssue) {
        setResult('breakEvenNarrative', `Capacity is insufficient: full occupancy would still produce ${formatMoney(model.fullOccupancyProfit, currency, 0)}.`);
      } else {
        setResult('breakEvenNarrative', `Costs are covered at approximately ${formatNumber(model.breakEvenNights, 0)} occupied room nights.`);
      }

      if (model.values.targetProfit === 0) {
        setResult('targetNarrative', 'The target is pure break-even.');
      } else if (targetCapacityIssue) {
        setResult('targetNarrative', 'The entered target is above current capacity and pricing.');
      } else {
        setResult('targetNarrative', `${formatNumber(Math.ceil(model.targetNights), 0)} occupied room nights for the target.`);
      }

      const profitCard = resultElements.currentProfit?.closest('article');
      profitCard?.classList.toggle('is-positive', model.currentProfit >= 0);
      profitCard?.classList.toggle('is-negative', model.currentProfit < 0);

      if (meter) meter.style.width = `${clamp(model.breakEvenOccupancy, 0, 100)}%`;
      if (currentMarker) {
        currentMarker.style.left = `${clamp(model.values.currentOccupancy, 0, 100)}%`;
        currentMarker.title = `Current occupancy: ${formatPercent(model.values.currentOccupancy, 1)}`;
      }

      const fixedShare = clamp(model.fixedCostShare, 0, 100);
      if (donut) donut.style.setProperty('--fixed-share', `${fixedShare}%`);
      setResult('costMixPercent', `${formatNumber(fixedShare, 0)}%`);
      setResult('costMixNarrative', `Fixed costs are ${formatPercent(fixedShare, 0)} of total modelled cost at current occupancy; variable costs are ${formatPercent(100 - fixedShare, 0)}.`);

      const currentGapToTarget = model.currentProfit - model.values.targetProfit;
      let interpretation;
      if (breakEvenCapacityIssue) {
        interpretation = `At the entered ADR and cost structure, the property cannot break even within 100% occupancy. Full occupancy produces ${formatMoney(model.fullOccupancyProfit, currency, 0)}. Pricing, ancillary revenue or costs need to change.`;
      } else if (model.currentProfit < 0) {
        const points = Math.max(0, model.breakEvenOccupancy - model.values.currentOccupancy);
        interpretation = `At ${formatPercent(model.values.currentOccupancy, 1)} occupancy, the model shows a shortfall of ${formatMoney(Math.abs(model.currentProfit), currency, 0)}. It needs about ${formatNumber(points, 1)} more occupancy points to break even at the same ADR and cost structure.`;
      } else if (currentGapToTarget >= 0) {
        interpretation = `At ${formatPercent(model.values.currentOccupancy, 1)} occupancy, the model covers costs and reaches the entered profit target by ${formatMoney(currentGapToTarget, currency, 0)}.`;
      } else {
        interpretation = `The current occupancy scenario covers costs, but remains ${formatMoney(Math.abs(currentGapToTarget), currency, 0)} below the entered profit target. The target is reached near ${formatPercent(model.targetOccupancy, 1)} occupancy.`;
      }
      setResult('interpretation', interpretation);
      renderChart(model);
    };

    const saveValues = (values) => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(values)); } catch (_) { /* Storage may be disabled. */ }
    };

    const loadValues = () => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (saved && typeof saved === 'object') setValues(saved);
      } catch (_) { /* Ignore invalid or unavailable storage. */ }
    };

    const calculateAndRender = () => {
      renderFrame = 0;
      const values = readValues();
      updateCurrencySymbols(String(values.currency || 'EUR'));
      saveValues(values);
      const model = calculateModel(values);
      if (!model.valid) renderInvalid(model.errors, model.values.currency || 'EUR');
      else renderModel(model);
    };

    const scheduleRender = () => {
      if (renderFrame) cancelAnimationFrame(renderFrame);
      renderFrame = requestAnimationFrame(calculateAndRender);
    };

    Object.values(fields).forEach((field) => {
      field?.addEventListener('input', scheduleRender);
      field?.addEventListener('change', scheduleRender);
    });

    resetButton?.addEventListener('click', () => {
      setValues(defaultValues);
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* Ignore. */ }
      calculateAndRender();
      form.querySelector('input, select')?.focus();
    });

    const buildSummary = (model) => [
      'Plutus Hotel Break-even Calculator',
      '',
      `Period: ${formatNumber(model.values.days, 0)} days`,
      `Rooms: ${formatNumber(model.values.rooms, 0)} (${formatNumber(model.values.outOfOrder, 1)} average out of order)`,
      `ADR: ${formatMoney(model.values.adr, model.values.currency, 2)}`,
      `Current occupancy: ${formatPercent(model.values.currentOccupancy, 1)}`,
      '',
      `Break-even occupancy: ${formatPercent(model.breakEvenOccupancy, 1)}`,
      `Break-even room nights: ${formatNumber(Math.ceil(model.breakEvenNights), 0)}`,
      `Contribution per occupied room: ${formatMoney(model.contributionPerOccupiedRoom, model.values.currency, 2)}`,
      `Target-profit occupancy: ${formatPercent(model.targetOccupancy, 1)}`,
      `Projected result at current occupancy: ${formatMoney(model.currentProfit, model.values.currency, 0)}`,
      `ADR required at current occupancy: ${model.requiredAdr === null ? 'Not available' : formatMoney(model.requiredAdr, model.values.currency, 2)}`,
      '',
      'Planning estimate only. Results depend on the assumptions entered.'
    ].join('\n');

    const copyText = async (text) => {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (!copied) throw new Error('Copy was not available.');
    };

    copyButton?.addEventListener('click', async () => {
      if (!lastModel) return;
      const original = copyButton.textContent;
      try {
        await copyText(buildSummary(lastModel));
        copyButton.textContent = 'Copied';
      } catch (_) {
        copyButton.textContent = 'Copy failed';
      }
      window.setTimeout(() => { copyButton.textContent = original; }, 1600);
    });

    printButton?.addEventListener('click', () => window.print());

    loadValues();
    calculateAndRender();
  });
})(typeof window !== 'undefined' ? window : globalThis);
