// ---------- structured wall builder: runs along X or Z with door gaps ----------
function wallRun(x1, z1, x2, z2, h, mat, opts = {}) {
  const t = opts.thickness || 0.8;
  const gaps = opts.gaps || [];
  const horiz = Math.abs(x2 - x1) >= Math.abs(z2 - z1);
  const start = horiz ? Math.min(x1, x2) : Math.min(z1, z2);
  const end = horiz ? Math.max(x1, x2) : Math.max(z1, z2);
  const fixed = horiz ? z1 : x1;
  const cuts = gaps.map((g) => [g.at - g.w / 2, g.at + g.w / 2]).sort((a, b) => a[0] - b[0]);
  const segs = [];
  let cursor = start;
  for (const [gs, ge] of cuts) {
    if (gs > cursor) segs.push([cursor, Math.min(gs, end)]);
    cursor = Math.max(cursor, ge);
  }
  if (cursor < end) segs.push([cursor, end]);
  for (const [s, e] of segs) {
    if (e - s < 0.25) continue;
    const mid = (s + e) / 2, L = e - s;
    if (horiz) addBox(mid, h / 2, fixed, L, h, t, mat);
    else addBox(fixed, h / 2, mid, t, h, L, mat);
  }
  // lintel above each doorway (non-solid so you can walk through)
  const doorH = 2.6;
  if (h > doorH + 0.3) {
    for (const g of gaps) {
      if (horiz) addBox(g.at, (doorH + h) / 2, fixed, g.w, h - doorH, t, mat, 0, false);
      else addBox(fixed, (doorH + h) / 2, g.at, t, h - doorH, g.w, mat, 0, false);
    }
  }
}

