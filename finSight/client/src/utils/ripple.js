/**
 * Quiet Ledger Seamless Button Click Ripple Effect
 *
 * Adds minimal, refined radial ink wave feedback when any button is clicked or activated.
 * - Dynamically adapts to light/dark themes and primary/secondary button variants
 * - Respects prefers-reduced-motion
 * - Non-intrusive (pointer-events: none, auto-removes)
 * - Accessible with keyboard activation (Space / Enter)
 */

export function initButtonRipple() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {};

  const handlePointerDown = (e) => {
    // Respect user reduced-motion preference
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Find closest button or interactive element
    const btn = e.target?.closest?.('button, .btn, [role="button"]');
    if (!btn) return;

    // Skip disabled elements
    if (
      btn.disabled ||
      btn.getAttribute('aria-disabled') === 'true' ||
      btn.classList.contains('disabled')
    ) {
      return;
    }

    // Debounce rapid duplicate events
    const now = performance.now();
    if (btn._lastRippleTime && now - btn._lastRippleTime < 180) {
      return;
    }
    btn._lastRippleTime = now;

    createRipple(btn, e.clientX, e.clientY);
  };

  const handleKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const btn = e.target?.closest?.('button, .btn, [role="button"]');
    if (!btn) return;

    if (
      btn.disabled ||
      btn.getAttribute('aria-disabled') === 'true' ||
      btn.classList.contains('disabled')
    ) {
      return;
    }

    const now = performance.now();
    if (btn._lastRippleTime && now - btn._lastRippleTime < 180) {
      return;
    }
    btn._lastRippleTime = now;

    // Trigger from center of button on keyboard activation
    createRipple(btn, null, null);
  };

  document.addEventListener('pointerdown', handlePointerDown, { passive: true });
  document.addEventListener('keydown', handleKeyDown, { passive: true });

  return () => {
    document.removeEventListener('pointerdown', handlePointerDown);
    document.removeEventListener('keydown', handleKeyDown);
  };
}

function createRipple(btn, clientX, clientY) {
  const rect = btn.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  // Ensure button has relative positioning and overflow hidden
  const computed = window.getComputedStyle(btn);
  if (computed.position === 'static') {
    btn.style.position = 'relative';
  }
  if (computed.overflow !== 'hidden') {
    btn.style.overflow = 'hidden';
  }

  const x = clientX !== null && clientX !== undefined ? clientX - rect.left : rect.width / 2;
  const y = clientY !== null && clientY !== undefined ? clientY - rect.top : rect.height / 2;
  const size = Math.max(rect.width, rect.height) * 2.2;

  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  const isPrimary =
    btn.classList.contains('btn-primary') ||
    btn.classList.contains('btn-success');
  const isDanger = btn.classList.contains('btn-danger');

  const wave = document.createElement('span');
  wave.className = 'btn-ripple-wave';
  wave.setAttribute('aria-hidden', 'true');

  if (isDanger) {
    wave.classList.add('btn-ripple-danger');
  } else if (isPrimary) {
    wave.classList.add('btn-ripple-light');
  } else if (isDarkTheme) {
    wave.classList.add('btn-ripple-dark-theme');
  } else {
    wave.classList.add('btn-ripple-dark');
  }

  wave.style.width = `${size}px`;
  wave.style.height = `${size}px`;
  wave.style.left = `${x}px`;
  wave.style.top = `${y}px`;

  btn.appendChild(wave);

  setTimeout(() => {
    if (wave.parentNode) {
      wave.parentNode.removeChild(wave);
    }
  }, 450);
}
