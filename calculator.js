(function (global) {
  'use strict';

  const SIMPLE_FIELDS = [
    'rooms', 'days', 'adr', 'variableCost', 'fixedCost', 'currentOccupancy',
    'targetProfit', 'ancillaryRevenue', 'otaShare', 'otaCommission', 'paymentFee'
  ];

  const LEGACY_VARIABLE_FIELDS = [
    'housekeeping', 'linen', 'amenities', 'variableUtilities', 'breakfastCost', 'otherVariable'
  ];

  const LEGACY_FIXED_FIELDS = [
    'payroll', 'rent', 'fixedUtilities', 'insurance', 'technology', 'maintenance', 'salesAdmin', 'otherFixed'
  ];

  const STORAGE_KEY = 'plutus-break-even-calculator-v2';

  const toNumber = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value !== 'string') return Number(value);
    const normalised = value.trim().replace(/\s/g, '').replace(',', '.');
    return normalised === '' ? NaN : Number(normalised);
  };

  const sumFields = (input, fields) => fields.reduce((total, field) => {
    const value = toNumber(input[field]);
    return total + (Number.isFinite(value) ? value : 0);
  }, 0);

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function normaliseValues(input) {
    const hasSimpleVariableCost = input.variableCost !== undefined && input.variableCost !== null && input.variableCost !== '';
    const hasSimpleFixedCost = input.fixedCost !== undefined && input.fixedCost !== null && input.fixedCost !== '';

    return {
      currency: String(input.currency || 'EUR').toUpperCase(),
      rooms: toNumber(input.rooms),
      days: toNumber(input.days),
      adr: toNumber(input.adr),
      variableCost: hasSimpleVariableCost ? toNumber(input.variableCost) : sumFields(input, LEGACY_VARIABLE_FIELDS),
      fixedCost: hasSimpleFixedCost ? toNumber(input.fixedCost) : sumFields(input, LEGACY_FIXED_FIELDS),
      currentOccupancy: toNumber(input.currentOccupancy),
      targetProfit: toNumber(input.targetProfit),
      ancillaryRevenue: toNumber(input.ancillaryRevenue ?? 0),
      otaShare: toNumber(input.otaShare ?? 0),
      otaCommission: toNumber(input.otaCommission ?? 0),
      paymentFee: toNumber(input.paymentFee ?? 0),
      revenueFee: toNumber(input.revenueFee ?? 0),
      outOfOrder: toNumber(input.outOfOrder ?? 0)
    };
  }

  function validateValues(input) {
    const values = normaliseValues(input);
    const errors = [];
    const add = (field, message) => errors.push({ field, message });

    if (!Number.isFinite(values.rooms) || values.rooms <= 0) add('rooms', 'Number of rooms must be greater than zero.');
    if (!Number.isFinite(values.days) || values.days <= 0 || values.days > 366) add('days', 'Days in the period must be between 1 and 366.');

    ['adr', 'variableCost', 'fixedCost', 'currentOccupancy', 'targetProfit', 'ancillaryRevenue', 'otaShare', 'otaCommission', 'paymentFee'].forEach((field) => {
      if (!Number.isFinite(values[field])) add(field, 'Enter a valid number.');
      else if (values[field] < 0) add(field, 'Values cannot be negative.');
    });

    ['currentOccupancy', 'otaShare', 'otaCommission', 'paymentFee'].forEach((field) => {
      if (Number.isFinite(values[field]) && values[field] > 100) add(field, 'Percentages must be between 0 and 100.');
    });

    if (Number.isFinite(values.outOfOrder) && values.outOfOrder < 0) add('outOfOrder', 'Rooms out of order cannot be negative.');
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

    const availableRooms = values.rooms - (Number.isFinite(values.outOfOrder) ? values.outOfOrder : 0);
    const availableRoomNights = availableRooms * values.days;
    const occupancy = values.currentOccupancy / 100;
    const otaShare = values.otaShare / 100;
    const otaCommission = values.otaCommission / 100;
    const paymentRate = (values.paymentFee + (Number.isFinite(values.revenueFee) ? values.revenueFee : 0)) / 100;

    const revenuePerOccupiedRoom = values.adr + values.ancillaryRevenue;
    const weightedOtaCost = values.adr * otaShare * otaCommission;
    const paymentAndRevenueFees = revenuePerOccupiedRoom * paymentRate;
    const variableCostPerOccupiedRoom = values.variableCost + weightedOtaCost + paymentAndRevenueFees;
    const contributionPerOccupiedRoom = revenuePerOccupiedRoom - variableCostPerOccupiedRoom;
    const fixedCost = values.fixedCost;

    if (contributionPerOccupiedRoom <= 0) {
      errors.push({ field: 'adr', message: 'Revenue per occupied room must be higher than variable and distribution costs.' });
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

    const adrCoefficient = 1 - paymentRate - (otaShare * otaCommission);
    const requiredContributionAtCurrentOccupancy = currentOccupiedNights > 0
      ? (fixedCost + values.targetProfit) / currentOccupiedNights
      : null;

    let requiredAdr = null;
    if (requiredContributionAtCurrentOccupancy !== null && adrCoefficient > 0) {
      requiredAdr = (
        requiredContributionAtCurrentOccupancy + values.variableCost -
        (values.ancillaryRevenue * (1 - paymentRate))
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
      directVariableCost: values.variableCost,
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
    const root = document.querySelector('[data-simple-calculator]');
    const form = document.getElementById('breakEvenForm');
    if (!root || !form) return;

    const fields = SIMPLE_FIELDS.reduce((map, name) => {
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
    const chart = document.getElementById('breakEvenChart');
    const resetButton = document.querySelector('[data-reset-calculator]');
    let renderFrame = 0;

    const currencySymbol = (currency) => ({
      EUR: '€', GBP: '£', USD: '$', CAD: '$', AUD: '$', CHF: 'CHF', RON: 'RON'
    }[currency] || currency);

    const formatMoney = (value, currency, decimals = 0) => {
      if (!Number.isFinite(value)) return '-';
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency', currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals
        }).format(value);
      } catch (_) {
        return `${currencySymbol(currency)} ${new Intl.NumberFormat().format(value)}`;
      }
    };

    const formatNumber = (value, decimals = 0) => {
      if (!Number.isFinite(value)) return '-';
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(value);
    };

    const formatPercent = (value, decimals = 1) => Number.isFinite(value) ? `${formatNumber(value, decimals)}%` : '-';

    const readValues = () => Object.keys(fields).reduce((values, key) => {
      values[key] = fields[key].value;
      return values;
    }, {});

    const setValues = (values) => {
      Object.keys(fields).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(values, key)) fields[key].value = values[key];
      });
    };

    const updateCurrencySymbols = (currency) => {
      const symbol = currencySymbol(currency);
      document.querySelectorAll('[data-currency-symbol]').forEach((element) => { element.textContent = symbol; });
    };

    const setResult = (name, value) => {
      if (resultElements[name]) resultElements[name].textContent = value;
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
        errorBox.textContent = [...new Set(errors.map((error) => error.message))].slice(0, 3).join(' ');
        errorBox.hidden = false;
      }
    };

    const renderEmpty = () => {
      ['breakEvenOccupancy', 'breakEvenNights', 'contributionPerRoom', 'currentProfit', 'currentMargin', 'targetOccupancy', 'targetNarrative', 'requiredAdr', 'breakEvenRevenue', 'breakEvenRevpar', 'roomsPerDay']
        .forEach((name) => setResult(name, '-'));
      setResult('breakEvenNarrative', 'Correct the highlighted values to calculate.');
      if (meter) meter.style.width = '0%';
      if (chart) {
        chart.innerHTML = '<title id="chartTitle">Hotel revenue and total cost by occupancy</title><desc id="chartDescription">Enter valid assumptions to generate the chart.</desc><text x="340" y="150" text-anchor="middle" class="simple-chart-text">Enter valid assumptions to draw the chart</text>';
      }
    };

    const niceMaximum = (value) => {
      if (!Number.isFinite(value) || value <= 0) return 1;
      const exponent = Math.floor(Math.log10(value));
      const fraction = value / Math.pow(10, exponent);
      const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
      return niceFraction * Math.pow(10, exponent);
    };

    const drawChart = (model) => {
      if (!chart) return;
      const width = 680;
      const height = 300;
      const margin = { top: 22, right: 18, bottom: 38, left: 62 };
      const plotWidth = width - margin.left - margin.right;
      const plotHeight = height - margin.top - margin.bottom;
      const yMax = niceMaximum(Math.max(model.fullOccupancyRevenue, model.fullOccupancyTotalCost, model.fixedCost) * 1.08);
      const x = (percent) => margin.left + (clamp(percent, 0, 100) / 100) * plotWidth;
      const y = (amount) => margin.top + plotHeight - (clamp(amount, 0, yMax) / yMax) * plotHeight;
      const path = (key) => model.graph.map((point, index) => `${index ? 'L' : 'M'}${x(point.occupancy).toFixed(1)},${y(point[key]).toFixed(1)}`).join(' ');

      const grid = [0, .25, .5, .75, 1].map((ratio) => {
        const amount = yMax * ratio;
        const yy = y(amount);
        return `<line x1="${margin.left}" y1="${yy}" x2="${width - margin.right}" y2="${yy}" class="simple-chart-grid"/><text x="${margin.left - 9}" y="${yy + 4}" text-anchor="end" class="simple-chart-text">${Math.round(amount / 1000)}k</text>`;
      }).join('');

      const xLabels = [0, 25, 50, 75, 100].map((percent) => `<text x="${x(percent)}" y="${height - 10}" text-anchor="middle" class="simple-chart-text">${percent}%</text>`).join('');

      const breakEvenX = x(model.breakEvenOccupancy);
      const breakEvenY = y(model.breakEvenRevenue);
      const marker = model.breakEvenOccupancy >= 0 && model.breakEvenOccupancy <= 100
        ? `<line x1="${breakEvenX}" y1="${margin.top}" x2="${breakEvenX}" y2="${height - margin.bottom}" class="simple-chart-marker"/><circle cx="${breakEvenX}" cy="${breakEvenY}" r="6" class="simple-chart-point"/><text x="${breakEvenX + 8}" y="${Math.max(margin.top + 13, breakEvenY - 10)}" class="simple-chart-text">Break-even ${formatPercent(model.breakEvenOccupancy)}</text>`
        : '';

      chart.innerHTML = `
        <title id="chartTitle">Hotel revenue and total cost by occupancy</title>
        <desc id="chartDescription">Revenue and total costs from zero to one hundred percent occupancy with the break-even point marked.</desc>
        ${grid}${xLabels}
        <path d="${path('revenue')}" class="simple-chart-revenue"/>
        <path d="${path('totalCost')}" class="simple-chart-cost"/>
        ${marker}`;
    };

    const render = () => {
      renderFrame = 0;
      const values = readValues();
      updateCurrencySymbols(values.currency || 'EUR');
      const model = calculateModel(values);
      if (!model.valid) {
        showErrors(model.errors);
        renderEmpty();
        return;
      }

      clearErrors();
      const currency = model.values.currency;
      const breakEvenAboveCapacity = model.breakEvenOccupancy > 100;
      const targetAboveCapacity = model.targetOccupancy > 100;

      setResult('breakEvenOccupancy', formatPercent(model.breakEvenOccupancy));
      setResult('breakEvenNights', formatNumber(model.breakEvenNights, 0));
      setResult('roomsPerDay', `${formatNumber(model.roomsPerDay, 1)} rooms per day on average`);
      setResult('contributionPerRoom', formatMoney(model.contributionPerOccupiedRoom, currency, 2));
      setResult('currentProfit', formatMoney(model.currentProfit, currency, 0));
      setResult('currentMargin', model.currentMargin === null ? 'No revenue in current scenario' : `${formatPercent(model.currentMargin)} margin`);
      setResult('targetOccupancy', formatPercent(model.targetOccupancy));
      setResult('requiredAdr', model.requiredAdr === null ? '-' : formatMoney(model.requiredAdr, currency, 2));
      setResult('breakEvenRevenue', formatMoney(model.breakEvenRevenue, currency, 0));
      setResult('breakEvenRevpar', `${formatMoney(model.roomRevparAtBreakEven, currency, 2)} room RevPAR at break-even`);

      if (breakEvenAboveCapacity) {
        setResult('breakEvenNarrative', 'Break-even is above 100% occupancy with these assumptions. Rate, costs or contribution need to change.');
      } else {
        setResult('breakEvenNarrative', `You need about ${formatNumber(model.breakEvenNights, 0)} occupied room nights in this period.`);
      }

      if (model.values.targetProfit === 0) {
        setResult('targetNarrative', 'No additional target profit entered.');
      } else if (targetAboveCapacity) {
        setResult('targetNarrative', 'Target is above available room capacity.');
      } else {
        setResult('targetNarrative', `Includes ${formatMoney(model.values.targetProfit, currency, 0)} target profit.`);
      }

      if (meter) meter.style.width = `${clamp(model.breakEvenOccupancy, 0, 100)}%`;
      drawChart(model);

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      } catch (_) {
        // Storage is optional.
      }
    };

    const scheduleRender = () => {
      if (renderFrame) cancelAnimationFrame(renderFrame);
      renderFrame = requestAnimationFrame(render);
    };

    form.addEventListener('input', scheduleRender);
    form.addEventListener('change', scheduleRender);

    resetButton?.addEventListener('click', () => {
      setValues(defaultValues);
      try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      render();
    });

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored && typeof stored === 'object') setValues(stored);
    } catch (_) {
      // Ignore invalid or unavailable local storage.
    }

    render();
  });
})(typeof window !== 'undefined' ? window : globalThis);
