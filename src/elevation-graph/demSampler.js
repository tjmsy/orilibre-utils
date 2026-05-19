export class DemSampler {
  constructor(demManager, project, options = {}) {
    this.dem = demManager;
    this.project = project;

    this.z = options.z ?? 14;
    this.tileSize = options.tileSize ?? 512;
  }

  async getTile(z, x, y) {
    return await this.dem.fetchAndParseTile(z, x, y);
  }

  async sample(points) {
    const groups = new Map();

    points.forEach((p, index) => {
      const proj = this.project(p[0], p[1], this.z, this.tileSize);

      const key = `${proj.tileX}/${proj.tileY}`;

      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ p, proj, index });
    });

    const result = new Array(points.length);

    for (const [key, list] of groups) {
      const [x, y] = key.split("/").map(Number);
      const tile = await this.getTile(this.z, x, y);

      for (const { p, proj, index } of list) {
        const px = Math.floor(proj.px);
        const py = Math.floor(proj.py);

        const elev = tile.data[py * this.tileSize + px];

        result[index] = [p[0], p[1], elev];
      }
    }

    return result;
  }
}
