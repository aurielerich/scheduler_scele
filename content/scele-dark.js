(function () {
    'use strict';

    if (window.__sceleDarkInjected) return;
    window.__sceleDarkInjected = true;

    const THEME_KEY = 'scele-summary-theme';
    const CLASS = 'scele-dark';

    // Phase 1: apply cached preference synchronously to avoid a flash.
    // localStorage on scele.cs.ui.ac.id is per-origin, separate from the
    // dashboard — we mirror chrome.storage here purely as a sync cache.
    const cached = (() => {
        try { return localStorage.getItem(THEME_KEY); } catch { return null; }
    })();
    applyTheme(cached === 'dark');

    // Phase 2: source of truth lives in chrome.storage.local so the dashboard
    // and SCELE pages share preference. Reconcile once it resolves.
    chrome.storage.local.get(THEME_KEY, (data) => {
        const stored = data && data[THEME_KEY];
        if (stored === 'dark' || stored === 'light') {
            if (stored !== cached) {
                try { localStorage.setItem(THEME_KEY, stored); } catch {}
                applyTheme(stored === 'dark');
            }
        } else if (cached === 'dark' || cached === 'light') {
            // First run on this page — push cached value up so the dashboard sees it.
            chrome.storage.local.set({ [THEME_KEY]: cached });
        }
    });

    // Phase 3: listen for changes from the dashboard or other tabs.
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local' || !changes[THEME_KEY]) return;
        const next = changes[THEME_KEY].newValue;
        if (next !== 'dark' && next !== 'light') return;
        try { localStorage.setItem(THEME_KEY, next); } catch {}
        applyTheme(next === 'dark');
        const btn = document.getElementById('scele-theme-toggle');
        if (btn) btn.textContent = next === 'dark' ? '☀️' : '🌙';
    });

    // Phase 4: inject toggle button once the body exists.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectToggle, { once: true });
    } else {
        injectToggle();
    }

    function applyTheme(isDark) {
        const root = document.documentElement;
        if (!root) return;
        root.classList.toggle(CLASS, isDark);
    }

    function injectToggle() {
        if (document.getElementById('scele-theme-toggle')) return;
        const btn = document.createElement('button');
        btn.id = 'scele-theme-toggle';
        btn.title = 'Toggle dark mode';
        btn.setAttribute('aria-label', 'Toggle dark mode');
        const isDark = document.documentElement.classList.contains(CLASS);
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.onclick = () => {
            const nowDark = !document.documentElement.classList.contains(CLASS);
            applyTheme(nowDark);
            btn.textContent = nowDark ? '☀️' : '🌙';
            const value = nowDark ? 'dark' : 'light';
            try { localStorage.setItem(THEME_KEY, value); } catch {}
            chrome.storage.local.set({ [THEME_KEY]: value });
        };
        document.body.appendChild(btn);
    }
})();
