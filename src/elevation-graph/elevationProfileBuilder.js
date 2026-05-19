export function densifyRoute(maplibregl, coords, step = 10) {
  const result = [];

  for (let i = 0; i < coords.length - 1; i++) {
    const a = new maplibregl.LngLat(...coords[i]);
    const b = new maplibregl.LngLat(...coords[i + 1]);

    const dist = a.distanceTo(b);
    const steps = Math.max(1, Math.floor(dist / step));

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      result.push([
        a.lng + (b.lng - a.lng) * t,
        a.lat + (b.lat - a.lat) * t,
      ]);
    }
  }

  result.push(coords.at(-1));
  return result;
}

export function buildElevationProfile(maplibregl, coordsWithElevation) {
  let dist = 0;
  const out = [];

  for (let i = 0; i < coordsWithElevation.length; i++) {
    if (i > 0) {
      const a = new maplibregl.LngLat(...coordsWithElevation[i - 1]);
      const b = new maplibregl.LngLat(...coordsWithElevation[i]);
      dist += a.distanceTo(b);
    }

    out.push({
      distance: dist,
      elevation: coordsWithElevation[i][2],
    });
  }

  return out;
}

export function findNearestIndexByDistance(profile, target) {
  let lo = 0;
  let hi = profile.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (profile[mid].distance < target) lo = mid + 1;
    else hi = mid;
  }

  if (lo === 0) return 0;

  const prev = profile[lo - 1];
  const curr = profile[lo];

  return Math.abs(prev.distance - target) < Math.abs(curr.distance - target)
    ? lo - 1
    : lo;
}