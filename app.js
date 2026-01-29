(function () {
  'use strict';

  const STORAGE_KEY = 'proteinDrinkTracker';
  const RESET_HOUR = 2; // 2am local

  /**
   * App "day" = from 2:00 AM to 1:59 AM next calendar day (local).
   * Returns YYYY-MM-DD for the current app day.
   */
  function getDateKey() {
    const now = new Date();
    const hour = now.getHours();
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (hour < RESET_HOUR) {
      date.setDate(date.getDate() - 1);
    }
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { dateKey: null, drank: false };
      const data = JSON.parse(raw);
      return {
        dateKey: data.dateKey || null,
        drank: Boolean(data.drank)
      };
    } catch (_) {
      return { dateKey: null, drank: false };
    }
  }

  function saveState(dateKey, drank) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ dateKey, drank }));
    } catch (_) {}
  }

  function getCurrentDrank() {
    const dateKey = getDateKey();
    const stored = loadState();
    if (stored.dateKey !== dateKey) {
      return false;
    }
    return stored.drank;
  }

  function setDrank(drank) {
    const dateKey = getDateKey();
    saveState(dateKey, drank);
  }

  function toggleDrank() {
    const next = !getCurrentDrank();
    setDrank(next);
    return next;
  }

  function updateUI(drank) {
    const flexed = document.getElementById('arm-flexed');
    const weak = document.getElementById('arm-weak');
    const btn = document.getElementById('toggle-btn');
    const status = document.getElementById('status-text');

    if (flexed) flexed.classList.toggle('hidden', !drank);
    if (weak) weak.classList.toggle('hidden', drank);
    if (btn) {
      btn.setAttribute('aria-pressed', drank ? 'true' : 'false');
      btn.textContent = drank ? "I drank my protein" : "I drank my protein";
    }
    if (status) {
      status.textContent = drank ? 'Protein done for today.' : 'Not yet today.';
    }
  }

  function handleToggle() {
    const drank = toggleDrank();
    updateUI(drank);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  function init() {
    const drank = getCurrentDrank();
    updateUI(drank);

    const btn = document.getElementById('toggle-btn');
    if (btn) {
      btn.addEventListener('click', handleToggle);
    }

    // Optional: re-check dateKey periodically while app is open (e.g. across midnight)
    setInterval(function () {
      const current = getCurrentDrank();
      updateUI(current);
    }, 60000);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