// =====================================================================
// LAYOUT 1 - ABANDONED STEEL FACTORY (structured floor plan)
//   north: boiler house annex | centre: spine corridor
//   west: storage wing (3 racking aisles) | east: production hall
//   south: loading yard with docks + trucks
// =====================================================================
function buildFactoryLayout() {
  const B = A - 1;

  // ---- perimeter ----
  wallRun(-B, -B, B, -B, WH, concrete);
  wallRun(-B, B, B, B, WH, concrete);
  wallRun(-B, -B, -B, B, WH, concrete);
  wallRun(B, -B, B, B, WH, concrete);

  // ================= PRODUCTION HALL (east half) =================
  // west wall of the hall with three doorways onto the spine
  wallRun(6, -30, 6, 30, 5.5, concrete, { gaps: [{ at: -18, w: 4 }, { at: 0, w: 4 }, { at: 18, w: 4 }] });
  wallRun(6, -30, 44, -30, 5.5, concrete, { gaps: [{ at: 26, w: 4 }] });
  wallRun(6, 30, 44, 30, 5.5, concrete, { gaps: [{ at: 26, w: 4 }] });

  // pillar rows framing three east-west aisles
  for (const px of [18, 32]) for (const pz of [-24, -8, 8, 24]) {
    addBox(px, 3.25, pz, 1.5, 6.5, 1.5, concrete);
    addBox(px, 1.2, pz + 0.83, 1.55, 0.35, 0.06, darkMat, 0, false);   // hazard band
  }

  // the assembly line: one long conveyor spine down the middle of the hall
  for (let z = -27; z <= 27; z += 3) {
    addBox(25, 0.95, z, 2.6, 0.12, 2.8, metalMat, 0, false);   // belt (waist-high cover)
    addBox(25, 0.5, z, 0.22, 1.0, 0.22, rustMat);              // leg (solid)
  }
  const rollGeo = new THREE.CylinderGeometry(0.28, 0.28, 2.6, 12);
  for (const rz of [-28.2, 28.2]) {
    const r = new THREE.Mesh(rollGeo, darkMat);
    r.rotation.x = Math.PI / 2; r.position.set(25, 0.95, rz);
    addMesh(r, false);
  }

  // press machines recessed along the east wall (alley behind them)
  for (let i = 0; i < 6; i++) {
    const z = -25 + i * 10;
    addBox(39, 1.4, z, 4.2, 2.8, 5.0, metalMat);
    addBox(39, 2.9, z, 4.4, 0.25, 5.2, darkMat, 0, false);
    addCyl(39, z + 1.9, 0.35, 3.6, rustMat, false);            // exhaust stack
    addBox(36.6, 1.2, z, 0.3, 1.6, 1.0, darkMat, 0, false);    // control panel
  }

  // workbenches along the hall's west wall
  for (let i = 0; i < 4; i++) {
    const z = -21 + i * 14;
    addBox(9, 0.55, z, 1.2, 1.1, 5.0, plankMat);
    addBox(9, 1.16, z, 1.3, 0.1, 5.2, darkMat, 0, false);
    addCyl(9, z + 1.6, 0.14, 0.5, metalMat, false);            // bench vise
  }

  // ================= STORAGE WING (west half) =================
  wallRun(-6, -30, -6, 30, 5.5, concrete, { gaps: [{ at: -18, w: 4 }, { at: 0, w: 4 }, { at: 18, w: 4 }] });
  wallRun(-44, -30, -6, -30, 5.5, concrete, { gaps: [{ at: -26, w: 4 }] });
  wallRun(-44, 30, -6, 30, 5.5, concrete, { gaps: [{ at: -26, w: 4 }] });

  // three rack rows form two long, narrow aisles - warehouse sniper lanes
  const rackRow = (x) => {
    for (let z = -26; z <= 26; z += 6.5) {
      addBox(x, 1.0, z, 1.8, 2.0, 0.25, metalMat);             // upright (solid)
      addBox(x, 0.75, z, 1.6, 0.12, 5.8, rustMat);             // lower shelf
      addBox(x, 1.75, z, 1.6, 0.12, 5.8, rustMat, 0, false);   // upper shelf
      addBox(x, 1.08, z - 1.8, 1.0, 0.6, 1.0, crateMat, 0, false);
      addBox(x, 2.05, z + 1.6, 1.0, 0.6, 1.0, crateMat, 0, false);
    }
  };
  rackRow(-38); rackRow(-28); rackRow(-16);

  // painted aisle lanes on the floor
  for (const lx of [-33, -22, -11]) for (let z = -28; z <= 28; z += 7) {
    addPane(lx, 0.02, z, 0.25, 0.02, 4.5, darkMat);
  }

  // ================= CENTRAL SPINE =================
  addBox(0, 1.1, -15, 2.6, 2.2, 1.8, metalMat);   // switchgear cabinets
  addBox(0, 1.1, 15, 2.6, 2.2, 1.8, metalMat);
  addBox(0, 4.5, -22, 12, 0.35, 0.35, rustMat, 0, false);   // pipe bridges
  addBox(0, 4.5, 22, 12, 0.35, 0.35, rustMat, 0, false);

  // ================= BOILER HOUSE (north annex) =================
  wallRun(-20, -46, -20, -30, 6.5, concrete, { gaps: [{ at: -38, w: 4 }] });
  wallRun(20, -46, 20, -30, 6.5, concrete, { gaps: [{ at: 38, w: 4 }] });
  const mainBoiler = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 7.5, 18), rustMat);
  mainBoiler.position.set(0, 3.75, -40);
  addMesh(mainBoiler, true, { minX: -3.2, maxX: 3.2, minZ: -43.2, maxZ: -36.8, height: 7.5 });
  for (const bx of [-13, 13]) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 5.5, 16), rustMat);
    b.position.set(bx, 2.75, -38);
    addMesh(b, true, { minX: bx - 2.2, maxX: bx + 2.2, minZ: -40.2, maxZ: -35.8, height: 5.5 });
  }
  for (const px of [-6, 6]) addCyl(px, -40, 0.45, 9.0, metalMat, false);   // flues
  for (let r = 0; r < 3; r++) {                                            // manifold on the back wall
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 38, 10), r === 1 ? rustMat : metalMat);
    p.rotation.z = Math.PI / 2; p.position.set(0, 2.6 + r * 0.85, -44.6);
    addMesh(p, false);
  }
  addBox(-17, 2.0, -42, 3.0, 4.0, 3.0, darkMat);   // coal hoppers
  addBox(17, 2.0, -42, 3.0, 4.0, 3.0, darkMat);

  // ================= LOADING YARD (south) =================
  addBox(-26, 0.6, 33, 26, 1.2, 5, concrete);   // dock platforms
  addBox(26, 0.6, 33, 26, 1.2, 5, concrete);
  for (let i = 0; i < 3; i++) addBox(0, 0.2 + i * 0.4, 35.6 - i * 0.9, 6, 0.4, 0.9, concrete, 0, false);  // dock steps
  const truck = (x, z, rot) => {
    addBox(x, 1.7, z, 3.0, 3.4, 9.0, rustMat, rot);
    addBox(x, 3.55, z, 3.2, 0.25, 9.2, darkMat, rot, false);
    addBox(x + Math.sin(rot) * 5.4, 1.2, z + Math.cos(rot) * 5.4, 2.6, 2.4, 2.4, metalMat, rot);
  };
  truck(-14, 40, 0.15);
  truck(14, 41, -0.1);
  for (let i = 0; i < 3; i++) addBox(-34 + i * 11, 1.6, 43.5, 10, 3.2, 2.6, i % 2 ? rustMat : metalMat, i * 0.02);
  for (const [px, pz] of [[-40, 36], [36, 37], [6, 44], [-6, 44]]) {
    addBox(px, 0.5, pz, 3.2, 1.0, 1.6, crateMat, 0.2);
    addBox(px, 1.15, pz, 2.4, 0.3, 1.2, crateMat, -0.15, false);
  }
  for (const lx of [-20, 20]) {                    // yard flood lights
    addCyl(lx, 40, 0.18, 7, metalMat, true);
    addBox(lx, 7.1, 40, 1.4, 0.25, 0.5, darkMat, 0, false);
    addLamp(lx, 6.8, 40, 0xffd9a0, 1.2, 20);
  }
  for (const [fx, fz] of [[-8, 42], [8, 42]]) {    // burning oil drums
    addBarrel(fx, fz, darkMat);
    const ember = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 10), new THREE.MeshBasicMaterial({ color: 0xff8a3a }));
    ember.position.set(fx, 1.06, fz);
    addMesh(ember, false);
    addLamp(fx, 1.6, fz, 0xff7a28, 1.5, 9);
  }

  // ================= overhead skeleton + lighting =================
  for (let z = -28; z <= 28; z += 7) {
    addBox(25, 6.2, z, 38, 0.3, 0.5, rustMat, 0, false);     // hall trusses
    addBox(-25, 6.2, z, 38, 0.3, 0.5, rustMat, 0, false);    // storage trusses
  }
  for (const hx of [-14, 0, 14]) addBox(hx, 6.6, 0, 0.3, 0.9, 56, rustMat, 0, false);
  for (const [lx, lz] of [[25, -20], [25, 0], [25, 20], [-22, -20], [-22, 0], [-22, 20], [0, -15], [0, 15]]) {
    addBox(lx, 5.6, lz, 0.1, 1.2, 0.1, darkMat, 0, false);
    addLamp(lx, 5.0, lz, 0xffc37a, 1.3, 18);
  }

  // floor grime + drains
  for (const [sx, sz] of [[25, -10], [25, 10], [-22, -8], [-22, 12], [0, 0]]) addPane(sx, 0.015, sz, 4, 0.02, 4, darkMat);
}

