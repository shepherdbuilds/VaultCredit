const SunIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function ThemeToggle({ isDark, onToggle }) {
  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button
        className={`toggle-option${!isDark ? " active" : ""}`}
        onClick={() => isDark && onToggle()}
        aria-pressed={!isDark}
        aria-label="Light mode"
      >
        <SunIcon />
        <span className="toggle-label">Light</span>
      </button>
      <button
        className={`toggle-option${isDark ? " active" : ""}`}
        onClick={() => !isDark && onToggle()}
        aria-pressed={isDark}
        aria-label="Dark mode"
      >
        <MoonIcon />
        <span className="toggle-label">Dark</span>
      </button>
    </div>
  );
}

export default ThemeToggle;
