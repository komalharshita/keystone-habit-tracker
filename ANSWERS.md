# Fellowship Frontend Assessment Answers: Keystone Habit Tracker

This document provides detailed answers to the five fellowship evaluation questions, framed from the perspective of a **Data Engineering** track candidate.

---

### 1. How to Run

#### Local Setup (Fresh Machine)
Since this project was built using a clean, dependency-free **Vanilla HTML5, CSS3, and ES6 Javascript** stack, running the application requires **zero npm installation or build steps**. This ensures 100% execution reliability.

1. **Clone the Repository**:
   ```bash
   git clone <your-repository-url>
   cd keystone-habit-tracker
   ```
2. **Launch the App**:
   - **Option A (Recommended)**: If you have VS Code, right-click `index.html` and select **"Open with Live Server"**.
   - **Option B (Python HTTP Server)**: Run the following command in your terminal and visit `http://localhost:8000`:
     ```bash
     python -m http.server 8000
     ```
   - **Option C (Direct File Access)**: Simply double-click `index.html` to open it directly in any modern web browser.

#### Deployed URL
The project is deployed and live at:
🔗 **[Deploy URL to be filled here, e.g., https://komal.github.io/keystone-habit-tracker/]**

---

### 2. Stack & Design Choices

#### Why this Stack?
As a **Data Engineering** candidate, my architectural philosophy values **simplicity, performance, and deterministic behavior**. I selected pure **Vanilla HTML, CSS, and JS (Zero Dependencies)** over frameworks like React or Vue for three major reasons:
1. **Zero Runtime Overhead**: The app runs natively, instantly compiling in the browser with no build pipelines, bundle bloat, or package vulnerability risks.
2. **Explicit State Control**: Managing state with native ES6 classes allows me to write clean, transparent data transformation pipelines without the reactivity abstractions of external libraries.
3. **Impeccable Portability**: The examiner can open the codebase on a completely fresh machine and it will load flawlessly in milliseconds.

#### Visual/Interaction Decision 1: Data-Centric Insight Widgets (Analytics Row)
- **What it affects**: The bottom analytics row containing the **Favorite Habit** bar graph and **Weekly Activity Trend** bar chart.
- **Why I made it**: A habit tracker’s primary job is to let the user glance at it and immediately understand their progress. Instead of forcing the user to squint at grid checkmarks across different weeks, I aggregated the raw transaction logs into visual summaries. The **Favorite Habit** card calculates the historical completion rate of each habit and displays a custom CSS comparative horizontal chart. The **Weekly Trend** bar chart calculates the aggregate completion rate for each day of the current week. It gives immediate visual feedback on which days of the week are most productive, transforming raw data into actionable insights.

#### Visual/Interaction Decision 2: The Date Selection Contextual Bridge (Grid Header ➔ Sidebar)
- **What it affects**: The calendar table column headers and the entire right-hand sidebar panel (Daily Checklist and Reflective Journal).
- **Why I made it**: To create a mindful digital experience, I wanted to link habit action with journal reflection. In `app.js`, clicking any day's column header in the weekly grid **reactively updates the selected date state** of the entire dashboard. The right-hand panel instantly shifts its context: loading the daily checklist status and the specific "Mindful Journaling" entry for that selected date. This fluid interaction connects habit execution directly with cognitive reflection on a day-by-day basis.

---

### 3. Responsive & Accessibility

#### Responsive Behavior: 360px Mobile vs. 1440px Laptop
- **On a 1440px Laptop**: The app presents a gorgeous, wide three-column layout. The left sidebar handles navigation and a breathing timer; the center panel displays the calendar grid and completion rate charts; the right panel hosts the reflective journal and checklist.
- **On a 360px Phone**: The layout stacks vertically into a single-column scroll. To prevent the 7-day habit grid from squishing and breaking text readability, the table is wrapped in a touch-scrolling container (`overflow-x: auto`) with a sticky habit name column. The user can easily swipe horizontally across the week while the habit labels remain pinned, ensuring a flawless toggle experience on small touch devices.

#### Accessibility Consideration Handled: Native Semantic Keyboard Operability
Every checkbox in the weekly grid is built using a native HTML `<button>` element with custom CSS styling rather than a non-interactive `div` or `span`. 
- **Why it matters**: This guarantees native keyboard tab indexability out of the box. Users can navigate the entire grid using the `Tab` key and toggle completions instantly using the `Space` or `Enter` keys. 
- Furthermore, I implemented custom, high-contrast focus rings (`outline: 2px solid var(--text-primary)`) that respect a clear visual hierarchy for keyboard-only users, and bound active `aria-checked` states and `role="checkbox"` parameters for screen readers.

#### Accessibility Consideration Skipped: Automated Contrast Inversion Toggle
I knowingly skipped implementing an automated "High Contrast / Dyslexia-Friendly" theme switcher widget.
- **Reasoning**: The default design system was constructed from the ground up using a highly curated HSL color palette (soft off-whites, slate text, and deep charcoal) that naturally meets the WCAG AA contrast guidelines (greater than 4.5:1 for body text and 7:1 for headers). Rather than writing redundant theme-inversion JS code, I prioritized building solid data structures and analytics pipelines, relying on the browser's built-in accessibility plugins if a user requires extreme styling overrides.

---

### 4. AI Usage

#### AI Tool & Requests
I pair-programmed with **Antigravity (built on Gemini 3.5 Flash by Google DeepMind)**.
- **Prompt 1**: "Help me plan a single-page habit tracker with a Monday-start calendar grid, weekly navigation, streaks, and LocalStorage persistence, using zero dependencies."
- **Prompt 2**: "Adapt the layout to match a soft, neutral-toned productivity dashboard, incorporating a breathing timer widget, daily checklist, and comparative analytics charts."

#### What I Changed from the AI Output
The AI initially generated a standard habit tracker where completions were stored as an array of dates nested inside each habit object:
```javascript
// AI's Initial Nested State:
const habits = [
  { id: "1", name: "Read", completions: ["2026-05-21", "2026-05-20"] }
];
```
**Why I changed it**: As a data engineer, I recognized that nesting transaction history inside the master metadata object violates database normalization principles. Toggling a date or calculating active streaks would require traversing arrays, which leads to $O(N)$ lookup times that degrade as the history grows.

**My modification**: I decoupled the data into a **fully normalized, relational key-value schema** inside `db.js`.
- Master habits are stored in a flat `habits` table.
- Completions are indexed in a separate flat `completions` object using a composite key: `"${habitId}:${dateStr}" -> true`.
This structural change allows **$O(1)$ constant-time lookup** when checking or toggling completions. Additionally, to keep the local storage footprint minimal, my code explicitly deletes the key when a habit is unchecked, rather than keeping redundant `false` flags in the store.

---

### 5. Honest Gap

#### The Polish Gap: Lack of Time-Series Range Indexing
Although the database properly isolates habit creation dates and completion timestamps, if a user tracks 15 habits daily for five years, the flat `localStorage` completions object will grow linearly. While still lightweight in string bytes, performing complex analytics (like calculating multi-month trends or active streaks) requires iterating over the keys, which would eventually block the main browser thread.

#### The 1-Day Extension Fix
With an extra day, I would replace the `localStorage` key-value wrapper with a local **IndexedDB engine** using a library-free wrapper. I would:
1. Define a structured schema with a composite primary key `[habitId + date]` and a secondary index on `date`.
2. Implement **lazy-loaded window cursors** to fetch completions on a week-by-week basis rather than loading the entire historical log into RAM.
3. Write a background **Web Worker script** to calculate streak counts and completion trends asynchronously, ensuring the UI remains buttery smooth even when dealing with years of historical consistency data.
