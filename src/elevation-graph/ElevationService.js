import {
  densifyRoute,
  buildElevationProfile,
} from "./elevationProfileBuilder.js";

export class ElevationService {
  constructor({ sampler, densify, buildProfile, maplibregl }) {
    this.sampler = sampler;
    this.densify = densify;
    this.buildProfile = buildProfile;
    this.maplibregl = maplibregl;
  }

  async build(coords) {
    if (!coords || coords.length === 0) {
      return {
        sampled: [],
        profile: [],
      };
    }

    const dense = this.densify(this.maplibregl, coords, 10);
    const sampled = await this.sampler.sample(dense);
    const profile = this.buildProfile(this.maplibregl, sampled);
    profile.forEach((p, i) => {
      if (i > 0) {
        const prev = profile[i - 1];

        if (Math.abs(p.elevation - prev.elevation) > 50) {
          console.warn("JUMP_PROFILE", {
            i,
            dist: p.distance,
            elev: p.elevation,
          });
        }
      }
    });

    return { sampled, profile };
  }
}
