/**
 * app.js - Main Application Controller
 * Implements the reactive render cycle, week navigation calendar mathematics,
 * interactive widgets (Quiet Time Timer, Journaling), CRUD forms, and accessibility hooks.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Database
  const db = new KeystoneDB();

  // State Management
  let currentWeekStart = getMonday(new Date()); // The Monday of the currently viewed week
  let selectedDate = new Date(); // The date selected for details (checklist & journal), defaults to today
  selectedDate.setHours(0,0,0,0);
  
  // Timer State
  let timerInterval = null;
  let timerSecondsLeft = 600; // 10 minutes default
  const timerTotalSeconds = 600;

  // Cache DOM Elements
  const headerDateIndicator = document.getElementById('header-date-indicator');
  const navMonthYear = document.getElementById('nav-month-year');
  const btnPrevWeek = document.getElementById('btn-prev-week');
  const btnNextWeek = document.getElementById('btn-next-week');
  const btnCurrentWeek = document.getElementById('btn-current-week');
  
  const habitTableBody = document.getElementById('habit-table-body');
  const tableHeaderRow = document.getElementById('table-header-row');
  const gridTableWrapper = document.getElementById('grid-table-wrapper');
  const gridEmptyState = document.getElementById('grid-empty-state');
  
  const favHabitName = document.getElementById('fav-habit-name');
  const favHabitRate = document.getElementById('fav-habit-rate');
  const favHabitChart = document.getElementById('fav-habit-chart');
  const trendBarChart = document.getElementById('trend-bar-chart');
  
  const dailyChecklistDate = document.getElementById('daily-checklist-date');
  const checklistItems = document.getElementById('checklist-items');
  const journalInput = document.getElementById('journal-input');
  const btnSaveJournal = document.getElementById('btn-save-journal');
  const journalSaveStatus = document.getElementById('journal-save-status');

  const btnSidebarAddHabit = document.getElementById('btn-sidebar-add-habit');
  const btnEmptyAddHabit = document.getElementById('btn-empty-add-habit');
  
  // Modal Elements
  const habitModal = document.getElementById('habit-modal');
  const habitForm = document.getElementById('habit-form');
  const modalTitle = document.getElementById('modal-title');
  const modalHabitId = document.getElementById('modal-habit-id');
  const habitNameInput = document.getElementById('habit-name-input');
  const btnModalClose = document.getElementById('btn-modal-close');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  
  // Timer Elements
  const timerDisplay = document.getElementById('timer-display');
  const timerStatus = document.getElementById('timer-status');
  const btnTimerToggle = document.getElementById('btn-timer-toggle');
  const btnTimerReset = document.getElementById('btn-timer-reset');
  const timerProgress = document.getElementById('timer-progress');

  // Search Input
  const searchInput = document.getElementById('search-input');

  // --- Date Arithmetic Helper Pipelines ---

  /**
   * Returns a new Date set to the Monday of the week containing the given date.
   * Matches ISO 8601 calendar format.
   */
  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    // Sunday is 0, Monday is 1... in JS.
    // If Sunday, we want to go back 6 days to Monday.
    // Otherwise, we go back to Monday (day - 1).
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  /**
   * Returns an array of 7 consecutive dates starting from the given Monday.
   */
  function getWeekDates(monday) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push(d);
    }
    return dates;
  }

  /**
   * Formats Date object to human-friendly format (e.g. Thursday, May 21, 2026)
   */
  function formatHumanDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formats a date range or month header representing a week.
   * Handles split-month boundaries elegantly (e.g., "May - Jun 2026")
   */
  function formatWeekHeader(weekDates) {
    const first = weekDates[0];
    const last = weekDates[6];
    
    const firstMonth = first.toLocaleDateString('en-US', { month: 'long' });
    const lastMonth = last.toLocaleDateString('en-US', { month: 'long' });
    const firstYear = first.getFullYear();
    const lastYear = last.getFullYear();

    if (firstYear !== lastYear) {
      return `${firstMonth}, ${firstYear} - ${lastMonth}, ${lastYear}`;
    }
    if (firstMonth !== lastMonth) {
      return `${firstMonth} - ${lastMonth}, ${firstYear}`;
    }
    return `${firstMonth}, ${firstYear}`;
  }

  // --- UI RENDER ENGINE (REACTIVE CYCLE) ---

  function render() {
    const habits = db.getHabits();
    const completions = db.getCompletions();
    const weekDates = getWeekDates(currentWeekStart);
    const searchQuery = searchInput.value.toLowerCase().trim();

    // Filter habits based on search query
    const filteredHabits = habits.filter(habit => 
      habit.name.toLowerCase().includes(searchQuery)
    );

    // 1. Render Top Header & Navigation
    headerDateIndicator.textContent = formatHumanDate(new Date());
    navMonthYear.textContent = formatWeekHeader(weekDates);
    dailyChecklistDate.textContent = formatHumanDate(selectedDate);

    // 2. Manage Empty State vs. Table View
    if (habits.length === 0) {
      gridEmptyState.classList.remove('hidden');
      gridTableWrapper.classList.add('hidden');
    } else {
      gridEmptyState.classList.add('hidden');
      gridTableWrapper.classList.remove('hidden');
      renderGridTable(filteredHabits, weekDates);
    }

    // 3. Render Dashboard Data Analytics Widgets
    renderAnalytics(habits, weekDates);

    // 4. Render Right Panel Sidebar Widgets
    renderDailyChecklist(habits);
    renderJournal();
  }

  /**
   * Renders the main 7-day habit checklist grid table
   */
  function renderGridTable(habits, weekDates) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = db.formatDate(today);

    // Render Table Header (Days names + calendar numbers)
    // Clear previous headers except column 1 (Habit Name) and last (Streak)
    const headerRowHtml = ['<th class="col-habit-name">Habits</th>'];
    
    weekDates.forEach(date => {
      const isToday = db.formatDate(date) === todayStr;
      const isSelected = db.formatDate(date) === db.formatDate(selectedDate);
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = date.getDate();
      
      let thClass = 'col-day';
      if (isToday) thClass += ' today-col';
      if (isSelected) thClass += ' selected-col'; // We can styled this in CSS if wanted

      headerRowHtml.push(`
        <th class="${thClass}" data-date="${db.formatDate(date)}" style="cursor: pointer;" title="Click to view details for this day">
          <div class="th-day-label">${dayLabel}</div>
          <div class="th-day-num">${dayNum}</div>
        </th>
      `);
    });
    headerRowHtml.push('<th class="col-streak">Streak</th>');
    tableHeaderRow.innerHTML = headerRowHtml.join('');

    // Wire up header clicks to change active selected day for journaling & checklists
    tableHeaderRow.querySelectorAll('th.col-day').forEach(th => {
      th.addEventListener('click', () => {
        selectedDate = new Date(th.dataset.date);
        render();
      });
    });

    // Render Table Rows
    if (habits.length === 0) {
      habitTableBody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 40px;">
            No habits matched your search query.
          </td>
        </tr>
      `;
      return;
    }

    let rowsHtml = '';
    habits.forEach(habit => {
      const streak = db.getStreak(habit.id);
      
      let rowCells = `
        <td class="habit-name-cell">
          <div class="habit-meta">
            <span class="habit-title" title="${escapeHtml(habit.name)}">${escapeHtml(habit.name)}</span>
            <div class="habit-actions">
              <button class="btn-action btn-edit" data-id="${habit.id}" aria-label="Rename habit">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button class="btn-action btn-delete" data-id="${habit.id}" aria-label="Delete habit">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
        </td>
      `;

      weekDates.forEach(date => {
        const dateStr = db.formatDate(date);
        const isCompleted = db.isCompleted(habit.id, dateStr);
        const isToday = dateStr === todayStr;
        const isFuture = date > today;
        
        let cellClass = 'td-day-check';
        if (isToday) cellClass += ' today-col';

        // Accessibility tags
        const ariaChecked = isCompleted ? 'true' : 'false';
        const buttonDisabled = isFuture ? 'disabled' : '';
        const titleText = isFuture ? 'Cannot tick future habits' : `Toggle ${habit.name} for ${dateStr}`;

        rowCells += `
          <td class="${cellClass}">
            <button 
              class="habit-checkbox ${isCompleted ? 'checked' : ''}" 
              data-habit-id="${habit.id}" 
              data-date="${dateStr}"
              role="checkbox"
              aria-checked="${ariaChecked}"
              ${buttonDisabled}
              title="${titleText}"
            >
              <svg viewBox="0 0 24 24">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          </td>
        `;
      });

      // Streak flame element
      const streakFlameColor = streak > 0 ? 'var(--accent-secondary)' : 'var(--text-tertiary)';
      const streakPulseClass = streak >= 5 ? 'streak-fire-pulse' : ''; // Style highly active streaks

      rowCells += `
        <td class="col-streak">
          <div class="streak-cell-content" style="color: ${streakFlameColor};">
            <svg class="streak-icon ${streakPulseClass}" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M12 2c0 0-4.5 3.5-4.5 7.5S10 17 12 17s4.5-3.5 4.5-7.5S12 2 12 2zm0 13c-1.38 0-2.5-1.12-2.5-2.5S10.62 10 12 10s2.5 1.12 2.5 2.5S13.38 15 12 15z"/>
            </svg>
            <span class="streak-num">${streak}</span>
          </div>
        </td>
      `;

      rowsHtml += `<tr>${rowCells}</tr>`;
    });

    habitTableBody.innerHTML = rowsHtml;

    // Bind Toggle events
    habitTableBody.querySelectorAll('.habit-checkbox').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const habitId = btn.dataset.habitId;
        const dateStr = btn.dataset.date;
        
        // Performance-safe state toggle
        db.toggleCompletion(habitId, dateStr);
        render(); // Full react re-render
      });
    });

    // Bind Edit/Rename buttons
    habitTableBody.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const habitId = btn.dataset.id;
        openHabitModal(habitId);
      });
    });

    // Bind Delete buttons
    habitTableBody.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const habitId = btn.dataset.id;
        const habit = db.getHabits().find(h => h.id === habitId);
        
        if (confirm(`Are you sure you want to delete the habit "${habit.name}"? This removes all historical completions.`)) {
          db.deleteHabit(habitId);
          render();
        }
      });
    });
  }

  /**
   * Renders the clean Data Analytics graphs and metrics
   */
  function renderAnalytics(habits, weekDates) {
    // 1. Favorite Habit Widget
    const fav = db.getFavoriteHabit();
    if (fav) {
      favHabitName.textContent = fav.name;
      favHabitRate.textContent = `${fav.ratePercent}%`;
    } else {
      favHabitName.textContent = '—';
      favHabitRate.textContent = '0%';
    }

    // Render Favorite Habit comparative bar chart
    if (habits.length === 0) {
      favHabitChart.innerHTML = `<div style="text-align:center; color:var(--text-tertiary); font-size:0.8rem; padding: 20px 0;">Add habits to show analytics.</div>`;
    } else {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const chartRowsHtml = habits.map(habit => {
        const createdDate = new Date(habit.createdAt);
        createdDate.setHours(0,0,0,0);
        
        const diffTime = Math.abs(today - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        let completedCount = 0;
        const completions = db.getCompletions();
        for (const key in completions) {
          if (key.startsWith(`${habit.id}:`) && completions[key] === true) {
            completedCount++;
          }
        }
        
        const rate = diffDays > 0 ? (completedCount / diffDays) : 0;
        const ratePercent = Math.round(rate * 100);

        return `
          <div class="chart-row">
            <span class="chart-habit-label" title="${escapeHtml(habit.name)}">${escapeHtml(habit.name)}</span>
            <div class="chart-bar-bg">
              <div class="chart-bar-fill" style="width: ${ratePercent}%"></div>
            </div>
            <span class="chart-habit-val">${ratePercent}%</span>
          </div>
        `;
      }).join('');
      
      favHabitChart.innerHTML = chartRowsHtml;
    }

    // 2. Weekly Activity Trend Bar Chart
    const weeklyTrends = db.getWeeklyTrend(weekDates);
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = db.formatDate(today);

    const trendBars = trendBarChart.querySelectorAll('.trend-bar-wrapper');
    trendBars.forEach((barWrapper, idx) => {
      const date = weekDates[idx];
      const percent = weeklyTrends[idx];
      const isToday = db.formatDate(date) === todayStr;

      const barElement = barWrapper.querySelector('.trend-bar');
      barElement.style.height = `${percent}%`;
      barElement.title = `${percent}% completed on ${db.formatDate(date)}`;

      if (isToday) {
        barWrapper.classList.add('today-bar');
      } else {
        barWrapper.classList.remove('today-bar');
      }
    });
  }

  /**
   * Renders the daily task checklist on the right sidebar
   */
  function renderDailyChecklist(habits) {
    const dateStr = db.formatDate(selectedDate);
    
    if (habits.length === 0) {
      checklistItems.innerHTML = `<div style="text-align:center; color:var(--text-tertiary); font-size:0.85rem; padding: 20px 0;">No habits available today.</div>`;
      return;
    }

    let itemsHtml = '';
    habits.forEach(habit => {
      const isCompleted = db.isCompleted(habit.id, dateStr);
      const isToday = db.formatDate(new Date()) === dateStr;
      
      itemsHtml += `
        <div class="checklist-item ${isCompleted ? 'done' : ''}" style="cursor: pointer;" data-habit-id="${habit.id}">
          <div class="checklist-status-indicator"></div>
          <span style="flex: 1;">${escapeHtml(habit.name)}</span>
          <span style="font-size:0.75rem; color:var(--text-tertiary); font-weight:600;">
            ${isCompleted ? 'Done' : 'Pending'}
          </span>
        </div>
      `;
    });

    checklistItems.innerHTML = itemsHtml;

    // Bind checklist item toggles
    checklistItems.querySelectorAll('.checklist-item').forEach(item => {
      item.addEventListener('click', () => {
        const habitId = item.dataset.habitId;
        const isFuture = selectedDate > new Date();
        
        if (isFuture) {
          alert('Cannot complete habits on a future date!');
          return;
        }

        db.toggleCompletion(habitId, dateStr);
        render();
      });
    });
  }

  /**
   * Renders the journaling reflecting text area
   */
  function renderJournal() {
    const dateStr = db.formatDate(selectedDate);
    const entry = db.getJournalEntry(dateStr);
    journalInput.value = entry;
    journalSaveStatus.textContent = entry ? 'Saved locally' : 'No entry for this day';
    journalSaveStatus.classList.remove('saving');
  }

  // --- INTERACTIVE EVENT HANDLERS ---

  // Week Navigation Events
  btnPrevWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    render();
  });

  btnNextWeek.addEventListener('click', () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    render();
  });

  btnCurrentWeek.addEventListener('click', () => {
    currentWeekStart = getMonday(new Date());
    selectedDate = new Date();
    selectedDate.setHours(0,0,0,0);
    render();
  });

  // Search input event
  searchInput.addEventListener('input', () => {
    render();
  });

  // Journaling Save Event
  btnSaveJournal.addEventListener('click', () => {
    const dateStr = db.formatDate(selectedDate);
    const text = journalInput.value;

    journalSaveStatus.textContent = 'Saving...';
    journalSaveStatus.classList.add('saving');

    setTimeout(() => {
      db.saveJournalEntry(dateStr, text);
      renderJournal();
    }, 400); // Tiny artificial delay to feel premium and satisfying!
  });

  // Modal Control Actions
  function openHabitModal(habitId = null) {
    habitModal.classList.remove('hidden');
    habitModal.setAttribute('aria-hidden', 'false');
    habitNameInput.focus();

    if (habitId) {
      // Edit mode
      const habit = db.getHabits().find(h => h.id === habitId);
      modalTitle.textContent = 'Rename Habit';
      modalHabitId.value = habitId;
      habitNameInput.value = habit.name;
    } else {
      // Add mode
      modalTitle.textContent = 'Add New Habit';
      modalHabitId.value = '';
      habitNameInput.value = '';
    }
  }

  function closeHabitModal() {
    habitModal.classList.add('hidden');
    habitModal.setAttribute('aria-hidden', 'true');
  }

  btnSidebarAddHabit.addEventListener('click', () => openHabitModal());
  btnEmptyAddHabit.addEventListener('click', () => openHabitModal());
  btnModalClose.addEventListener('click', closeHabitModal);
  btnModalCancel.addEventListener('click', closeHabitModal);

  // Close modal when clicking overlay background
  habitModal.addEventListener('click', (e) => {
    if (e.target === habitModal) closeHabitModal();
  });

  // Form Submit Action (Save/Rename Habit)
  habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const habitId = modalHabitId.value;
    const name = habitNameInput.value.trim();

    if (habitId) {
      db.renameHabit(habitId, name);
    } else {
      db.addHabit(name);
    }

    closeHabitModal();
    render();
  });

  // --- BREATHING FOCUS TIMER WIDGET STATE MACHINE ---

  function updateTimerDisplay() {
    const mins = Math.floor(timerSecondsLeft / 60);
    const secs = timerSecondsLeft % 60;
    timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    // Update visual progress stroke-dashoffset (0 to 100)
    const progressPercent = (timerSecondsLeft / timerTotalSeconds) * 100;
    timerProgress.style.strokeDashoffset = 100 - progressPercent;
  }

  function startTimer() {
    if (timerInterval) return;

    timerStatus.textContent = 'Breathing...';
    timerStatus.style.color = 'var(--accent-primary)';
    timerStatus.style.backgroundColor = 'var(--accent-primary-light)';
    btnTimerToggle.textContent = 'Pause';
    btnTimerToggle.classList.replace('btn-secondary', 'btn-primary');

    timerInterval = setInterval(() => {
      if (timerSecondsLeft > 0) {
        timerSecondsLeft--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        timerSecondsLeft = 600; // Reset
        
        timerStatus.textContent = 'Done!';
        timerStatus.style.color = 'var(--accent-secondary)';
        timerStatus.style.backgroundColor = 'var(--accent-secondary-light)';
        btnTimerToggle.textContent = 'Start Session';
        btnTimerToggle.classList.replace('btn-primary', 'btn-secondary');
        
        alert('Mindful Quiet Time completed! Take a deep breath and keep building.');
        updateTimerDisplay();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!timerInterval) return;
    clearInterval(timerInterval);
    timerInterval = null;
    
    timerStatus.textContent = 'Paused';
    timerStatus.style.color = 'var(--accent-yellow)';
    timerStatus.style.backgroundColor = 'var(--accent-yellow-light)';
    btnTimerToggle.textContent = 'Resume';
    btnTimerToggle.classList.replace('btn-primary', 'btn-secondary');
  }

  btnTimerToggle.addEventListener('click', () => {
    if (timerInterval) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  btnTimerReset.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSecondsLeft = 600;
    
    timerStatus.textContent = 'Breathing space';
    timerStatus.style.color = 'var(--accent-blue)';
    timerStatus.style.backgroundColor = 'var(--accent-blue-light)';
    btnTimerToggle.textContent = 'Start Session';
    btnTimerToggle.classList.remove('btn-primary');
    btnTimerToggle.classList.add('btn-secondary');
    
    updateTimerDisplay();
  });

  // --- ACCESSIBILITY KEYBOARD NAVIGATION WIRING ---
  
  // Close modal with Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !habitModal.classList.contains('hidden')) {
      closeHabitModal();
    }
  });

  // --- GENERAL UTILITY PIPELINES ---
  
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- INITIAL BOOTSTRAP RUN ---
  updateTimerDisplay();
  render();
});
