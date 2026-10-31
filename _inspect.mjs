import * as THREE from './libs/three.module.js';
import fs from 'fs';

// minimal GLB parser: read JSON chunk
function readGLB(file) {
  const buf = fs.readFileSync(file);
  const len = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + len).toString('utf8'));
  return json;
}

const files = process.argv.slice(2);
for (const f of files) {
  let j;
  try { j = readGLB(f); } catch (e) { console.log(f, 'NOT GLB?', e.message); continue; }
  console.log('\n===== ' + f + ' =====');
  console.log('asset:', JSON.stringify(j.asset));
  console.log('scenes:', JSON.stringify(j.scenes));
  console.log('nodes:', j.nodes.length, 'meshes:', (j.meshes || []).length, 'materials:', (j.materials || []).map(m => m.name).join(', '));
  console.log('animations:', (j.animations || []).map(a => a.name + '[' + a.channels.length + 'ch]').join(', ') || 'none');
  console.log('skins:', (j.skins || []).length);
  // node tree with transforms
  const roots = j.scenes[j.scene || 0].nodes;
  const walk = (i, depth) => {
    const n = j.nodes[i];
    const extra = [];
    if (n.translation) extra.push('T[' + n.translation.map(v => +v.toFixed(2)) + ']');
    if (n.rotation) extra.push('R[' + n.rotation.map(v => +v.toFixed(2)) + ']');
    if (n.scale) extra.push('S[' + n.scale.map(v => +v.toFixed(2)) + ']');
    if (n.extras) extra.push('EX:' + JSON.stringify(n.extras));
    const mesh = n.mesh !== undefined ? j.meshes[n.mesh] : null;
    console.log('  '.repeat(depth) + '- ' + (n.name || '?') + (mesh ? ' [' + mesh.name + ']' : '') + ' ' + extra.join(' ') + (mesh && mesh.primitives ? ' prims:' + mesh.primitives.length : ''));
    (n.children || []).forEach(c => walk(c, depth + 1));
  };
  roots.forEach(r => walk(r, 1));
  // accessor bounds for positions
  const ac = j.accessors || [];
  let min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  for (const m of (j.meshes || [])) for (const p of m.primitives) {
    const a = ac[p.attributes.POSITION];
    if (a && a.min && a.max) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], a.min[k]); max[k] = Math.max(max[k], a.max[k]); }
  }
  console.log('raw position bounds min:', min.map(v => +v.toFixed(2)), 'max:', max.map(v => +v.toFixed(2)));
  console.log('size:', max.map((v, k) => +(v - min[k]).toFixed(2)));
}
