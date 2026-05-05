/* game.js
   Endless driving game using engine.js.
   Controls:
   W front/forward, A left, S back/reverse, D right
   Shift upshift, Ctrl downshift
   R refuel near petrol bunk
*/
(function () {
  "use strict";

  const E = window.DriveEngine;
  const $ = (id) => document.getElementById(id);

  if (!window.THREE) {
    document.body.innerHTML = "<div style='padding:30px;color:white;font-family:sans-serif'>Three.js failed to load. Keep the CDN script in index.html or download Three.js locally.</div>";
    return;
  }

  const sceneRoot = $("sceneRoot");
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = false;
  sceneRoot.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x9bd8f5, 90, 850);
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 1500);

  const hemi = new THREE.HemisphereLight(0xd7f0ff, 0x2c3b33, 1.1);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1bd, 1.2);
  sun.position.set(-80, 110, -40);
  scene.add(sun);
  const moon = new THREE.DirectionalLight(0x8cb8ff, 0.0);
  scene.add(moon);

  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(6, 18, 18), new THREE.MeshBasicMaterial({ color: 0xffec90 }));
  const moonBall = new THREE.Mesh(new THREE.SphereGeometry(4.5, 16, 16), new THREE.MeshBasicMaterial({ color: 0xdce9ff }));
  scene.add(sunBall, moonBall);

  const input = new E.Input([
    "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
    "KeyW", "KeyA", "KeyS", "KeyD",
    "Space", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight"
  ]);
  const perf = new E.PerfTracker();
  const quality = new E.AdaptiveQuality(renderer, perf);

  const zones = [
    { key: "city", label: "City", start: 0, end: 900, sky: 0x8ec9e8, fog: 0x9fb9c9, next: "Forest" },
    { key: "forest", label: "Forest", start: 900, end: 2200, sky: 0x97d8b2, fog: 0xa7caae, next: "Beach Highway" },
    { key: "beach", label: "Beach Highway", start: 2200, end: 5400, sky: 0x83d6f6, fog: 0xaeddf1, next: "Desert Canyon" },
    { key: "desert", label: "Desert Canyon", start: 5400, end: 8000, sky: 0xffc284, fog: 0xd7a16c, next: "Snow Mountains" },
    { key: "snow", label: "Snow Mountains", start: 8000, end: 11000, sky: 0xc7e8ff, fog: 0xd7e8f4, next: "Neon Valley" },
    { key: "neon", label: "Neon Valley", start: 11000, end: Infinity, sky: 0x101042, fog: 0x1a174a, next: "Endless neon road" }
  ];

  const materials = {
    road: new THREE.MeshBasicMaterial({ color: 0x202a32, side: THREE.DoubleSide }),
    roadNeon: new THREE.MeshBasicMaterial({ color: 0x151b28, side: THREE.DoubleSide }),
    shoulder: new THREE.MeshBasicMaterial({ color: 0x9ca79a, side: THREE.DoubleSide }),
    line: new THREE.MeshBasicMaterial({ color: 0xffe36b, side: THREE.DoubleSide }),
    edge: new THREE.MeshBasicMaterial({ color: 0xf3f5e8, side: THREE.DoubleSide }),
    city: new THREE.MeshLambertMaterial({ color: 0x5e6b73, side: THREE.DoubleSide }),
    forest: new THREE.MeshLambertMaterial({ color: 0x4e764d, side: THREE.DoubleSide }),
    sand: new THREE.MeshLambertMaterial({ color: 0xe5ca8e, side: THREE.DoubleSide }),
    desert: new THREE.MeshLambertMaterial({ color: 0xb96e3d, side: THREE.DoubleSide }),
    snow: new THREE.MeshLambertMaterial({ color: 0xdce9ee, side: THREE.DoubleSide }),
    neonGround: new THREE.MeshLambertMaterial({ color: 0x1a1e34, side: THREE.DoubleSide }),
    water: new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { time: { value: 0 }, colorA: { value: new THREE.Color(0x2088d5) }, colorB: { value: new THREE.Color(0x63ddff) } },
      vertexShader: `
        varying vec2 vUv;
        uniform float time;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.y += sin(p.x * 0.07 + time * 1.7) * 0.18 + cos(p.z * 0.045 + time * 1.25) * 0.14;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform vec3 colorA;
        uniform vec3 colorB;
        uniform float time;
        void main() {
          float wave = 0.5 + 0.5 * sin(vUv.y * 80.0 + time * 2.0);
          vec3 color = mix(colorA, colorB, wave * 0.35);
          gl_FragColor = vec4(color, 0.82);
        }`
    }),
    car: new THREE.MeshLambertMaterial({ color: 0xf47a24 }),
    glass: new THREE.MeshBasicMaterial({ color: 0x9fc4c7, transparent: true, opacity: 0.78 }),
    dark: new THREE.MeshLambertMaterial({ color: 0x080d13 }),
    trunk: new THREE.MeshLambertMaterial({ color: 0x6d4125 }),
    leaf: new THREE.MeshLambertMaterial({ color: 0x2e8a3d }),
    leaf2: new THREE.MeshLambertMaterial({ color: 0x78b455 }),
    palm: new THREE.MeshLambertMaterial({ color: 0x1e8f45 }),
    rock: new THREE.MeshLambertMaterial({ color: 0x6d6460 }),
    light: new THREE.MeshBasicMaterial({ color: 0xffec9a }),
    tail: new THREE.MeshBasicMaterial({ color: 0xff304a }),
    neon: new THREE.MeshBasicMaterial({ color: 0x5df7ff })
  };

  const geo = {
    carBody: new THREE.BoxGeometry(2.15, 0.65, 4.3),
    carCabin: new THREE.BoxGeometry(1.55, 0.75, 1.75),
    carHood: new THREE.BoxGeometry(1.9, 0.24, 1.2),
    bumper: new THREE.BoxGeometry(2.25, 0.25, 0.23),
    lampPost: new THREE.CylinderGeometry(0.06, 0.10, 4, 8),
    lampArm: new THREE.BoxGeometry(1.4, 0.08, 0.08),
    bulb: new THREE.SphereGeometry(0.15, 8, 8),
    trunk: new THREE.CylinderGeometry(0.18, 0.3, 1, 8),
    cone: new THREE.ConeGeometry(1, 1, 8),
    sphere: new THREE.SphereGeometry(1, 9, 7),
    box: new THREE.BoxGeometry(1, 1, 1),
    wheel: new THREE.CylinderGeometry(0.42, 0.42, 0.34, 16),
    rim: new THREE.CylinderGeometry(0.20, 0.20, 0.36, 10),
    rock: new THREE.DodecahedronGeometry(1, 0)
  };

  const config = {
    chunkLen: 72,
    roadHalf: 6.2,
    simHz: 60
  };

  const gearOrder = [-1, 0, 1, 2, 3, 4, 5];
  const gearMax = { "-1": 10, "0": 0, "1": 13, "2": 24, "3": 36, "4": 48, "5": 58 };
  const gearTorque = { "-1": 8.5, "0": 0, "1": 10.5, "2": 8.0, "3": 6.2, "4": 4.8, "5": 3.7 };
  const gearLabel = (g) => g === -1 ? "R" : g === 0 ? "N" : String(g);

  const state = {
    started: false,
    running: false,
    modal: "menu",
    returnTo: "menu",
    s: 0,
    lane: 0,
    pos: new THREE.Vector3(),
    prevPos: new THREE.Vector3(),
    yaw: 0,
    prevYaw: 0,
    speed: 0,
    steer: 0,
    prevSteer: 0,
    gear: 0,
    rpm: 800,
    fuelCapacity: 40,
    fuel: 5,
    fuelUsed: 0,
    distanceKm: 0,
    avgMileage: 0,
    instantMileage: 0,
    lights: false,
    timeMode: "day",
    dayPhase: 0.16,
    currentZone: zones[0],
    nearest: null,
    nearStation: null,
    stationPromptUntil: 0,
    cameraDistance: 10,
    steeringSensitivity: 1,
    fuelBurn: 1,
    cameraMode: 0,
    hudTimer: 0,
    mapTimer: 0,
    hornUntil: 0
  };

  const world = {
    chunks: new Map(),
    buildQueue: [],
    stations: [],
    stationMeshes: new Map(),
    nextStationS: 360,
    traffic: [],
    animated: []
  };

  function zoneForS(s) {
    for (const z of zones) if (s >= z.start && s < z.end) return z;
    return zones[zones.length - 1];
  }

  function zoneWeight(key, s) {
    const z = zones.find((zone) => zone.key === key);
    if (!z) return 0;
    const fadeIn = E.smoothstep((s - z.start) / 350);
    const fadeOut = z.end === Infinity ? 1 : 1 - E.smoothstep((s - (z.end - 350)) / 350);
    return E.clamp(fadeIn * fadeOut, 0, 1);
  }

  function roadX(s) {
    let x = 12 * Math.sin(s / 260) + 7 * Math.sin(s / 120 + 1.7);
    x += zoneWeight("forest", s) * (15 * Math.sin(s / 165 + 0.7) + 7 * Math.sin(s / 80));
    x += zoneWeight("beach", s) * (24 * Math.sin(s / 340 + 1.1) + 13 * Math.sin(s / 150));
    x += zoneWeight("desert", s) * (30 * Math.sin(s / 260 + 2.2) + 12 * Math.sin(s / 105));
    x += zoneWeight("snow", s) * (26 * Math.sin(s / 235 + 0.6) + 18 * Math.sin(s / 170 + 2.1));
    x += zoneWeight("neon", s) * (40 * Math.sin(s / 300) + 18 * Math.sin(s / 95 + 0.4));
    return x;
  }

  function roadY(s) {
    let y = 1.3 * Math.sin(s / 230) + 0.9 * Math.sin(s / 85 + 2.1);
    y += zoneWeight("forest", s) * (4.8 * Math.sin(s / 215 + 1.0) + 2.0 * Math.sin(s / 82));
    y += zoneWeight("desert", s) * (7.0 * Math.sin(s / 270 + 1.7) + 2.6 * Math.sin(s / 100));
    y += zoneWeight("snow", s) * (10.0 * Math.sin(s / 330 + 0.5) + 4.0 * Math.sin(s / 150));
    y += zoneWeight("neon", s) * (5.5 * Math.sin(s / 210) + 4.5 * Math.sin(s / 420));
    return y;
  }

  function pointAt(s) {
    return new THREE.Vector3(roadX(s), roadY(s), s);
  }

  function basisAt(s) {
    const p0 = pointAt(s - 2);
    const p1 = pointAt(s + 2);
    const forward = p1.clone().sub(p0).normalize();
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    if (right.lengthSq() < 0.0001) right.set(1, 0, 0);
    right.normalize();
    const yaw = Math.atan2(forward.x, forward.z);
    const pitch = Math.atan2(forward.y, Math.sqrt(forward.x * forward.x + forward.z * forward.z));
    return { point: pointAt(s), forward, right, yaw, pitch };
  }

  function projectToRoad(pos, guessS) {
    let bestS = Math.max(0, guessS);
    let bestBasis = basisAt(bestS);
    let bestLane = 0;
    let bestScore = Infinity;
    const radii = [52, 20, 8, 3];
    for (const radius of radii) {
      const center = bestS;
      for (let k = -2; k <= 2; k++) {
        const s = Math.max(0, center + k * radius * 0.5);
        const b = basisAt(s);
        const dx = pos.x - b.point.x;
        const dz = pos.z - b.point.z;
        const dy = pos.y - b.point.y;
        const lateral = dx * b.right.x + dz * b.right.z;
        const along = dx * b.forward.x + dz * b.forward.z;
        const score = lateral * lateral + along * along * 0.55 + dy * dy * 0.08;
        if (score < bestScore) {
          bestScore = score;
          bestS = s;
          bestBasis = b;
          bestLane = lateral;
        }
      }
    }
    return { s: bestS, lane: bestLane, basis: bestBasis };
  }

  function materialForGround(key) {
    if (key === "city") return materials.city;
    if (key === "forest") return materials.forest;
    if (key === "beach") return materials.sand;
    if (key === "desert") return materials.desert;
    if (key === "snow") return materials.snow;
    return materials.neonGround;
  }

  function makeRibbonGeometry(s0, s1, offA, offB, yOffset, steps) {
    const vertices = [];
    const uvs = [];
    const indices = [];
    for (let i = 0; i <= steps; i++) {
      const s = E.lerp(s0, s1, i / steps);
      const b = basisAt(s);
      const a = b.point.clone().addScaledVector(b.right, offA);
      const c = b.point.clone().addScaledVector(b.right, offB);
      a.y += yOffset;
      c.y += yOffset;
      vertices.push(a.x, a.y, a.z, c.x, c.y, c.z);
      uvs.push(0, i / steps, 1, i / steps);
    }
    for (let i = 0; i < steps; i++) {
      const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, c, b, b, c, d);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return geometry;
  }

  function addRibbon(group, s0, s1, offA, offB, yOffset, mat, steps) {
    const mesh = new THREE.Mesh(makeRibbonGeometry(s0, s1, offA, offB, yOffset, steps || 5), mat);
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  }

  function place(obj, s, offset, y, yawOffset) {
    const b = basisAt(s);
    obj.position.copy(b.point).addScaledVector(b.right, offset);
    obj.position.y += y || 0;
    obj.rotation.y = b.yaw + (yawOffset || 0);
    return obj;
  }

  function makeTree(seed, kind) {
    const g = new THREE.Group();
    const h = kind === "palm" ? E.between(seed, 6.5, 11) : E.between(seed, 5.0, 9.5);
    const trunk = new THREE.Mesh(geo.trunk, materials.trunk);
    trunk.scale.set(kind === "palm" ? 1.0 : 0.85, h, kind === "palm" ? 1.0 : 0.85);
    trunk.position.y = h * 0.5;
    g.add(trunk);

    if (kind === "palm") {
      for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, E.between(seed + i, 2.2, 3.4)), materials.palm);
        leaf.position.set(Math.cos(i * Math.PI / 3) * 1.2, h + 0.2, Math.sin(i * Math.PI / 3) * 1.2);
        leaf.rotation.y = i * Math.PI / 3;
        leaf.rotation.x = -0.25;
        g.add(leaf);
        world.animated.push({ obj: leaf, base: leaf.rotation.z, amp: 0.08, phase: E.rand(seed + i) * Math.PI * 2 });
      }
    } else if (kind === "pine" || kind === "snow") {
      for (let i = 0; i < 3; i++) {
        const cone = new THREE.Mesh(geo.cone, kind === "snow" ? materials.snow : materials.leaf);
        cone.scale.set(h * (0.22 - i * 0.035), h * 0.35, h * (0.22 - i * 0.035));
        cone.position.y = h * (0.45 + i * 0.18);
        g.add(cone);
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const crown = new THREE.Mesh(geo.sphere, i === 2 ? materials.leaf2 : materials.leaf);
        const r = h * E.between(seed + i, 0.18, 0.25);
        crown.scale.set(r, r * E.between(seed + i + 20, 0.8, 1.15), r);
        crown.position.set(E.between(seed + i + 7, -0.7, 0.7), h * E.between(seed + i + 10, 0.62, 0.9), E.between(seed + i + 15, -0.7, 0.7));
        g.add(crown);
      }
    }
    return g;
  }

  function makeBuilding(seed) {
    const g = new THREE.Group();
    const w = E.between(seed, 5, 12), d = E.between(seed + 1, 5, 15), h = E.between(seed + 2, 9, 34);
    const colors = [0x5b6871, 0x687464, 0x3e5260, 0x736b55, 0x263d52];
    const mat = new THREE.MeshLambertMaterial({ color: colors[Math.floor(E.rand(seed + 3) * colors.length)] });
    const b = new THREE.Mesh(geo.box, mat);
    b.scale.set(w, h, d);
    b.position.y = h * 0.5;
    g.add(b);
    return g;
  }

  function makeLamp(side) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(geo.lampPost, materials.dark);
    post.position.y = 2;
    const arm = new THREE.Mesh(geo.lampArm, materials.dark);
    arm.position.set(-side * 0.65, 3.85, 0);
    const bulb = new THREE.Mesh(geo.bulb, materials.light);
    bulb.position.set(-side * 1.33, 3.85, 0);
    g.add(post, arm, bulb);
    return g;
  }

  function makeRock(seed, scale) {
    const rock = new THREE.Mesh(geo.rock, materials.rock);
    rock.scale.set(E.between(seed, 0.8, 1.8) * scale, E.between(seed + 1, 0.35, 1.0) * scale, E.between(seed + 2, 0.8, 1.8) * scale);
    rock.rotation.set(E.rand(seed + 3), E.rand(seed + 4) * Math.PI * 2, E.rand(seed + 5));
    return rock;
  }

  function makeCactus(seed) {
    const g = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x2b8b48 });
    const h = E.between(seed, 3.5, 6.5);
    const trunk = new THREE.Mesh(geo.trunk, mat);
    trunk.scale.set(1.1, h, 1.1);
    trunk.position.y = h * 0.5;
    g.add(trunk);
    return g;
  }

  function makeStationMesh(station) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(geo.box, new THREE.MeshLambertMaterial({ color: 0x616a72 }));
    base.scale.set(13, 0.18, 15);
    base.position.y = 0.09;
    const canopy = new THREE.Mesh(geo.box, new THREE.MeshLambertMaterial({ color: station.zone === "beach" ? 0x35b7ff : 0xff5d5d }));
    canopy.scale.set(8.5, 0.32, 5.3);
    canopy.position.y = 3.4;
    g.add(base, canopy);
    for (let x of [-2, 0, 2]) {
      const pump = new THREE.Mesh(geo.box, new THREE.MeshLambertMaterial({ color: 0xf6f6ee }));
      pump.scale.set(0.65, 1.5, 0.75);
      pump.position.set(x, 0.85, 0);
      g.add(pump);
    }
    const sign = new THREE.Mesh(geo.box, materials.line);
    sign.scale.set(3.1, 1.3, 0.18);
    sign.position.set(4.8, 4.7, -5.2);
    g.add(sign);
    return g;
  }

  function createSegment(index) {
    const s0 = index * config.chunkLen;
    const s1 = s0 + config.chunkLen;
    const mid = (s0 + s1) * 0.5;
    const zone = zoneForS(mid);
    const group = new THREE.Group();
    group.userData.index = index;
    group.userData.zone = zone.key;

    const roadHalf = config.roadHalf;
    const ground = materialForGround(zone.key);

    addRibbon(group, s0, s1, -130, -roadHalf - 2, -0.09, ground, 5);
    if (zone.key === "beach") {
      addRibbon(group, s0, s1, roadHalf + 2, roadHalf + 42, -0.1, materials.sand, 5);
      addRibbon(group, s0, s1, roadHalf + 42, roadHalf + 170, -0.32, materials.water, 5);
    } else {
      addRibbon(group, s0, s1, roadHalf + 2, 130, -0.09, ground, 5);
    }
    addRibbon(group, s0, s1, -roadHalf - 2, -roadHalf, 0.0, materials.shoulder, 5);
    addRibbon(group, s0, s1, roadHalf, roadHalf + 2, 0.0, materials.shoulder, 5);
    addRibbon(group, s0, s1, -roadHalf, roadHalf, 0.03, zone.key === "neon" ? materials.roadNeon : materials.road, 6);
    addRibbon(group, s0, s1, -roadHalf + 0.28, -roadHalf + 0.42, 0.08, materials.edge, 4);
    addRibbon(group, s0, s1, roadHalf - 0.42, roadHalf - 0.28, 0.08, materials.edge, 4);

    for (let s = s0 + 8; s < s1; s += 18) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.045, 5.2), materials.line);
      const b = basisAt(s);
      dash.position.copy(b.point);
      dash.position.y += 0.14;
      dash.rotation.set(-b.pitch, b.yaw, 0);
      group.add(dash);
    }

    const seed = index * 19.17 + 4.3;
    if (zone.key === "city") {
      for (const side of [-1, 1]) {
        const lamp = makeLamp(side);
        place(lamp, E.lerp(s0, s1, 0.5), side * (roadHalf + 2.8), 0, 0);
        group.add(lamp);
        if (E.rand(seed + side) > 0.25) {
          const building = makeBuilding(seed + side * 50);
          place(building, E.lerp(s0, s1, E.between(seed + side, 0.2, 0.8)), side * E.between(seed + 3, 24, 58), 0, E.between(seed + 7, -0.08, 0.08));
          group.add(building);
        }
      }
    } else if (zone.key === "forest") {
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
        const tree = makeTree(seed + i * 17 + side * 3, E.rand(seed + i) > 0.5 ? "pine" : "oak");
        place(tree, E.lerp(s0, s1, E.between(seed + i, 0.08, 0.92)), side * E.between(seed + i + 9, 12, 55), 0, E.rand(seed + i) * Math.PI);
        group.add(tree);
      }
    } else if (zone.key === "beach") {
      for (let i = 0; i < 3; i++) {
        const palm = makeTree(seed + i * 20, "palm");
        place(palm, E.lerp(s0, s1, E.between(seed + i, 0.08, 0.92)), E.between(seed + i + 5, 18, 58), 0, E.rand(seed + i) * Math.PI);
        group.add(palm);
      }
      if (E.rand(seed) > 0.78) {
        const rock = makeRock(seed + 200, 1.2);
        place(rock, E.lerp(s0, s1, 0.62), E.between(seed + 201, 10, 28), 0.25, 0);
        group.add(rock);
      }
    } else if (zone.key === "desert") {
      for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
        const obj = E.rand(seed + i) > 0.5 ? makeCactus(seed + i * 9) : makeRock(seed + i * 12, 1.6);
        place(obj, E.lerp(s0, s1, E.between(seed + i, 0.1, 0.9)), side * E.between(seed + i + 5, 17, 62), 0, 0);
        group.add(obj);
      }
    } else if (zone.key === "snow") {
      for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
        const tree = makeTree(seed + i * 13 + side * 7, "snow");
        place(tree, E.lerp(s0, s1, E.between(seed + i, 0.1, 0.9)), side * E.between(seed + i + 8, 16, 58), 0, 0);
        group.add(tree);
      }
    } else {
      for (const side of [-1, 1]) {
        const crystal = new THREE.Mesh(geo.cone, materials.neon);
        crystal.scale.set(1.0, E.between(seed + side, 4, 8), 1.0);
        place(crystal, E.lerp(s0, s1, 0.5), side * E.between(seed + 3, 18, 55), 0, 0);
        crystal.position.y += crystal.scale.y * 0.5;
        group.add(crystal);
      }
    }

    scene.add(group);
    world.chunks.set(index, group);
  }

  function ensureWorld() {
    const current = Math.floor(state.s / config.chunkLen);
    for (let i = current - 8; i <= current + 34; i++) {
      if (i >= 0 && !world.chunks.has(i) && !world.buildQueue.includes(i)) world.buildQueue.push(i);
    }
    let built = 0;
    while (world.buildQueue.length && built < 2) {
      const idx = world.buildQueue.shift();
      if (!world.chunks.has(idx)) {
        createSegment(idx);
        built++;
      }
    }
    for (const [idx, group] of Array.from(world.chunks)) {
      if (idx < current - 10 || idx > current + 40) {
        scene.remove(group);
        world.chunks.delete(idx);
      }
    }
    ensureStations(state.s + 3000);
    updateStationMeshes();
  }

  function ensureStations(maxS) {
    const names = ["Metro Fuel Stop", "Forest Pump", "WaveSide Bunk", "Canyon Petrol", "Frost Fuel", "Neon Charge"];
    while (world.nextStationS < maxS) {
      const id = world.stations.length;
      const zone = zoneForS(world.nextStationS);
      const side = E.rand(id * 4.4 + 2.1) > 0.5 ? 1 : -1;
      world.stations.push({ id, s: world.nextStationS, side, name: names[id % names.length], zone: zone.key });
      world.nextStationS += 560 + E.rand(id * 8.1) * 420;
    }
  }

  function nearestStation() {
    ensureStations(state.s + 3000);
    let best = null, dist = Infinity;
    for (const st of world.stations) {
      const d = Math.abs(st.s - state.s);
      if (d < dist) { best = st; dist = d; }
    }
    return best ? { station: best, dist } : null;
  }

  function nearStation() {
    const info = nearestStation();
    if (!info) return null;
    const st = info.station;
    const stationLane = st.side * (config.roadHalf + 9.4);
    const closeS = Math.abs(st.s - state.s) < 25;
    const closeLane = Math.abs(state.lane - stationLane) < 9;
    const stopped = Math.abs(state.speed) < 3.2;
    return closeS && closeLane && stopped ? st : null;
  }

  function updateStationMeshes() {
    for (const st of world.stations) {
      const visible = st.s > state.s - 260 && st.s < state.s + 2100;
      if (visible && !world.stationMeshes.has(st.id)) {
        const mesh = makeStationMesh(st);
        scene.add(mesh);
        world.stationMeshes.set(st.id, mesh);
      }
      if (!visible && world.stationMeshes.has(st.id)) {
        scene.remove(world.stationMeshes.get(st.id));
        world.stationMeshes.delete(st.id);
      }
      const mesh = world.stationMeshes.get(st.id);
      if (mesh) place(mesh, st.s, st.side * (config.roadHalf + 9.4), 0.03, st.side > 0 ? -Math.PI / 2 : Math.PI / 2);
    }
  }

  function makeCar(color) {
    const g = new THREE.Group();
    const bodyMat = new THREE.MeshLambertMaterial({ color });
    const body = new THREE.Mesh(geo.carBody, bodyMat);
    body.position.y = 0.72;
    const cabin = new THREE.Mesh(geo.carCabin, materials.glass);
    cabin.position.set(0, 1.27, -0.32);
    const hood = new THREE.Mesh(geo.carHood, bodyMat);
    hood.position.set(0, 1.03, 1.0);
    const bumper = new THREE.Mesh(geo.bumper, materials.dark);
    bumper.position.set(0, 0.48, -2.25);
    g.add(body, cabin, hood, bumper);

    for (const x of [-0.62, 0.62]) {
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.06), materials.light);
      head.position.set(x, 0.76, 2.18);
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.17, 0.07), materials.tail);
      tail.position.set(x, 0.75, -2.18);
      g.add(head, tail);
    }

    const wheelRoots = [], frontRoots = [], wheelMeshes = [];
    for (const item of [[-1.08, 0.42, 1.25, true], [1.08, 0.42, 1.25, true], [-1.08, 0.42, -1.25, false], [1.08, 0.42, -1.25, false]]) {
      const root = new THREE.Group();
      root.position.set(item[0], item[1], item[2]);
      const wheel = new THREE.Mesh(geo.wheel, materials.dark);
      wheel.rotation.z = Math.PI / 2;
      const rim = new THREE.Mesh(geo.rim, materials.edge);
      rim.rotation.z = Math.PI / 2;
      root.add(wheel, rim);
      g.add(root);
      wheelRoots.push(root);
      wheelMeshes.push(wheel);
      if (item[3]) frontRoots.push(root);
    }

    const beams = [];
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0a5, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide });
    for (const x of [-0.55, 0.55]) {
      const beam = new THREE.Mesh(new THREE.ConeGeometry(1.8, 15, 18, 1, true), beamMat);
      beam.rotation.x = Math.PI / 2;
      beam.position.set(x, 0.72, 8.6);
      beam.visible = false;
      g.add(beam);
      beams.push(beam);
    }
    return { group: g, frontRoots, wheelMeshes, beams };
  }

  const car = makeCar(0xf47a24);
  scene.add(car.group);

  function initTraffic() {
    for (const t of world.traffic) scene.remove(t.car.group);
    world.traffic = [];
    const colors = [0x3aa3ff, 0xffce54, 0x80d06b, 0xe85d75, 0xffffff, 0x9d7cff, 0x6ee7b7, 0xf97316];
    const trafficCount = 14;
    for (let i = 0; i < trafficCount; i++) {
      const trafficCar = makeCar(colors[i % colors.length]);
      trafficCar.group.scale.setScalar(0.78 + E.rand(i * 2.5) * 0.18);
      scene.add(trafficCar.group);
      world.traffic.push({
        car: trafficCar,
        s: state.s + 120 + i * 135 + E.rand(i * 7.2) * 220,
        lane: E.rand(i * 1.9) > 0.5 ? -2.8 : 2.8,
        speed: 8 + E.rand(i * 3.1) * 16
      });
    }
  }

  function shift(delta) {
    const index = gearOrder.indexOf(state.gear);
    const next = E.clamp(index + delta, 0, gearOrder.length - 1);
    state.gear = gearOrder[next];
  }

  function fixedUpdate(dt) {
    if (!state.running) return;

    state.prevPos.copy(state.pos);
    state.prevYaw = state.yaw;
    state.prevSteer = state.steer;

    const left = input.any("KeyA", "ArrowLeft");
    const right = input.any("KeyD", "ArrowRight");
    const forward = input.any("KeyW", "ArrowUp");
    const back = input.any("KeyS", "ArrowDown");
    const handbrake = input.any("Space");

    const steerTarget = (left ? 1 : 0) - (right ? 1 : 0);
    state.steer = E.lerp(state.steer, steerTarget, E.clamp(dt * 9.5 * state.steeringSensitivity, 0, 1));

    const projected = projectToRoad(state.pos, state.s);
    state.s = projected.s;
    state.lane = projected.lane;
    const slope = projected.basis.forward.y;
    const fuelOK = state.fuel > 0.0005;

    // Direct WASD + manual gearbox:
    // W drives forward in gears 1-5. S brakes and then goes backward in R.
    // If stopped, W auto-selects 1 and S auto-selects R for intuitive controls,
    // while Shift/Ctrl still provide manual gear shifting.
    if (forward && state.speed <= 0.25 && state.gear <= 0) state.gear = 1;
    if (back && state.speed <= 0.25 && state.gear >= 0) state.gear = -1;

    const gear = state.gear;
    const max = gearMax[gear];
    const torque = gearTorque[gear];
    const speedAbs = Math.abs(state.speed);

    if (forward && fuelOK) {
      if (gear > 0) {
        const fade = E.clamp(1 - state.speed / Math.max(1, max), 0.18, 1);
        state.speed += torque * fade * dt;
      } else if (gear === -1 && state.speed < 0) {
        state.speed += 18 * dt;
      }
    }

    if (back && fuelOK) {
      if (gear === -1) {
        const fade = E.clamp(1 - Math.abs(state.speed) / Math.max(1, gearMax[-1]), 0.24, 1);
        state.speed -= gearTorque[-1] * fade * dt;
      } else if (state.speed > 0) {
        state.speed -= 20 * dt;
      }
    }

    if (!forward && !back) {
      const drag = 1.35 + speedAbs * 0.055 + speedAbs * speedAbs * 0.002;
      if (state.speed > 0) state.speed = Math.max(0, state.speed - drag * dt);
      if (state.speed < 0) state.speed = Math.min(0, state.speed + drag * dt);
    }

    if (handbrake) {
      const brake = 30 * dt;
      if (state.speed > 0) state.speed = Math.max(0, state.speed - brake);
      if (state.speed < 0) state.speed = Math.min(0, state.speed + brake);
    }

    if (Math.abs(state.speed) > 0.1 || forward || back) state.speed -= slope * 2.4 * dt;

    if (gear > 0) {
      state.speed = E.clamp(state.speed, 0, max);
    } else if (gear === -1) {
      state.speed = E.clamp(state.speed, -gearMax[-1], 0);
    } else {
      state.speed *= Math.max(0, 1 - dt * 1.8);
    }

    if (Math.abs(state.speed) < 0.035 && !forward && !back) state.speed = 0;

    const wheelBase = 2.85;
    const steerLimit = (0.60 / (1 + Math.abs(state.speed) / 34)) * state.steeringSensitivity;
    const steerAngle = state.steer * steerLimit;
    if (Math.abs(state.speed) > 0.02) {
      state.yaw += (state.speed / wheelBase) * Math.tan(steerAngle) * dt;
    }

    const carForward = new THREE.Vector3(Math.sin(state.yaw), 0, Math.cos(state.yaw));
    state.pos.addScaledVector(carForward, state.speed * dt);

    const post = projectToRoad(state.pos, state.s + Math.max(state.speed, 0) * dt);
    state.s = post.s;
    state.lane = E.clamp(post.lane, -config.roadHalf - 18, config.roadHalf + 18);
    state.pos.y = E.lerp(state.pos.y, post.basis.point.y + 0.48, 0.35);

    if (Math.abs(post.lane) > config.roadHalf + 18) {
      const clamped = post.basis.point.clone().addScaledVector(post.basis.right, state.lane);
      state.pos.x = clamped.x;
      state.pos.z = clamped.z;
    }

    const offroad = Math.max(0, Math.abs(state.lane) - (config.roadHalf - 0.1));
    if (offroad > 0) state.speed *= Math.max(0.72, 1 - offroad * dt * 0.18);

    const traveled = Math.abs(state.speed) * dt;
    state.distanceKm += traveled / 1000;
    let inst = 17.2 - Math.abs(state.speed) * 0.11 - Math.abs(state.steer) * 0.8 - offroad * 1.0 - Math.abs(slope) * 6;
    if (state.currentZone.key === "snow") inst -= 0.9;
    if (state.currentZone.key === "desert") inst -= 0.5;
    state.instantMileage = Math.max(4.5, inst);

    const fuelStep = traveled > 0 && fuelOK ? (traveled / 1000) / state.instantMileage * state.fuelBurn : 0;
    state.fuel = Math.max(0, state.fuel - fuelStep);
    state.fuelUsed += fuelStep;
    state.avgMileage = state.fuelUsed > 0 ? state.distanceKm / state.fuelUsed : 0;

    const ratioMax = gear === 0 ? 1 : Math.max(1, gearMax[gear]);
    const throttleActive = forward || back;
    const rpmTarget = gear === 0
      ? 850 + (throttleActive ? 2200 : 0)
      : 850 + E.clamp(Math.abs(state.speed) / ratioMax, 0, 1.18) * 5200 + (throttleActive ? 420 : 0);
    state.rpm = E.lerp(state.rpm, E.clamp(rpmTarget, 800, 6900), dt * 5.5);

    state.currentZone = zoneForS(state.s);
    state.nearest = nearestStation();
    state.nearStation = nearStation();

    if (state.fuel <= 0.0005 && Math.abs(state.speed) < 0.3) gameOver();
  }

  function render(alpha, rawDt) {
    quality.update(rawDt);
    ensureWorld();
    updateTraffic(rawDt);
    updateLighting(rawDt);
    updateAnimated(performance.now() * 0.001);

    const pos = state.prevPos.clone().lerp(state.pos, alpha);
    const yaw = E.angleLerp(state.prevYaw, state.yaw, alpha);
    const steer = E.lerp(state.prevSteer, state.steer, alpha);
    const roadBasis = basisAt(state.s);

    car.group.position.copy(pos);
    car.group.rotation.set(-roadBasis.pitch, yaw, -steer * 0.035);
    car.frontRoots.forEach((r) => { r.rotation.y = steer * 0.52; });
    car.wheelMeshes.forEach((w) => { w.rotation.x -= state.speed * rawDt * 7.5; });
    car.beams.forEach((beam) => { beam.visible = state.lights; });

    const carForward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const carRight = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const camModes = [
      { dist: state.cameraDistance, height: 4.6, ahead: 14 },
      { dist: state.cameraDistance + 4.5, height: 6.8, ahead: 24 },
      { dist: state.cameraDistance - 1.8, height: 3.4, ahead: 11 }
    ];
    const mode = camModes[state.cameraMode % camModes.length];
    const desired = pos.clone()
      .addScaledVector(carForward, -mode.dist)
      .add(new THREE.Vector3(0, mode.height, 0))
      .addScaledVector(carRight, steer * 0.45);
    camera.position.lerp(desired, 0.12);
    camera.lookAt(pos.clone().addScaledVector(carForward, mode.ahead).add(new THREE.Vector3(0, 1.45, 0)));

    const now = performance.now() * 0.001;
    materials.water.uniforms.time.value = now;

    state.hudTimer += rawDt;
    state.mapTimer += rawDt;
    if (state.hudTimer > 0.1) {
      state.hudTimer = 0;
      updateHUD();
    }
    if (state.mapTimer > 0.24) {
      state.mapTimer = 0;
      drawMiniMap();
    }

    if (performance.now() > state.hornUntil) $("honkText").classList.remove("active");

    renderer.render(scene, camera);
  }

  function updateTraffic(dt) {
    for (const t of world.traffic) {
      t.s += t.speed * dt;
      if (t.s < state.s - 220 || t.s > state.s + 2300) {
        t.s = state.s + 220 + E.rand(performance.now() * 0.001 + t.speed) * 2100;
        t.lane = E.rand(t.s) > 0.5 ? -2.8 : 2.8;
        t.speed = 8 + E.rand(t.s + 9.7) * 16;
      }
      const b = basisAt(t.s);
      const p = b.point.clone().addScaledVector(b.right, t.lane);
      p.y += 0.45;
      t.car.group.position.copy(p);
      t.car.group.rotation.set(-b.pitch, b.yaw, 0);
      t.car.wheelMeshes.forEach((w) => { w.rotation.x -= t.speed * dt * 6; });
    }
  }

  function updateAnimated(time) {
    for (const item of world.animated) {
      if (!item.obj.parent) continue;
      item.obj.rotation.z = item.base + Math.sin(time * 1.8 + item.phase) * item.amp;
    }
  }

  function updateLighting(dt) {
    if (state.timeMode === "auto") state.dayPhase = (state.dayPhase + dt * 0.017) % 1;
    else state.dayPhase = E.lerp(state.dayPhase, state.timeMode === "day" ? 0.18 : 0.82, 0.04);

    const angle = state.dayPhase * Math.PI * 2;
    const daylight = E.clamp((Math.sin(angle) + 0.12) / 1.12, 0, 1);
    const night = 1 - daylight;
    const z = state.currentZone;
    const sky = new THREE.Color(z.sky).lerp(new THREE.Color(0x07101f), night * 0.94);
    const fog = new THREE.Color(z.fog).lerp(new THREE.Color(0x111a2e), night * 0.94);
    renderer.setClearColor(sky);
    scene.fog.color.copy(fog);
    scene.fog.far = z.key === "beach" ? 950 : z.key === "city" ? 720 : 850;
    hemi.intensity = 0.5 + daylight * 0.85;
    sun.intensity = daylight * 1.15;
    moon.intensity = 0.12 + night * 0.6;

    const p = state.pos;
    sun.position.set(p.x - 90, p.y + 110, p.z - 60);
    moon.position.set(p.x + 90, p.y + 80, p.z + 20);
    sunBall.position.set(p.x - 130, p.y + 90, p.z + 320);
    moonBall.position.set(p.x + 120, p.y + 74, p.z + 340);
    sunBall.visible = daylight > 0.06;
    moonBall.visible = night > 0.25;
  }

  function resetGame() {
    state.s = 0;
    state.lane = 0;
    state.speed = 0;
    state.steer = 0;
    state.prevSteer = 0;
    state.fuel = 5;
    state.fuelUsed = 0;
    state.distanceKm = 0;
    state.avgMileage = 0;
    state.instantMileage = 0;
    state.rpm = 800;
    state.gear = 0;
    state.currentZone = zones[0];
    state.nearStation = null;
    const b = basisAt(0);
    state.pos.copy(b.point).add(new THREE.Vector3(0, 0.48, 0));
    state.prevPos.copy(state.pos);
    state.yaw = b.yaw;
    state.prevYaw = state.yaw;

    for (const [, g] of world.chunks) scene.remove(g);
    world.chunks.clear();
    world.buildQueue = [];
    for (const [, g] of world.stationMeshes) scene.remove(g);
    world.stationMeshes.clear();
    world.stations = [];
    world.nextStationS = 360;
    world.animated = [];
    for (let i = 0; i < 20; i++) ensureWorld();
    initTraffic();
    updateHUD();
    drawMiniMap();
  }

  function updateHUD() {
    const nearest = state.nearest || nearestStation();
    const dist = nearest ? nearest.dist : 0;
    const name = nearest ? nearest.station.name : "--";
    const kmh = Math.round(Math.abs(state.speed) * 3.6);

    $("zoneText").textContent = state.currentZone.label;
    $("nextText").textContent = nextZoneText();
    $("petrolText").textContent = `${name} ${(dist / 1000).toFixed(1)} km`;
    $("timeText").textContent = state.timeMode === "auto" ? "Auto" : (state.timeMode === "day" ? "Day" : "Night");
    $("fpsText").textContent = `${Math.round(perf.fps)} fps`;

    $("speedTop").textContent = `${kmh} km/h`;
    $("rpmTop").textContent = String(Math.round(state.rpm));
    $("gearTop").textContent = gearLabel(state.gear);
    $("fuelTop").textContent = `${state.fuel.toFixed(1)} L`;
    $("distanceTop").textContent = `${state.distanceKm.toFixed(2)} km`;
    $("avgTop").textContent = `${(state.avgMileage || 0).toFixed(1)} km/L`;

    const fuelLabel = state.fuel < 1.5 ? "Critical fuel" : state.fuel < 6 ? "Low fuel" : "Fuel healthy";
    $("fuelState").textContent = fuelLabel;
    $("fuelState").style.color = state.fuel < 1.5 ? "var(--red)" : state.fuel < 6 ? "var(--yellow)" : "var(--green)";

    $("speedValue").textContent = kmh;
    $("rpmValue").textContent = String(Math.round(state.rpm));
    $("fuelValue").textContent = state.fuel.toFixed(1);
    $("tripText").textContent = `${state.distanceKm.toFixed(2)} km driven`;
    $("tripSub").textContent = `Gear ${gearLabel(state.gear)} · Avg ${(state.avgMileage || 0).toFixed(1)} km/L`;
    $("speedGauge").style.setProperty("--fill", `${E.clamp(kmh / 210 * 292, 0, 292).toFixed(1)}deg`);
    $("rpmGauge").style.setProperty("--fill", `${E.clamp(state.rpm / 7000 * 292, 0, 292).toFixed(1)}deg`);
    $("fuelGauge").style.setProperty("--fill", `${E.clamp(state.fuel / state.fuelCapacity * 292, 0, 292).toFixed(1)}deg`);
    $("steeringWheel").style.transform = `rotate(${(state.steer * 95).toFixed(1)}deg)`;

    $("mapMeta").innerHTML = `Nearest petrol bunk: <strong>${name} ${(dist / 1000).toFixed(1)} km</strong><br>Average mileage: <strong>${(state.avgMileage || 0).toFixed(1)} km/L</strong>`;

    const promptVisible = state.nearStation && performance.now() > state.stationPromptUntil && state.running;
    $("stationPrompt").classList.toggle("hidden", !promptVisible);
    if (promptVisible) {
      $("stationPromptTitle").textContent = `${state.nearStation.name} nearby`;
      $("stationPromptText").textContent = "You are stopped close enough to refuel. Press R or open the refuel modal.";
    }

    $("refuelFuel").textContent = `${state.fuel.toFixed(1)} L`;
    $("refuelNeed").textContent = `${(state.fuelCapacity - state.fuel).toFixed(1)} L`;
    $("refuelStation").textContent = state.nearStation ? state.nearStation.name : "--";
  }

  function nextZoneText() {
    const z = state.currentZone;
    if (z.end === Infinity) return z.next;
    return `${z.next} in ${Math.max(0, (z.end - state.s) / 1000).toFixed(1)} km`;
  }

  const miniCtx = $("miniMap").getContext("2d");
  const bigCtx = $("bigMap").getContext("2d");

  function drawMap(ctx, w, h, large) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#06111c";
    ctx.fillRect(0, 0, w, h);
    const margin = large ? 34 : 14;
    const sMin = Math.max(0, state.s - (large ? 650 : 180));
    const sMax = state.s + (large ? 6500 : 2200);
    const y0 = h - margin, y1 = margin;
    const scaleX = large ? 2.3 : 1.15;
    const toY = (s) => y0 - (s - sMin) / (sMax - sMin) * (y0 - y1);
    const toX = (s) => w * 0.5 + (roadX(s) - roadX(state.s)) * scaleX;

    for (const z of zones) {
      const a = Math.max(z.start, sMin), b = Math.min(z.end, sMax);
      if (b <= a) continue;
      const colors = { city: "#263442", forest: "#153b2a", beach: "#0b3448", desert: "#4b2a19", snow: "#2e4350", neon: "#20164a" };
      ctx.fillStyle = colors[z.key];
      ctx.fillRect(0, toY(b), w, toY(a) - toY(b));
      ctx.fillStyle = "rgba(255,255,255,.65)";
      ctx.font = large ? "14px sans-serif" : "10px sans-serif";
      ctx.fillText(z.label.toUpperCase(), 10, E.clamp(toY((a + b) / 2), 18, h - 10));
    }

    ctx.strokeStyle = "#f5e6a4";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = large ? 7 : 5;
    ctx.beginPath();
    for (let i = 0; i <= 160; i++) {
      const s = E.lerp(sMin, sMax, i / 160);
      const x = toX(s), y = toY(s);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ensureStations(sMax + 1000);
    for (const st of world.stations) {
      if (st.s < sMin || st.s > sMax) continue;
      const x = toX(st.s) + st.side * (large ? 22 : 10);
      const y = toY(st.s);
      ctx.fillStyle = "#6ee7ff";
      ctx.beginPath();
      ctx.arc(x, y, large ? 5 : 4, 0, Math.PI * 2);
      ctx.fill();
      if (large) {
        ctx.fillStyle = "rgba(255,255,255,.9)";
        ctx.font = "12px sans-serif";
        ctx.fillText(st.name, x + 10, y + 4);
      }
    }

    const px = toX(state.s) + state.lane * (large ? 2 : 1.15);
    const py = toY(state.s);
    ctx.fillStyle = "#ff6677";
    ctx.beginPath();
    ctx.moveTo(px, py - 12);
    ctx.lineTo(px - 8, py + 10);
    ctx.lineTo(px + 8, py + 10);
    ctx.closePath();
    ctx.fill();
  }

  function drawMiniMap() {
    drawMap(miniCtx, $("miniMap").width, $("miniMap").height, false);
  }

  function drawBigMap() {
    drawMap(bigCtx, $("bigMap").width, $("bigMap").height, true);
    const nearest = state.nearest || nearestStation();
    $("bigMapSummary").textContent = nearest
      ? `Nearest petrol bunk: ${nearest.station.name} (${(nearest.dist / 1000).toFixed(2)} km). Current zone: ${state.currentZone.label}.`
      : "No petrol bunk found.";
  }

  function openModal(name, returnTo) {
    ["menu", "pause", "settings", "help", "map", "refuel", "gameOver"].forEach((id) => {
      const el = $(id + "Layer");
      if (el) el.classList.remove("active");
    });
    const layer = name === "gameOver" ? $("gameOverLayer") : $(name + "Layer");
    if (layer) layer.classList.add("active");
    state.modal = name;
    if (returnTo) state.returnTo = returnTo;
    state.running = false;
    if (name === "map") drawBigMap();
  }

  function closeModal(resume) {
    ["menuLayer", "pauseLayer", "settingsLayer", "helpLayer", "mapLayer", "refuelLayer", "gameOverLayer"].forEach((id) => $(id).classList.remove("active"));
    state.modal = null;
    if (state.started && resume) state.running = true;
  }

  function backModal() {
    if (state.returnTo === "game") closeModal(true);
    else openModal(state.returnTo || "menu");
  }

  function startDrive() {
    state.started = true;
    resetGame();
    closeModal(true);
  }

  function goMenu() {
    state.started = false;
    state.running = false;
    openModal("menu");
  }

  function gameOver() {
    if (state.modal === "gameOver") return;
    openModal("gameOver");
  }

  function setTimeMode(mode) {
    state.timeMode = mode;
    $("timeModeSelect").value = mode;
    document.querySelectorAll(".timeBtn").forEach((btn) => btn.classList.toggle("active", btn.dataset.mode === mode));
  }

  let audioCtx = null;
  function horn() {
    $("honkText").classList.add("active");
    state.hornUntil = performance.now() + 380;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(240, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.32);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.34);
    } catch (err) {}
  }

  function tryRefuel() {
    const st = nearStation();
    if (st) {
      state.nearStation = st;
      $("refuelLead").textContent = `You are stopped beside ${st.name}. Fill the tank and continue.`;
      openModal("refuel", "game");
    }
  }

  function bindUI() {
    addEventListener("resize", () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    addEventListener("keydown", (e) => {
      if (e.repeat) return;
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") { shift(1); e.preventDefault(); }
      if (e.code === "ControlLeft" || e.code === "ControlRight") { shift(-1); e.preventDefault(); }
      if (e.code === "KeyH") state.lights = !state.lights;
      if (e.code === "KeyG") horn();
      if (e.code === "KeyC") state.cameraMode = (state.cameraMode + 1) % 3;
      if (e.code === "KeyR" && state.started) tryRefuel();
      if (e.code === "KeyM" && state.started) {
        if (state.modal === "map") backModal();
        else if (!state.modal) openModal("map", "game");
      }
      if (e.code === "Escape") {
        if (state.modal === "menu") return;
        if (state.modal) backModal();
        else if (state.started) openModal("pause", "game");
      }
    }, { passive: false });

    $("startBtn").onclick = startDrive;
    $("resumeBtn").onclick = () => closeModal(true);
    $("restartBtn").onclick = startDrive;
    $("mainMenuBtn").onclick = () => openModal("menu", "game");
    $("pauseBtn").onclick = () => state.started && openModal("pause", "game");
    $("mapBtn").onclick = () => state.started && openModal("map", "game");
    $("menuMapBtn").onclick = () => openModal("map", "menu");
    $("pauseMapBtn").onclick = () => openModal("map", "pause");
    $("settingsBtn").onclick = () => openModal("settings", "menu");
    $("pauseSettingsBtn").onclick = () => openModal("settings", "pause");
    $("helpBtn").onclick = () => openModal("help", "menu");
    $("pauseMenuBtn").onclick = goMenu;
    $("settingsBackBtn").onclick = backModal;
    $("helpBackBtn").onclick = backModal;
    $("mapBackBtn").onclick = backModal;
    $("cancelRefuelBtn").onclick = backModal;
    $("gameOverRestartBtn").onclick = startDrive;
    $("gameOverMenuBtn").onclick = goMenu;
    $("promptDismissBtn").onclick = () => {
      state.stationPromptUntil = performance.now() + 9000;
      $("stationPrompt").classList.add("hidden");
    };
    $("promptRefuelBtn").onclick = tryRefuel;
    $("confirmRefuelBtn").onclick = () => {
      if (state.nearStation) {
        state.fuel = state.fuelCapacity;
        backModal();
      }
    };
    $("timeModeSelect").onchange = (e) => setTimeMode(e.target.value);
    $("steerRange").oninput = (e) => state.steeringSensitivity = parseFloat(e.target.value);
    $("fuelRange").oninput = (e) => state.fuelBurn = parseFloat(e.target.value);
    $("cameraRange").oninput = (e) => state.cameraDistance = parseFloat(e.target.value);
    document.querySelectorAll(".timeBtn").forEach((btn) => btn.onclick = () => setTimeMode(btn.dataset.mode));
  }

  bindUI();
  setTimeMode("day");
  resetGame();

  const loop = new E.FixedLoop({
    fixedDt: 1 / 60,
    maxSteps: 4,
    update: fixedUpdate,
    render,
    onFrame: (rawDt) => perf.update(rawDt)
  });
  loop.start();

  window.__driveDebug = () => ({
    fps: Math.round(perf.fps),
    minFps: Math.round(perf.minFps),
    frameSpikeCount: perf.frameSpikeCount,
    chunks: world.chunks.size,
    queue: world.buildQueue.length,
    speedKmh: Math.round(Math.abs(state.speed) * 3.6),
    gear: gearLabel(state.gear),
    fuel: state.fuel.toFixed(2),
    zone: state.currentZone.label,
    lane: state.lane.toFixed(2)
  });
})();