// =====================================================================
// LAYOUT 2 - ABANDONED GRAND HOTEL IN THE SNOW (structured floor plan)
//   south: courtyard (frozen fountain, dead cars)
//   middle: grand lobby (reception, fireplace, stair hall)
//   north: guest-room corridor off which numbered rooms open
//   east wing: dining hall + kitchen annex
// =====================================================================
function buildSnowLayout() {
  const B = A - 1;

  // ---- perimeter + caps ----
  wallRun(-B, -B, B, -B, WH, wallMat);
  wallRun(-B, B, B, B, WH, wallMat);
  wallRun(-B, -B, -B, B, WH, wallMat);
  wallRun(B, -B, B, B, WH, wallMat);
  for (const [cx, cz, cw, cd] of [[0, -B, B * 2, 1.9], [0, B, B * 2, 1.9], [-B, 0, 1.9, B * 2], [B, 0, 1.9, B * 2]]) {
    addBox(cx, WH + 0.1, cz, cw, 0.5, cd, snowMat, 0, false);
  }

  // ================= COURTYARD (south, z 8..46) =================
  // frozen fountain centrepiece
  addCyl(0, 22, 3.0, 0.9, iceMat, true, 20);
  addCyl(0, 22, 0.6, 2.6, iceMat, true, 12);
  addCyl(0, 22, 3.4, 0.18, snowMat, false, 20);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.18, 1.1 + Math.random() * 0.8, 6), iceMat);
    c.position.set(Math.cos(a) * 3.0, 0.35, 22 + Math.sin(a) * 3.0);
    c.rotation.x = Math.PI;
    addMesh(c, false);
  }
  // dead cars parked along the drive
  const car = (x, z, rot) => {
    addBox(x, 0.55, z, 4.4, 0.9, 1.9, rustMat, rot);
    addBox(x, 1.15, z, 2.4, 0.8, 1.8, darkMat, rot, false);
    addBox(x, 1.6, z, 2.5, 0.1, 1.9, snowMat, rot, false);
  };
  car(-14, 34, 0.4); car(14, 36, -0.25); car(-26, 18, 1.35);
  // the drive itself: cleared lanes through the snow
  addPane(0, 0.02, 34, 30, 0.02, 8, darkMat);
  addPane(0, 0.02, 14, 60, 0.02, 6, darkMat);
  // snow-covered benches flanking the entrance walk
  for (const bx of [-8, 8]) {
    addBox(bx, 0.45, 30, 2.0, 0.15, 0.6, plankMat, 0, false);
    addBox(bx, 0.6, 30, 2.1, 0.2, 0.66, snowMat, 0, false);
  }

  // ================= HOTEL SHELL =================
  // south facade: two wings with the grand entrance between them
  wallRun(-34, 8, -5, 8, 8.0, wallMat, { gaps: [{ at: -19, w: 3.5 }] });   // west wing south face
  wallRun(5, 8, 34, 8, 8.0, wallMat, { gaps: [{ at: 19, w: 3.5 }] });      // east wing south face
  // entrance portico columns + broken canopy
  addCyl(-5, 12, 0.35, 5.5, wallMat, true); addCyl(5, 12, 0.35, 5.5, wallMat, true);
  addBox(0, 5.6, 12, 12, 0.4, 5, wallMat, 0, false);
  addBox(0, 5.9, 12, 12.6, 0.5, 5.4, snowMat, 0, false);
  // west wing: outer wall + inner wall forming one long room, door to courtyard
  wallRun(-34, 8, -34, -34, 8.0, wallMat, { gaps: [{ at: -10, w: 3.5 }] });
  wallRun(-20, 8, -20, -34, 8.0, wallMat, { gaps: [{ at: -2, w: 3.5 }, { at: -22, w: 3.5 }] });
  // east wing mirrored
  wallRun(34, 8, 34, -34, 8.0, wallMat, { gaps: [{ at: -10, w: 3.5 }] });
  wallRun(20, 8, 20, -34, 8.0, wallMat, { gaps: [{ at: -2, w: 3.5 }, { at: -22, w: 3.5 }] });
  // north facade of the wings
  wallRun(-34, -34, -20, -34, 8.0, wallMat, { gaps: [{ at: -27, w: 3.5 }] });
  wallRun(20, -34, 34, -34, 8.0, wallMat, { gaps: [{ at: 27, w: 3.5 }] });

  // roofline snow on every wall top
  for (const [rx, rz, rw, rd] of [[-27, 8, 15, 1.9], [27, 8, 15, 1.9], [-34, -13, 1.9, 43], [-20, -13, 1.9, 43], [34, -13, 1.9, 43], [20, -13, 1.9, 43], [-27, -34, 15, 1.9], [27, -34, 15, 1.9]]) {
    addBox(rx, 8.15, rz, rw, 0.5, rd, snowMat, 0, false);
  }

  // ================= GRAND LOBBY (z -2..8 across full width) =================
  // lobby is the open strip between the wings at the entrance; furnish it
  // reception counter
  addBox(-12, 0.6, 2, 7.0, 1.2, 1.4, plankMat);
  addBox(-12, 1.3, 2, 7.2, 0.12, 1.6, darkMat, 0, false);
  // grandfather clock against the west inner wall
  addBox(-19, 1.1, -2.5, 0.9, 2.2, 0.7, plankMat);
  addPane(-19, 1.5, -2.1, 0.5, 0.7, 0.08, windowMat);
  // overturned sofas around the fireplace
  addBox(0, 0.4, 2, 3.2, 0.8, 1.4, darkMat, 0.4);
  addBox(-4, 0.4, -1, 1.4, 0.8, 3.0, darkMat, 0.1);
  addBox(4, 0.4, -1, 1.4, 0.8, 3.0, darkMat, -0.1);
  addPane(0, 0.03, 2, 6.5, 0.02, 5, darkMat);       // rug
  // fireplace on the east pylon
  addBox(2.6, 1.6, 0, 1.8, 3.2, 3.6, brickMat);
  addPane(1.65, 1.25, 0, 0.1, 1.7, 2.2, windowMat);
  addLamp(1.3, 1.3, 0, 0xff7a2a, 1.8, 10);
  addBox(2.6, 3.4, 0, 2.0, 0.35, 3.9, snowMat, 0, false);
  // grand staircase up the middle of the lobby (decorative, solid base)
  for (let s = 0; s < 6; s++) addBox(0, 0.35 + s * 0.42, 4.5 - s * 0.75, 5.0, 0.42, 0.8, wallMat);
  addBox(0, 3.2, 1.6, 5.0, 0.3, 4.6, wallMat, 0, false);   // landing slab (non-walkable, blocks LOS over)

  // ================= WEST WING: GUEST FLOORS (long hall + rooms) =================
  // central corridor wall with room doors
  wallRun(-27, -32, -27, 6, 8.0, wallMat, { gaps: [{ at: -28, w: 3 }, { at: -18, w: 3 }, { at: -8, w: 3 }, { at: 2, w: 3 }] });
  // room-dividing walls between the corridor and the outer wall
  for (const rz of [-13, -23]) wallRun(-34, rz, -27, rz, 8.0, wallMat);
  // furnishings for each room: bed, nightstand, dresser
  const furnRoom = (rx, rz) => {
    addBox(rx + 4.5, 0.35, rz - 3.5, 2.2, 0.7, 3.4, plankMat);          // bed
    addBox(rx + 4.5, 0.85, rz - 3.5, 2.3, 0.35, 3.5, snowMat, 0, false);// snow-dusted blanket
    addBox(rx + 2.8, 0.35, rz - 5.6, 0.8, 0.7, 0.8, plankMat);          // nightstand
    addBox(rx + 5.5, 0.5, rz + 4.0, 2.0, 1.0, 0.7, plankMat);           // dresser
    addPane(rx + 6.6, 3.6, rz, 0.1, 2.2, 2.6, windowMat);               // window
    addBox(rx + 6.7, 5.0, rz, 0.4, 0.35, 3.0, snowMat, 0, false);       // snow on sill
  };
  furnRoom(-34, -9); furnRoom(-34, -19); furnRoom(-34, -29);
  // corridor consoles + a snow-dusted runner carpet
  addPane(-27, 0.03, -14, 5.5, 0.02, 40, darkMat);
  addBox(-30.5, 0.5, -4, 1.2, 1.0, 2.4, plankMat);

  // ================= EAST WING: DINING HALL + KITCHEN =================
  wallRun(27, -32, 27, 6, 8.0, wallMat, { gaps: [{ at: -28, w: 3 }, { at: -16, w: 3 }, { at: -4, w: 3 }] });
  wallRun(20, -20, 34, -20, 8.0, wallMat, { gaps: [{ at: 30, w: 3 }] });   // kitchen / dining divider
  // the long banquet table down the dining hall
  for (let z = -14; z <= 0; z += 4) {
    addBox(27, 0.85, z, 3.4, 0.18, 3.6, plankMat);        // tabletop (waist-high cover)
    addBox(25.6, 0.45, z, 0.2, 0.9, 0.2, plankMat);
    addBox(28.4, 0.45, z, 0.2, 0.9, 0.2, plankMat);
  }
  // toppled chairs along the table
  for (let z = -15; z <= 1; z += 5.3) {
    addBox(24.2, 0.5, z, 0.7, 1.0, 0.7, plankMat, 0.7);
    addBox(29.8, 0.5, z + 2.6, 0.7, 1.0, 0.7, plankMat, -0.9);
  }
  // chandelier skeleton fallen across the table
  addBox(27, 2.6, -7, 3.6, 0.15, 6, darkMat, 0.35, false);
  addLamp(27, 2.4, -7, 0xffc37a, 1.1, 14);
  // kitchen: counters along the walls, big stove block, freezer
  addBox(31, 0.5, -26, 5.0, 1.0, 1.0, metalMat);          // north counter
  addBox(31, 0.5, -23.4, 5.0, 1.0, 0.9, metalMat);
  addBox(22.4, 0.5, -30, 1.0, 1.0, 6.0, metalMat);        // west counter run
  addBox(24.4, 0.6, -30, 2.4, 1.2, 2.4, metalMat);        // stove block
  for (let b = 0; b < 4; b++) addCyl(24.4 + (b % 2) * 0.9, -30.6 + Math.floor(b / 2) * 0.9, 0.22, 0.12, darkMat, false);
  addBox(33, 1.1, -30.5, 2.2, 2.2, 2.4, metalMat);        // walk-in freezer
  addPane(33, 1.1, -29.2, 1.0, 1.4, 0.08, windowMat);
  // hanging pots over the prep counter
  for (const px of [26.5, 28, 29.5]) addBox(px, 2.4, -30, 0.12, 0.9, 0.12, darkMat, 0, false);

  // ================= SERVICE SPINE (north strip, z -34..-46) =================
  wallRun(-20, -46, 20, -46, WH, wallMat);
  wallRun(-20, -46, -20, -34, WH, wallMat, { gaps: [{ at: -40, w: 4 }] });
  wallRun(20, -46, 20, -34, WH, wallMat, { gaps: [{ at: 40, w: 4 }] });
  // maintenance corridor between the wings: pipes + fuse boxes
  for (let z = -44; z <= -36; z += 4) {
    addBox(-22.5, 3.0, z, 0.5, 6.0, 0.5, metalMat);
    addBox(22.5, 3.0, z, 0.5, 6.0, 0.5, metalMat);
  }
  for (const fx of [-18, 0, 18]) { addBox(fx, 1.0, -45.2, 1.4, 2.0, 0.6, metalMat); }
  addPane(0, 0.02, -40, 40, 0.02, 10, darkMat);   // cleared floor strip

  // ================= pines, drifts, ambience =================
  const treeMat = new THREE.MeshStandardMaterial({ color: 0x1c3a2c, roughness: 0.9, metalness: 0.0 });
  const pine = (x, z, s = 1) => {
    addCyl(x, z, 0.22 * s, 1.6 * s, rustMat);
    for (let k = 0; k < 3; k++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry((1.5 - k * 0.32) * s, 2.4 * s, 8), treeMat);
      cone.position.set(x, (1.7 + k * 1.15) * s, z);
      addMesh(cone, false);
      const snowCone = new THREE.Mesh(new THREE.ConeGeometry((1.42 - k * 0.32) * s, 0.55 * s, 8), snowMat);
      snowCone.position.set(x, (2.55 + k * 1.15) * s, z);
      addMesh(snowCone, false);
    }
    colliders.push({ minX: x - 0.35, maxX: x + 0.35, minZ: z - 0.35, maxZ: z + 0.35, height: 2.2 });
  };
  [[-44, -44], [44, -44], [-44, 30], [44, 32], [-40, 44], [40, 46], [-10, 44], [12, 42], [-44, -12], [44, -8]].forEach(([x, z]) => {
    if (Math.abs(x) > B - 2 || Math.abs(z) > B - 2) return;
    pine(x, z, 0.9 + Math.random() * 0.5);
  });

  // drifts piled against the hotel's outer walls
  const drift = (x, z, w, h, d, solid = false) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), snowMat);
    m.position.set(x, h * 0.15, z);
    m.scale.set(w, h, d);
    addMesh(m, solid, solid ? { minX: x - w * 0.75, maxX: x + w * 0.75, minZ: z - d * 0.75, maxZ: z + d * 0.75, height: h } : null);
  };
  drift(-27, 6.5, 8, 1.6, 3, true); drift(27, 6.5, 8, 1.6, 3, true);
  drift(-33, -44, 6, 2.0, 5, true); drift(33, -44, 6, 2.0, 5, true);

  // lamp posts along the entrance walk
  for (const [lx, lz] of [[-9, 20], [9, 20], [-9, 32], [9, 32]]) {
    addCyl(lx, lz, 0.14, 4.2, metalMat, true);
    addBox(lx, 4.3, lz, 0.5, 0.25, 0.5, darkMat, 0, false);
    addLamp(lx, 4.0, lz, 0xc8e6ff, 1.0, 16);
  }
  // interior lights: lobby, corridor, dining hall
  addLamp(0, 5.5, 2, 0xffd9a0, 1.4, 22);
  addLamp(-27, 5.5, -14, 0xffc37a, 1.0, 20);
  addLamp(27, 5.5, -8, 0xffc37a, 1.0, 20);
  addLamp(0, 5.0, -40, 0x9fd8ff, 0.9, 18);
}
