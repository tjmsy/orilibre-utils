import { projectPointToSegment } from "./geometry.js";

export function findClosestDistanceOnRoute(
  lng,
  lat,
  coordsWithElevation,
  elevationProfile,
) {
  let minDistanceSqToRoute = Infinity;
  let routeDistanceAtClosestPoint = 0;

  let closestPoint = null;

  for (let i = 0; i < coordsWithElevation.length - 1; i++) {
    const start = coordsWithElevation[i];
    const end = coordsWithElevation[i + 1];

    const projection = projectPointToSegment(
      lng,
      lat,
      start[0],
      start[1],
      end[0],
      end[1],
    );

    const dx = projection.x - lng;
    const dy = projection.y - lat;
    const distanceSq = dx * dx + dy * dy;

    if (distanceSq < minDistanceSqToRoute) {
      minDistanceSqToRoute = distanceSq;

      const startRouteDistance = elevationProfile[i].distance;
      const endRouteDistance = elevationProfile[i + 1].distance;

      routeDistanceAtClosestPoint =
        startRouteDistance +
        (endRouteDistance - startRouteDistance) * projection.t;

      closestPoint = [projection.x, projection.y];
    }
  }

  return {
    routeDistance: routeDistanceAtClosestPoint,
    closestPoint,
  };
}