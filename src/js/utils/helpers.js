export function firstLetter(name) {
  return (name.trim()[0] || '?').toUpperCase();
}

export function randomIndex(length) {
  if (length <= 1) return 0;
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    window.crypto.getRandomValues(values);
    return values[0] % length;
  }
  return Math.floor(Math.random() * length);
}

export function formatMatchClock(realSeconds) {
  const matchSeconds = Math.min(90 * 60, Math.round(realSeconds * 90));
  return `${String(Math.floor(matchSeconds / 60)).padStart(2, '0')}:${String(matchSeconds % 60).padStart(2, '0')}`;
}
