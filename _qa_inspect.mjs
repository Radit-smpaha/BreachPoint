export default async function run(page, ui) {
  await page.waitForTimeout(1200);
  return await page.evaluate(() => {
    const g = window.game;
    if (!g) return { err: 'no game' };
    const out = { mode: g.mode, exposure: g.renderer.toneMappingExposure, lights: [], meshes: [] };
    g.scene.traverse(o => {
      if (o.isLight) out.lights.push({
        t: o.type, i: o.intensity, vis: o.visible,
        c: o.color ? '#' + o.color.getHexString() : null,
        p: o.position ? [+o.position.x.toFixed(0), +o.position.y.toFixed(0), +o.position.z.toFixed(0)] : null,
      });
      if (o.isMesh && out.meshes.length < 8) {
        const m = o.material;
        out.meshes.push({
          name: o.name || o.geometry?.name, mat: m?.type, vc: !!m?.vertexColors,
          col: m?.color ? '#' + m.color.getHexString() : null,
          vis: o.visible, parent: o.parent?.type,
          hasColorAttr: !!o.geometry?.attributes?.color,
          colSample: o.geometry?.attributes?.color ? [0, 1, 2].map(i => +o.geometry.attributes.color.getX(i).toFixed(2)) : null,
          bs: o.geometry?.boundingSphere ? +o.geometry.boundingSphere.radius.toFixed(1) : null,
        });
      }
    });
    const f = g.scene.fog;
    out.fog = f ? { color: '#' + f.color.getHexString(), density: f.density } : null;
    out.cam = g.activeCamera ? [+g.activeCamera.position.x.toFixed(1), +g.activeCamera.position.y.toFixed(1), +g.activeCamera.position.z.toFixed(1)] : null;
    return out;
  });
}
