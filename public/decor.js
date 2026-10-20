// Floating bats, ghosts and pumpkins in the background (shared by both screens)
(function () {
  const layer = document.createElement('div');
  layer.className = 'decor';
  const icons = ['🦇', '🦇', '🦇', '👻', '🎃', '🕸️', '🦇', '💀'];
  const count = window.innerWidth < 600 ? 9 : 16;
  for (let i = 0; i < count; i++) {
    const el = document.createElement('span');
    el.className = 'floater';
    el.textContent = icons[i % icons.length];
    el.style.left = Math.random() * 95 + 'vw';
    el.style.top = Math.random() * 90 + 'vh';
    el.style.fontSize = 18 + Math.random() * 26 + 'px';
    el.style.animationDuration = 8 + Math.random() * 10 + 's';
    el.style.animationDelay = -Math.random() * 10 + 's';
    el.style.opacity = 0.25 + Math.random() * 0.5;
    layer.appendChild(el);
  }
  const moon = document.createElement('div');
  moon.className = 'moon';
  const fog = document.createElement('div');
  fog.className = 'fog';
  document.body.prepend(fog);
  document.body.prepend(layer);
  document.body.prepend(moon);
})();

function formatClock(ms) {
  const s = Math.ceil(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}

function formatTime(ms) {
  if (ms == null) return '–';
  return (ms / 1000).toFixed(1) + 's';
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
