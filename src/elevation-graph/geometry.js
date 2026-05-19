export function projectPointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return { t: 0, x: ax, y: ay };
  }

  const t =
    ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);

  const clampedT = Math.max(0, Math.min(1, t));

  return {
    t: clampedT,
    x: ax + dx * clampedT,
    y: ay + dy * clampedT,
  };
}