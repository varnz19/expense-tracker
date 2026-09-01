/**
 * SpendWise — Interactive Expense Tracker & Financial Analytics
 * Full featured single-page application logic
 */

(function () {
  'use strict';

  // --- Constants & Storage Keys ---
  const STORAGE_KEYS = {
    EXPENSES: 'spendwise_expenses_v1',
    CATEGORIES: 'spendwise_categories_v1',
    CURRENCY: 'spendwise_currency_v1',
    THEME: 'spendwise_theme_v1'
  };

  const DEFAULT_CATEGORIES = [
    { id: 'cat-food', name: 'Food', color: '#10b981', icon: '🍔', isCustom: false },
    { id: 'cat-transport', name: 'Transport', color: '#0284c7', icon: '🚗', isCustom: false },
    { id: 'cat-shopping', name: 'Shopping', color: '#ec4899', icon: '🛍️', isCustom: false },
    { id: 'cat-bills', name: 'Bills', color: '#ef4444', icon: '📄', isCustom: false },
    { id: 'cat-entertainment', name: 'Entertainment', color: '#8b5cf6', icon: '🎬', isCustom: false },
    { id: 'cat-health', name: 'Health', color: '#14b8a6', icon: '💊', isCustom: false },
    { id: 'cat-other', name: 'Other', color: '#64748b', icon: '📦', isCustom: false }
  ];

  // --- Application State ---
  const state = {
    expenses: [],
    categories: [],
    currency: '$',
    theme: 'dark',
    selectedMonth: getCurrentMonthString(), // "YYYY-MM"
    categoryChartView: 'pie', // 'pie' or 'bar'
    filters: {
      category: 'ALL',
      dateScope: 'SELECTED_MONTH', // 'SELECTED_MONTH', 'LAST_30_DAYS', 'ALL_TIME', 'CUSTOM'
      customStart: '',
      customEnd: '',
      searchQuery: '',
      sortOrder: 'DATE_DESC' // 'DATE_DESC', 'DATE_ASC', 'AMOUNT_DESC', 'AMOUNT_ASC'
    },
    editingExpenseId: null,
    pendingDeleteId: null,
    lastDeletedItem: null
  };

  // Chart instances
  let categoryChartInstance = null;
  let trendChartInstance = null;

  // --- Helper Date & Format Utilities ---
  function getCurrentMonthString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  function formatMonthTitle(yearMonthStr) {
    if (!yearMonthStr) return 'Selected Month';
    const [year, month] = yearMonthStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return `${state.currency}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function generateUniqueId() {
    return 'exp_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
  }

  // --- Seed Sample Data ---
  function getSampleData() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    const sampleExpenses = [];
    const sampleTemplates = [
      { cat: 'Food', note: 'Weekly Groceries at Trader Joe\'s', amount: 84.50 },
      { cat: 'Food', note: 'Artisan Coffee & Croissant', amount: 9.75 },
      { cat: 'Food', note: 'Dinner with Friends at Bistro', amount: 62.00 },
      { cat: 'Transport', note: 'Monthly Subway Pass', amount: 90.00 },
      { cat: 'Transport', note: 'Uber ride to Downtown', amount: 24.50 },
      { cat: 'Shopping', note: 'Running Shoes & Sports Gear', amount: 110.00 },
      { cat: 'Shopping', note: 'Books & Stationery', amount: 35.20 },
      { cat: 'Bills', note: 'High Speed Fiber Internet', amount: 65.00 },
      { cat: 'Bills', note: 'Electric & Utility Bill', amount: 115.40 },
      { cat: 'Bills', note: 'Phone Plan Subscription', amount: 45.00 },
      { cat: 'Entertainment', note: 'Movie Tickets & IMAX Popcorn', amount: 32.00 },
      { cat: 'Entertainment', note: 'Streaming Services (Spotify & Netflix)', amount: 28.99 },
      { cat: 'Health', note: 'Pharmacy & Vitamin Supplements', amount: 42.10 },
      { cat: 'Health', note: 'Gym Membership Monthly', amount: 55.00 },
      { cat: 'Other', note: 'Home Hardware & Garden Supplies', amount: 38.60 }
    ];

    // Seed across last 5 months + current month
    for (let mOffset = 0; mOffset <= 5; mOffset++) {
      const targetDate = new Date(currentYear, currentMonth - mOffset, 1);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, '0');
      const maxDaysInMonth = new Date(y, targetDate.getMonth() + 1, 0).getDate();

      // Pick 5 to 8 items per month
      const itemsCount = mOffset === 0 ? 9 : Math.floor(Math.random() * 4) + 5;
      for (let i = 0; i < itemsCount; i++) {
        const item = sampleTemplates[(i + mOffset * 3) % sampleTemplates.length];
        const day = Math.min(maxDaysInMonth, Math.max(1, (i * 3 + mOffset * 2) % maxDaysInMonth + 1));
        const dayStr = String(day).padStart(2, '0');
        const expenseDate = `${y}-${m}-${dayStr}`;

        sampleExpenses.push({
          id: generateUniqueId(),
          amount: parseFloat((item.amount * (0.85 + Math.random() * 0.3)).toFixed(2)),
          category: item.cat,
          date: expenseDate,
          note: item.note,
          createdAt: new Date(expenseDate).toISOString()
        });
      }
    }

    return sampleExpenses;
  }

  // --- Persistence & Storage ---
  function loadStateFromStorage() {
    try {
      // Load Categories
      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (storedCategories) {
        state.categories = JSON.parse(storedCategories);
      } else {
        state.categories = [...DEFAULT_CATEGORIES];
        saveCategoriesToStorage();
      }

      // Load Currency
      const storedCurrency = localStorage.getItem(STORAGE_KEYS.CURRENCY);
      if (storedCurrency) {
        state.currency = storedCurrency;
      }

      // Load Theme
      const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (storedTheme) {
        state.theme = storedTheme;
      }

      // Load Expenses
      const storedExpenses = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (storedExpenses) {
        state.expenses = JSON.parse(storedExpenses);
      } else {
        // Initial first visit: populate realistic sample data
        state.expenses = getSampleData();
        saveExpensesToStorage();
      }
    } catch (err) {
      console.error('Error loading data from localStorage:', err);
      state.categories = [...DEFAULT_CATEGORIES];
      state.expenses = getSampleData();
    }
  }

  function saveExpensesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(state.expenses));
    } catch (err) {
      console.error('Error saving expenses to localStorage:', err);
      showToast('Failed to save data to local storage', 'danger');
    }
  }

  function saveCategoriesToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(state.categories));
    } catch (err) {
      console.error('Error saving categories to localStorage:', err);
    }
  }

  function saveCurrencyToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENCY, state.currency);
    } catch (err) {
      console.error('Error saving currency to localStorage:', err);
    }
  }

  function saveThemeToStorage() {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, state.theme);
    } catch (err) {
      console.error('Error saving theme to localStorage:', err);
    }
  }

  // --- Category Lookups & Helpers ---
  function getCategoryObj(categoryName) {
    const found = state.categories.find(c => c.name.toLowerCase() === (categoryName || '').toLowerCase());
    if (found) return found;
    return { id: 'cat-custom', name: categoryName || 'Other', color: '#6366f1', icon: '🏷️', isCustom: true };
  }

  function getCategoryColor(categoryName) {
    return getCategoryObj(categoryName).color;
  }

  // --- Filter & Query Pipeline ---
  function getFilteredExpenses() {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    return state.expenses.filter(exp => {
      // 1. Category Filter
      if (state.filters.category !== 'ALL') {
        if (exp.category.toLowerCase() !== state.filters.category.toLowerCase()) {
          return false;
        }
      }

      // 2. Date Scope Filter
      if (state.filters.dateScope === 'SELECTED_MONTH') {
        if (!exp.date.startsWith(state.selectedMonth)) {
          return false;
        }
      } else if (state.filters.dateScope === 'LAST_30_DAYS') {
        if (exp.date < thirtyDaysAgoStr || exp.date > todayStr) {
          return false;
        }
      } else if (state.filters.dateScope === 'CUSTOM') {
        if (state.filters.customStart && exp.date < state.filters.customStart) return false;
        if (state.filters.customEnd && exp.date > state.filters.customEnd) return false;
      }

      // 3. Search Query Filter
      if (state.filters.searchQuery.trim() !== '') {
        const q = state.filters.searchQuery.toLowerCase().trim();
        const matchNote = (exp.note || '').toLowerCase().includes(q);
        const matchCat = (exp.category || '').toLowerCase().includes(q);
        const matchAmount = exp.amount.toString().includes(q);
        if (!matchNote && !matchCat && !matchAmount) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sorting
      if (state.filters.sortOrder === 'DATE_DESC') {
        return new Date(b.date) - new Date(a.date) || (b.createdAt > a.createdAt ? 1 : -1);
      } else if (state.filters.sortOrder === 'DATE_ASC') {
        return new Date(a.date) - new Date(b.date) || (a.createdAt > b.createdAt ? 1 : -1);
      } else if (state.filters.sortOrder === 'AMOUNT_DESC') {
        return b.amount - a.amount;
      } else if (state.filters.sortOrder === 'AMOUNT_ASC') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }

  // --- Metrics Calculation ---
  function computeMetrics() {
    // 1. All Time Total
    const allTimeTotal = state.expenses.reduce((acc, cur) => acc + Number(cur.amount), 0);
    const allTimeCount = state.expenses.length;

    // 2. Selected Month Expenses
    const monthExpenses = state.expenses.filter(e => e.date.startsWith(state.selectedMonth));
    const monthTotal = monthExpenses.reduce((acc, cur) => acc + Number(cur.amount), 0);
    const monthCount = monthExpenses.length;

    // 3. Daily Average for Selected Month
    const [selYear, selMonth] = state.selectedMonth.split('-').map(Number);
    const now = new Date();
    const isCurrentMonth = (selYear === now.getFullYear() && selMonth === (now.getMonth() + 1));
    const daysInMonth = new Date(selYear, selMonth, 0).getDate();
    const daysElapsed = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth;
    const dailyAverage = monthTotal > 0 ? (monthTotal / daysElapsed) : 0;

    // 4. Top Category in Selected Month
    const categoryTotals = {};
    monthExpenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
    });

    let topCategory = 'None';
    let topCategoryAmount = 0;
    let topCategoryPct = 0;

    Object.entries(categoryTotals).forEach(([cat, amt]) => {
      if (amt > topCategoryAmount) {
        topCategory = cat;
        topCategoryAmount = amt;
      }
    });

    if (monthTotal > 0 && topCategoryAmount > 0) {
      topCategoryPct = Math.round((topCategoryAmount / monthTotal) * 100);
    }

    return {
      allTimeTotal,
      allTimeCount,
      monthTotal,
      monthCount,
      dailyAverage,
      daysElapsed,
      topCategory,
      topCategoryAmount,
      topCategoryPct,
      categoryTotals
    };
  }

  // --- Rendering UI ---
  function renderAll() {
    updateThemeUI();
    renderMonthNavigation();
    renderMetrics();
    renderCharts();
    renderExpensesList();
    renderCategoryOptions();
    renderActiveFilterBadges();
  }

  function updateThemeUI() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) currencySelect.value = state.currency;
    const formCurrencySymbol = document.getElementById('form-currency-symbol');
    if (formCurrencySymbol) formCurrencySymbol.textContent = state.currency;
  }

  function renderMonthNavigation() {
    const monthLabel = document.getElementById('current-month-label');
    const monthPicker = document.getElementById('month-picker-input');
    const metricMonthTitle = document.getElementById('metric-month-title');
    const chartMonthSubtitle = document.getElementById('chart-month-subtitle');

    const formattedTitle = formatMonthTitle(state.selectedMonth);
    if (monthLabel) monthLabel.textContent = formattedTitle;
    if (monthPicker) monthPicker.value = state.selectedMonth;
    if (metricMonthTitle) metricMonthTitle.textContent = `${formattedTitle} Spend`;
    if (chartMonthSubtitle) chartMonthSubtitle.textContent = `Spending distribution for ${formattedTitle}`;
  }

  function renderMetrics() {
    const metrics = computeMetrics();

    // 1. Month Total
    const monthTotalEl = document.getElementById('metric-month-total');
    const monthChangeEl = document.getElementById('metric-month-change');
    if (monthTotalEl) monthTotalEl.textContent = formatCurrency(metrics.monthTotal);
    if (monthChangeEl) {
      monthChangeEl.innerHTML = `<span class="metric-badge neutral">${metrics.monthCount} ${metrics.monthCount === 1 ? 'transaction' : 'transactions'}</span>`;
    }

    // 2. All-Time Total
    const allTimeTotalEl = document.getElementById('metric-all-time-total');
    const allTimeCountEl = document.getElementById('metric-all-time-count');
    if (allTimeTotalEl) allTimeTotalEl.textContent = formatCurrency(metrics.allTimeTotal);
    if (allTimeCountEl) allTimeCountEl.textContent = `${metrics.allTimeCount} total transactions`;

    // 3. Daily Average
    const dailyAvgEl = document.getElementById('metric-daily-average');
    const daysElapsedEl = document.getElementById('metric-days-elapsed');
    if (dailyAvgEl) dailyAvgEl.textContent = formatCurrency(metrics.dailyAverage);
    if (daysElapsedEl) daysElapsedEl.textContent = `Based on ${metrics.daysElapsed} days`;

    // 4. Top Category
    const topCatEl = document.getElementById('metric-top-category');
    const topCatAmtEl = document.getElementById('metric-top-category-amount');
    if (topCatEl) topCatEl.textContent = metrics.topCategory;
    if (topCatAmtEl) {
      topCatAmtEl.textContent = metrics.topCategoryAmount > 0 
        ? `${formatCurrency(metrics.topCategoryAmount)} (${metrics.topCategoryPct}%)`
        : '$0.00 (0%)';
    }
  }

  // --- Category & Trend Charts ---
  function renderCharts() {
    renderCategoryBreakdownChart();
    renderMonthlyTrendChart();
  }

  function renderCategoryBreakdownChart() {
    const ctx = document.getElementById('category-chart');
    const emptyState = document.getElementById('chart-empty-state');
    const legendList = document.getElementById('category-legend-list');
    if (!ctx) return;

    // Get current month's expenses
    const monthExpenses = state.expenses.filter(e => e.date.startsWith(state.selectedMonth));
    
    if (monthExpenses.length === 0) {
      ctx.style.display = 'none';
      if (emptyState) emptyState.classList.remove('hidden');
      if (legendList) legendList.innerHTML = '';
      if (categoryChartInstance) {
        categoryChartInstance.destroy();
        categoryChartInstance = null;
      }
      return;
    }

    ctx.style.display = 'block';
    if (emptyState) emptyState.classList.add('hidden');

    // Aggregate category totals
    const catMap = {};
    let totalSpend = 0;
    monthExpenses.forEach(exp => {
      catMap[exp.category] = (catMap[exp.category] || 0) + Number(exp.amount);
      totalSpend += Number(exp.amount);
    });

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);
    const backgroundColors = labels.map(cat => getCategoryColor(cat));

    // Render HTML custom legend
    if (legendList) {
      legendList.innerHTML = labels.map((cat, idx) => {
        const amt = data[idx];
        const pct = totalSpend > 0 ? Math.round((amt / totalSpend) * 100) : 0;
        const col = backgroundColors[idx];
        return `
          <div class="legend-chip">
            <span class="legend-dot" style="background-color: ${col};"></span>
            <strong>${cat}:</strong>
            <span>${formatCurrency(amt)} (${pct}%)</span>
          </div>
        `;
      }).join('');
    }

    if (categoryChartInstance) {
      categoryChartInstance.destroy();
    }

    const isPie = state.categoryChartView === 'pie';
    const chartType = isPie ? 'doughnut' : 'bar';

    const chartConfig = {
      type: chartType,
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColors,
          borderColor: isPie ? (state.theme === 'dark' ? '#121826' : '#ffffff') : backgroundColors,
          borderWidth: isPie ? 2 : 1,
          borderRadius: isPie ? 0 : 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: !isPie, // HTML custom legend used for doughnut
            position: 'bottom',
            labels: {
              color: state.theme === 'dark' ? '#94a3b8' : '#475569',
              font: { family: 'Plus Jakarta Sans', size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const val = context.raw || 0;
                const pct = totalSpend > 0 ? ((val / totalSpend) * 100).toFixed(1) : 0;
                return ` ${context.label}: ${formatCurrency(val)} (${pct}%)`;
              }
            }
          }
        },
        scales: isPie ? {} : {
          y: {
            beginAtZero: true,
            grid: { color: state.theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.06)' },
            ticks: {
              color: state.theme === 'dark' ? '#94a3b8' : '#64748b',
              callback: val => state.currency + val
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: state.theme === 'dark' ? '#94a3b8' : '#64748b' }
          }
        },
        cutout: isPie ? '68%' : 0
      }
    };

    categoryChartInstance = new Chart(ctx, chartConfig);
  }

  function renderMonthlyTrendChart() {
    const ctx = document.getElementById('trend-chart');
    if (!ctx) return;

    // Get the last 6 months list relative to selectedMonth
    const [selYear, selMonth] = state.selectedMonth.split('-').map(Number);
    const monthsArray = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(selYear, selMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthsArray.push({ key: `${y}-${m}`, label });
    }

    // Calculate spend per month
    const monthlySpending = monthsArray.map(mObj => {
      const total = state.expenses
        .filter(exp => exp.date.startsWith(mObj.key))
        .reduce((sum, exp) => sum + Number(exp.amount), 0);
      return total;
    });

    const labels = monthsArray.map(m => m.label);

    // Insights computation
    let highestSpend = 0;
    let highestMonthName = '—';
    let total6MoSpend = 0;

    monthlySpending.forEach((amt, idx) => {
      total6MoSpend += amt;
      if (amt > highestSpend) {
        highestSpend = amt;
        highestMonthName = labels[idx];
      }
    });

    const avgSpend = total6MoSpend / 6;

    const highestMonthEl = document.getElementById('insight-highest-month');
    const avgSpendEl = document.getElementById('insight-avg-spend');
    if (highestMonthEl) highestMonthEl.textContent = highestSpend > 0 ? `${highestMonthName} (${formatCurrency(highestSpend)})` : '—';
    if (avgSpendEl) avgSpendEl.textContent = formatCurrency(avgSpend);

    if (trendChartInstance) {
      trendChartInstance.destroy();
    }

    const isDarkMode = state.theme === 'dark';
    const primaryCol = '#6366f1';
    const activeMonthKey = state.selectedMonth;

    // Highlight selected month in bar chart
    const backgroundColors = monthsArray.map(m => m.key === activeMonthKey ? '#8b5cf6' : (isDarkMode ? 'rgba(99, 102, 241, 0.45)' : 'rgba(99, 102, 241, 0.65)'));

    trendChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Monthly Total',
          data: monthlySpending,
          backgroundColor: backgroundColors,
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: context => ` Total: ${formatCurrency(context.raw)}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0,0,0,0.06)' },
            ticks: {
              color: isDarkMode ? '#94a3b8' : '#64748b',
              callback: val => state.currency + val
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: isDarkMode ? '#94a3b8' : '#64748b' }
          }
        }
      }
    });
  }

  // --- Expenses List View ---
  function renderExpensesList() {
    const listContainer = document.getElementById('expenses-list');
    const emptyState = document.getElementById('empty-state');
    const countSubtitle = document.getElementById('expenses-count-subtitle');
    if (!listContainer) return;

    const filtered = getFilteredExpenses();

    if (countSubtitle) {
      countSubtitle.textContent = `Showing ${filtered.length} ${filtered.length === 1 ? 'transaction' : 'transactions'}`;
    }

    if (filtered.length === 0) {
      listContainer.innerHTML = '';
      if (emptyState) {
        emptyState.classList.remove('hidden');
        // Customize empty state message based on scope
        const titleEl = document.getElementById('empty-state-title');
        const descEl = document.getElementById('empty-state-desc');
        if (state.filters.searchQuery) {
          if (titleEl) titleEl.textContent = 'No matching expenses found';
          if (descEl) descEl.textContent = `No expenses match your search "${state.filters.searchQuery}". Try clearing search filters.`;
        } else if (state.filters.category !== 'ALL') {
          if (titleEl) titleEl.textContent = `No expenses in category "${state.filters.category}"`;
          if (descEl) descEl.textContent = 'Try choosing a different category or period.';
        } else {
          if (titleEl) titleEl.textContent = `No expenses for ${formatMonthTitle(state.selectedMonth)}`;
          if (descEl) descEl.textContent = 'You have not recorded any transactions for this period. Click below to add one!';
        }
      }
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    listContainer.innerHTML = filtered.map(exp => {
      const cat = getCategoryObj(exp.category);
      const formattedDate = formatDisplayDate(exp.date);
      const noteHtml = exp.note ? `<span class="expense-note">${escapeHtml(exp.note)}</span>` : '';

      return `
        <div class="expense-item" data-id="${exp.id}">
          <div class="expense-left">
            <div class="cat-icon-badge" style="background-color: ${cat.color};">
              ${cat.icon || '🏷️'}
            </div>
            <div class="expense-details">
              <span class="expense-cat-name">${escapeHtml(exp.category)}</span>
              ${noteHtml}
              <span class="expense-date-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                ${formattedDate}
              </span>
            </div>
          </div>
          <div class="expense-right">
            <div class="expense-amount">${formatCurrency(exp.amount)}</div>
            <div class="expense-actions">
              <button class="action-btn edit-btn" data-id="${exp.id}" title="Edit Expense" aria-label="Edit">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button class="action-btn delete delete-btn" data-id="${exp.id}" title="Delete Expense" aria-label="Delete">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to edit and delete buttons
    listContainer.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditExpenseModal(btn.dataset.id));
    });

    listContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => confirmDeleteExpense(btn.dataset.id));
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- Category Options Rendering ---
  function renderCategoryOptions() {
    // 1. Expense Form Category Select
    const selectEl = document.getElementById('expense-category-select');
    if (selectEl) {
      const curVal = selectEl.value;
      selectEl.innerHTML = state.categories.map(c => 
        `<option value="${escapeHtml(c.name)}">${c.icon || '🏷️'} ${escapeHtml(c.name)}</option>`
      ).join('');
      if (curVal && state.categories.some(c => c.name === curVal)) {
        selectEl.value = curVal;
      }
    }

    // 2. Filter Category Select
    const filterCatSelect = document.getElementById('category-filter');
    if (filterCatSelect) {
      filterCatSelect.innerHTML = `<option value="ALL">All Categories</option>` +
        state.categories.map(c => 
          `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`
        ).join('');
      filterCatSelect.value = state.filters.category;
    }

    // 3. Quick Category Chips in Add Modal
    const chipsContainer = document.getElementById('quick-category-chips');
    if (chipsContainer) {
      chipsContainer.innerHTML = state.categories.map(c => `
        <button type="button" class="cat-chip" data-category="${escapeHtml(c.name)}">
          ${c.icon || '🏷️'} ${escapeHtml(c.name)}
        </button>
      `).join('');

      chipsContainer.querySelectorAll('.cat-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          if (selectEl) {
            selectEl.value = chip.dataset.category;
            updateSelectedChip();
          }
        });
      });
    }

    // 4. Category Management List
    renderCategoryManagerList();
  }

  function updateSelectedChip() {
    const selectEl = document.getElementById('expense-category-select');
    if (!selectEl) return;
    const chips = document.querySelectorAll('.cat-chip');
    chips.forEach(chip => {
      chip.classList.toggle('selected', chip.dataset.category === selectEl.value);
    });
  }

  function renderCategoryManagerList() {
    const container = document.getElementById('category-manager-list');
    if (!container) return;

    container.innerHTML = state.categories.map(cat => {
      const isCustom = !!cat.isCustom;
      const count = state.expenses.filter(e => e.category.toLowerCase() === cat.name.toLowerCase()).length;
      
      const actionHtml = isCustom 
        ? `<button type="button" class="action-btn delete delete-cat-btn" data-cat-id="${cat.id}" title="Delete Category">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
           </button>`
        : `<span class="cat-type-label">Default</span>`;

      return `
        <div class="cat-manage-item">
          <div class="cat-manage-left">
            <span class="cat-dot-pill" style="background-color: ${cat.color};"></span>
            <span>${cat.icon || '🏷️'} ${escapeHtml(cat.name)}</span>
            <span class="cat-type-label">(${count} ${count === 1 ? 'entry' : 'entries'})</span>
          </div>
          <div>${actionHtml}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.delete-cat-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteCustomCategory(btn.dataset.catId));
    });
  }

  function deleteCustomCategory(catId) {
    const cat = state.categories.find(c => c.id === catId);
    if (!cat) return;

    const count = state.expenses.filter(e => e.category.toLowerCase() === cat.name.toLowerCase()).length;
    if (count > 0) {
      if (!confirm(`Category "${cat.name}" is used in ${count} expense entries. Deleting will reassign them to "Other". Continue?`)) {
        return;
      }
      // Reassign to Other
      state.expenses.forEach(e => {
        if (e.category.toLowerCase() === cat.name.toLowerCase()) {
          e.category = 'Other';
        }
      });
      saveExpensesToStorage();
    }

    state.categories = state.categories.filter(c => c.id !== catId);
    saveCategoriesToStorage();
    renderAll();
    showToast(`Category "${cat.name}" removed`, 'info');
  }

  // --- Active Filter Badges ---
  function renderActiveFilterBadges() {
    const bar = document.getElementById('active-filters-bar');
    const container = document.getElementById('filter-tag-container');
    if (!bar || !container) return;

    const tags = [];

    if (state.filters.category !== 'ALL') {
      tags.push({ key: 'category', label: `Category: ${state.filters.category}` });
    }

    if (state.filters.dateScope === 'LAST_30_DAYS') {
      tags.push({ key: 'dateScope', label: 'Last 30 Days' });
    } else if (state.filters.dateScope === 'ALL_TIME') {
      tags.push({ key: 'dateScope', label: 'All Time' });
    } else if (state.filters.dateScope === 'CUSTOM') {
      const rangeText = `${state.filters.customStart || 'Start'} to ${state.filters.customEnd || 'End'}`;
      tags.push({ key: 'dateScope', label: `Custom: ${rangeText}` });
    }

    if (state.filters.searchQuery.trim() !== '') {
      tags.push({ key: 'search', label: `Search: "${state.filters.searchQuery}"` });
    }

    if (tags.length === 0) {
      bar.classList.add('hidden');
      container.innerHTML = '';
      return;
    }

    bar.classList.remove('hidden');
    container.innerHTML = tags.map(t => `
      <span class="filter-tag">
        ${escapeHtml(t.label)}
        <button class="filter-tag-remove" data-key="${t.key}" aria-label="Remove filter">&times;</button>
      </span>
    `).join('');

    container.querySelectorAll('.filter-tag-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const k = btn.dataset.key;
        if (k === 'category') {
          state.filters.category = 'ALL';
          const sel = document.getElementById('category-filter');
          if (sel) sel.value = 'ALL';
        } else if (k === 'dateScope') {
          state.filters.dateScope = 'SELECTED_MONTH';
          const sel = document.getElementById('date-scope-filter');
          if (sel) sel.value = 'SELECTED_MONTH';
          document.getElementById('custom-date-range-row')?.classList.add('hidden');
        } else if (k === 'search') {
          state.filters.searchQuery = '';
          const inp = document.getElementById('search-input');
          if (inp) inp.value = '';
          document.getElementById('clear-search-btn')?.classList.add('hidden');
        }
        renderExpensesList();
        renderActiveFilterBadges();
      });
    });
  }

  // --- Modal Operations ---
  function openAddExpenseModal() {
    state.editingExpenseId = null;
    const modal = document.getElementById('expense-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('expense-form');
    
    if (modalTitle) modalTitle.textContent = 'Add New Expense';
    if (form) form.reset();

    const idInput = document.getElementById('expense-id-input');
    const dateInput = document.getElementById('expense-date-input');
    const categorySelect = document.getElementById('expense-category-select');

    if (idInput) idInput.value = '';
    
    // Default date to today or selected month's 1st if viewing a past month
    const today = getTodayString();
    if (state.selectedMonth === getCurrentMonthString()) {
      if (dateInput) dateInput.value = today;
    } else {
      if (dateInput) dateInput.value = `${state.selectedMonth}-01`;
    }

    clearFormErrors();
    updateSelectedChip();
    if (modal) modal.classList.remove('hidden');
    document.getElementById('expense-amount-input')?.focus();
  }

  function openEditExpenseModal(id) {
    const expense = state.expenses.find(e => e.id === id);
    if (!expense) return;

    state.editingExpenseId = id;
    const modal = document.getElementById('expense-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (modalTitle) modalTitle.textContent = 'Edit Expense';

    const idInput = document.getElementById('expense-id-input');
    const amountInput = document.getElementById('expense-amount-input');
    const categorySelect = document.getElementById('expense-category-select');
    const dateInput = document.getElementById('expense-date-input');
    const noteInput = document.getElementById('expense-note-input');

    if (idInput) idInput.value = expense.id;
    if (amountInput) amountInput.value = expense.amount;
    if (categorySelect) categorySelect.value = expense.category;
    if (dateInput) dateInput.value = expense.date;
    if (noteInput) noteInput.value = expense.note || '';

    clearFormErrors();
    updateSelectedChip();
    if (modal) modal.classList.remove('hidden');
    if (amountInput) amountInput.focus();
  }

  function closeExpenseModal() {
    const modal = document.getElementById('expense-modal');
    if (modal) modal.classList.add('hidden');
    state.editingExpenseId = null;
    clearFormErrors();
  }

  function clearFormErrors() {
    document.getElementById('amount-error').textContent = '';
    document.getElementById('category-error').textContent = '';
    document.getElementById('date-error').textContent = '';
  }

  function handleExpenseFormSubmit(e) {
    e.preventDefault();
    clearFormErrors();

    const amountInput = document.getElementById('expense-amount-input');
    const categorySelect = document.getElementById('expense-category-select');
    const dateInput = document.getElementById('expense-date-input');
    const noteInput = document.getElementById('expense-note-input');

    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value.trim();
    const date = dateInput.value;
    const note = noteInput.value.trim();

    let hasError = false;

    if (isNaN(amount) || amount <= 0) {
      document.getElementById('amount-error').textContent = 'Please enter a valid amount greater than 0';
      hasError = true;
    }

    if (!category) {
      document.getElementById('category-error').textContent = 'Please select a category';
      hasError = true;
    }

    if (!date) {
      document.getElementById('date-error').textContent = 'Please select a date';
      hasError = true;
    }

    if (hasError) return;

    if (state.editingExpenseId) {
      // Update existing expense
      const index = state.expenses.findIndex(e => e.id === state.editingExpenseId);
      if (index !== -1) {
        state.expenses[index] = {
          ...state.expenses[index],
          amount: parseFloat(amount.toFixed(2)),
          category,
          date,
          note,
          updatedAt: new Date().toISOString()
        };
        saveExpensesToStorage();
        showToast('Expense updated successfully!', 'success');
      }
    } else {
      // Add new expense
      const newExpense = {
        id: generateUniqueId(),
        amount: parseFloat(amount.toFixed(2)),
        category,
        date,
        note,
        createdAt: new Date().toISOString()
      };
      state.expenses.unshift(newExpense);
      saveExpensesToStorage();

      // If user adds an expense for a different month, optionally stay or jump
      const expenseMonth = date.substring(0, 7);
      if (state.selectedMonth !== expenseMonth) {
        state.selectedMonth = expenseMonth;
      }
      showToast('Expense added successfully!', 'success');
    }

    closeExpenseModal();
    renderAll();
  }

  // --- Deletion and Undo Handling ---
  function confirmDeleteExpense(id) {
    state.pendingDeleteId = id;
    const confirmModal = document.getElementById('confirm-modal');
    const message = document.getElementById('confirm-message');
    const expense = state.expenses.find(e => e.id === id);

    if (message && expense) {
      message.textContent = `Are you sure you want to delete this expense of ${formatCurrency(expense.amount)} for "${expense.category}"?`;
    }

    if (confirmModal) confirmModal.classList.remove('hidden');
  }

  function executeDeleteExpense() {
    if (!state.pendingDeleteId) return;

    const id = state.pendingDeleteId;
    const itemIndex = state.expenses.findIndex(e => e.id === id);

    if (itemIndex !== -1) {
      state.lastDeletedItem = { item: state.expenses[itemIndex], index: itemIndex };
      state.expenses.splice(itemIndex, 1);
      saveExpensesToStorage();
      renderAll();

      showToast('Expense deleted', 'info', {
        actionText: 'Undo',
        onAction: undoDeleteExpense
      });
    }

    state.pendingDeleteId = null;
    document.getElementById('confirm-modal')?.classList.add('hidden');
  }

  function undoDeleteExpense() {
    if (state.lastDeletedItem) {
      state.expenses.splice(state.lastDeletedItem.index, 0, state.lastDeletedItem.item);
      saveExpensesToStorage();
      renderAll();
      showToast('Deletion undone', 'success');
      state.lastDeletedItem = null;
    }
  }

  // --- Toast Notifications ---
  function showToast(message, type = 'info', actionConfig = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let actionBtnHtml = '';
    if (actionConfig && actionConfig.actionText) {
      actionBtnHtml = `<button type="button" class="toast-action-btn">${actionConfig.actionText}</button>`;
    }

    toast.innerHTML = `
      <div class="toast-content">
        <span>${escapeHtml(message)}</span>
      </div>
      ${actionBtnHtml}
    `;

    if (actionConfig && actionConfig.onAction) {
      const btn = toast.querySelector('.toast-action-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          actionConfig.onAction();
          toast.remove();
        });
      }
    }

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --- Month Stepper Navigation ---
  function stepMonth(direction) {
    // direction: +1 or -1
    const [year, month] = state.selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 1 + direction, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    state.selectedMonth = `${y}-${m}`;
    renderAll();
  }

  // --- Category Modal & Creation ---
  function handleAddCustomCategory(e) {
    e.preventDefault();
    const nameInput = document.getElementById('cat-name-input');
    const colorInput = document.getElementById('cat-color-picker');
    const errorEl = document.getElementById('cat-create-error');

    const name = nameInput.value.trim();
    const color = colorInput.value;

    if (!name) {
      if (errorEl) errorEl.textContent = 'Please enter a category name';
      return;
    }

    if (state.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
      if (errorEl) errorEl.textContent = 'Category with this name already exists';
      return;
    }

    const newCategory = {
      id: 'cat-custom-' + Date.now().toString(36),
      name: name,
      color: color,
      icon: '🏷️',
      isCustom: true
    };

    state.categories.push(newCategory);
    saveCategoriesToStorage();
    renderAll();

    nameInput.value = '';
    if (errorEl) errorEl.textContent = '';
    showToast(`Category "${name}" created!`, 'success');

    // Preselect in add modal if open
    const expCatSelect = document.getElementById('expense-category-select');
    if (expCatSelect) expCatSelect.value = name;
  }

  // --- Export & Import ---
  function exportToCSV() {
    if (state.expenses.length === 0) {
      showToast('No expenses available to export', 'info');
      return;
    }

    const headers = ['ID', 'Date', 'Category', 'Amount', 'Currency', 'Note'];
    const rows = state.expenses.map(e => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${e.category}"`,
      e.amount,
      `"${state.currency}"`,
      `"${(e.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, `SpendWise_Expenses_${getTodayString()}.csv`, 'text/csv;charset=utf-8;');
    showToast('Exported to CSV successfully!', 'success');
  }

  function exportToJSON() {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      currency: state.currency,
      categories: state.categories,
      expenses: state.expenses
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    downloadFile(jsonStr, `SpendWise_Backup_${getTodayString()}.json`, 'application/json');
    showToast('Backup downloaded successfully!', 'success');
  }

  function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importFromJSON(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const data = JSON.parse(e.target.result);
        if (Array.isArray(data.expenses)) {
          state.expenses = data.expenses;
          if (Array.isArray(data.categories)) state.categories = data.categories;
          if (data.currency) state.currency = data.currency;

          saveExpensesToStorage();
          saveCategoriesToStorage();
          saveCurrencyToStorage();
          renderAll();
          showToast(`Restored ${data.expenses.length} expenses successfully!`, 'success');
        } else {
          showToast('Invalid backup file format', 'danger');
        }
      } catch (err) {
        console.error(err);
        showToast('Error parsing JSON backup file', 'danger');
      }
    };
    reader.readAsText(file);
  }

  // --- Reset & Sample Data ---
  function loadSampleDataAction() {
    if (confirm('Load realistic sample data? This will merge with your existing transactions.')) {
      const sample = getSampleData();
      state.expenses = [...sample, ...state.expenses];
      saveExpensesToStorage();
      renderAll();
      showToast('Sample expenses loaded successfully!', 'success');
    }
  }

  function resetAllDataAction() {
    if (confirm('⚠️ WARNING: This will permanently erase all your expense history and custom categories. Are you sure?')) {
      state.expenses = [];
      state.categories = [...DEFAULT_CATEGORIES];
      saveExpensesToStorage();
      saveCategoriesToStorage();
      renderAll();
      showToast('All expense data has been reset', 'info');
    }
  }

  // --- Initialize Event Listeners ---
  function initEventListeners() {
    // 1. Theme toggle
    document.getElementById('theme-toggle-btn')?.addEventListener('click', () => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      saveThemeToStorage();
      updateThemeUI();
      renderCharts();
    });

    // 2. Currency Selector
    document.getElementById('currency-select')?.addEventListener('change', e => {
      state.currency = e.target.value;
      saveCurrencyToStorage();
      renderAll();
    });

    // 3. Month Steppers & Picker
    document.getElementById('prev-month-btn')?.addEventListener('click', () => stepMonth(-1));
    document.getElementById('next-month-btn')?.addEventListener('click', () => stepMonth(1));
    document.getElementById('this-month-jump-btn')?.addEventListener('click', () => {
      state.selectedMonth = getCurrentMonthString();
      renderAll();
    });

    document.getElementById('month-picker-input')?.addEventListener('change', e => {
      if (e.target.value) {
        state.selectedMonth = e.target.value;
        renderAll();
      }
    });

    // 4. Modal Open/Close
    document.getElementById('open-add-modal-btn')?.addEventListener('click', openAddExpenseModal);
    document.getElementById('fab-add-expense')?.addEventListener('click', openAddExpenseModal);
    document.getElementById('empty-state-add-btn')?.addEventListener('click', openAddExpenseModal);
    document.getElementById('close-modal-btn')?.addEventListener('click', closeExpenseModal);
    document.getElementById('cancel-modal-btn')?.addEventListener('click', closeExpenseModal);

    // Close modals on clicking backdrop
    window.addEventListener('click', e => {
      if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
      }
    });

    // 5. Expense Form
    document.getElementById('expense-form')?.addEventListener('submit', handleExpenseFormSubmit);
    document.getElementById('expense-category-select')?.addEventListener('change', updateSelectedChip);

    // 6. Category Manager Modal
    const catModal = document.getElementById('category-modal');
    document.getElementById('manage-categories-btn')?.addEventListener('click', () => {
      catModal?.classList.remove('hidden');
    });
    document.getElementById('quick-create-cat-btn')?.addEventListener('click', () => {
      catModal?.classList.remove('hidden');
    });
    document.getElementById('close-cat-modal-btn')?.addEventListener('click', () => {
      catModal?.classList.add('hidden');
    });
    document.getElementById('new-category-form')?.addEventListener('submit', handleAddCustomCategory);

    // 7. Delete Confirmation Modal
    document.getElementById('proceed-confirm-btn')?.addEventListener('click', executeDeleteExpense);
    document.getElementById('cancel-confirm-btn')?.addEventListener('click', () => {
      document.getElementById('confirm-modal')?.classList.add('hidden');
      state.pendingDeleteId = null;
    });
    document.getElementById('close-confirm-btn')?.addEventListener('click', () => {
      document.getElementById('confirm-modal')?.classList.add('hidden');
      state.pendingDeleteId = null;
    });

    // 8. Filters & Search
    document.getElementById('search-input')?.addEventListener('input', e => {
      state.filters.searchQuery = e.target.value;
      const clearBtn = document.getElementById('clear-search-btn');
      if (clearBtn) clearBtn.classList.toggle('hidden', !e.target.value);
      renderExpensesList();
      renderActiveFilterBadges();
    });

    document.getElementById('clear-search-btn')?.addEventListener('click', () => {
      const inp = document.getElementById('search-input');
      if (inp) inp.value = '';
      state.filters.searchQuery = '';
      document.getElementById('clear-search-btn')?.classList.add('hidden');
      renderExpensesList();
      renderActiveFilterBadges();
    });

    document.getElementById('category-filter')?.addEventListener('change', e => {
      state.filters.category = e.target.value;
      renderExpensesList();
      renderActiveFilterBadges();
    });

    document.getElementById('date-scope-filter')?.addEventListener('change', e => {
      state.filters.dateScope = e.target.value;
      const customRow = document.getElementById('custom-date-range-row');
      if (customRow) customRow.classList.toggle('hidden', e.target.value !== 'CUSTOM');
      renderExpensesList();
      renderActiveFilterBadges();
    });

    document.getElementById('apply-custom-range-btn')?.addEventListener('click', () => {
      state.filters.customStart = document.getElementById('custom-date-start')?.value || '';
      state.filters.customEnd = document.getElementById('custom-date-end')?.value || '';
      renderExpensesList();
      renderActiveFilterBadges();
    });

    document.getElementById('sort-order-select')?.addEventListener('change', e => {
      state.filters.sortOrder = e.target.value;
      renderExpensesList();
    });

    document.getElementById('clear-all-filters-btn')?.addEventListener('click', () => {
      state.filters.category = 'ALL';
      state.filters.dateScope = 'SELECTED_MONTH';
      state.filters.searchQuery = '';
      state.filters.customStart = '';
      state.filters.customEnd = '';

      document.getElementById('category-filter').value = 'ALL';
      document.getElementById('date-scope-filter').value = 'SELECTED_MONTH';
      document.getElementById('search-input').value = '';
      document.getElementById('clear-search-btn').classList.add('hidden');
      document.getElementById('custom-date-range-row').classList.add('hidden');

      renderExpensesList();
      renderActiveFilterBadges();
    });

    // 9. Chart View Toggle (Donut / Bar)
    const viewPieBtn = document.getElementById('view-pie-btn');
    const viewBarBtn = document.getElementById('view-bar-btn');

    viewPieBtn?.addEventListener('click', () => {
      state.categoryChartView = 'pie';
      viewPieBtn.classList.add('active');
      viewBarBtn?.classList.remove('active');
      renderCategoryBreakdownChart();
    });

    viewBarBtn?.addEventListener('click', () => {
      state.categoryChartView = 'bar';
      viewBarBtn.classList.add('active');
      viewPieBtn?.classList.remove('active');
      renderCategoryBreakdownChart();
    });

    // 10. Data Dropdown Menu
    const dataBtn = document.getElementById('data-options-btn');
    const dataDropdown = dataBtn?.closest('.dropdown');

    dataBtn?.addEventListener('click', e => {
      e.stopPropagation();
      dataDropdown?.classList.toggle('open');
    });

    window.addEventListener('click', () => {
      dataDropdown?.classList.remove('open');
    });

    document.getElementById('export-csv-btn')?.addEventListener('click', exportToCSV);
    document.getElementById('export-json-btn')?.addEventListener('click', exportToJSON);
    document.getElementById('import-json-input')?.addEventListener('change', e => {
      if (e.target.files && e.target.files[0]) {
        importFromJSON(e.target.files[0]);
        e.target.value = '';
      }
    });
    document.getElementById('load-sample-btn')?.addEventListener('click', loadSampleDataAction);
    document.getElementById('clear-all-data-btn')?.addEventListener('click', resetAllDataAction);

    // Keyboard Shortcuts (Esc to close modals)
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.add('hidden'));
      }
    });
  }

  // --- Application Bootstrap ---
  function initApp() {
    loadStateFromStorage();
    initEventListeners();
    renderAll();
  }

  // Start app on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
