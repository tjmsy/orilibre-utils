export default function adaptGpsTrackToPolyline(geoJson) {
  if (!geoJson?.features?.length) return [];

  const coords = [];

  geoJson.features.forEach((feature, i) => {
    const line = feature.geometry?.coordinates;
    if (!line || line.length < 2) return;

    if (i === 0) {
      coords.push(line[0]); 
    }

    coords.push(line[1]); 
  });

  return coords;
}