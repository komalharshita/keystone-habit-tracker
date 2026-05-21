# 🌱 Keystone — Mindful Habit Tracker & Dashboard

A clean, calming, and high-performance single-page habit tracker dashboard designed to foster daily consistency. It features a customizable weekly checklist grid, active streaks calculation, reflective journaling, focus timer, and custom comparative data analytics.

Designed with soft, neutral lifestyle tones to create a more mindful digital consistency experience.

---

## Features

- **Weekly Habit Grid**: View and toggle your habits down the left, across a 7-day Monday-start grid. Today's column is highlighted to anchor focus.
- **Active Streaks**: A user-friendly streak tracker that keeps your momentum alive throughout the day.
- **Relational Local Database**: Normalized `localStorage` schema with $O(1)$ constant-time lookup checks.
- **Daily Checklist**: Track habit completeness on any selected day.
- **Comparative Analytics**:
  - **Favorite Habit**: Dynamic completion metrics showing your highest-performing habit alongside a vertical bar chart.
  - **Weekly Trend**: Dynamic visual column chart showing the completion percentages of each day of the currently viewed week.
- **Breathing Timer (Quiet Time)**: A functional, calming 10-minute focus/breathing timer built straight into the sidebar.
- **Reflective Journaling**: Capture notes and feelings for any selected day to connect habit tracking with mental mindfulness.
- **No-Dependency Stack**: Built with pure vanilla HTML, CSS, and JS, guaranteeing lightning-fast loading speeds and 100% startup reliability.

---

## How to Run Locally

Since this is a vanilla client-side application, **no installation or build steps are required**.

### Option A: Open Directly
Double-click `index.html` in your directory to launch the app directly in your default browser.

### Option B: Local HTTP Server (Recommended)
If you have Python installed, you can launch a lightweight web server to serve the files:

1. Open your terminal in the project directory.
2. Run:
   ```bash
   python -m http.server 8000
   ```
3. Open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 📁 Repository Structure

```
.
├── index.html          # HTML5 semantic structure and layout widgets
├── style.css           # Premium aesthetic styling, custom CSS charts, animations
├── app.js              # State machine, DOM event handlers, focus timer control loop
├── db.js               # Normalized key-value local database controller and analytics pipelines
├── ANSWERS.md          # Official answers to the 5 fellowship assessment questions
└── README.md           # This document
```

---

## Technical Highlights

- **Database Normalization**: Decouples the master habits array from the completion logs. Instead of nesting dates inside habits (which requires $O(N)$ lookup scans), completions are stored flat as composite key lookups (`habitId:dateStr`), enabling instant $O(1)$ checks.
- **Timezone-Safe Dates**: All completion logs and journal entries are stamped using local `YYYY-MM-DD` strings, ensuring consistency even if the user travels across timezones.
- **Self-Cleaning Database**: Unchecking a habit cell automatically purges the corresponding key from the key-value store, preventing the accumulation of redundant `false` values and keeping storage overhead to an absolute minimum.
