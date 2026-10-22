import * as THREE from "three";
import { moodAt } from "./mood.js";
import { dotTexture, glowTexture, glyphTexture, petalTexture, rayTexture } from "./textures.js";

const MOBILE = matchMedia("(max-width: 768px), (pointer: coarse)").matches;
const PATH_LENGTH = 420;
const START_Z = 30;

// ---------------------------------------------------------------------------
// Noise + terrain
// ---------------------------------------------------------------------------

const hash = (x, y) => {
	const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return s - Math.floor(s);
};

const noise = (x, y) => {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = x - xi;
	const yf = y - yi;
	const u = xf * xf * (3 - 2 * xf);
	const v = yf * yf * (3 - 2 * yf);
	const a = hash(xi, yi);
	const b = hash(xi + 1, yi);
	const c = hash(xi, yi + 1);
	const d = hash(xi + 1, yi + 1);
	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

const fbm = (x, y) => {
	let sum = 0;
	let amp = 0.5;
	let freq = 1;
	for (let i = 0; i < 5; i++) {
		sum += amp * noise(x * freq, y * freq);
		freq *= 2.03;
		amp *= 0.5;
	}
	return sum;
};

const smoothstep = (a, b, x) => {
	const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
	return t * t * (3 - 2 * t);
};

// The valley meanders gently; the camera follows its centre line.
const pathX = (z) => Math.sin(z * 0.011) * 12 + Math.sin(z * 0.004 + 1.3) * 6;

const terrainHeight = (x, z) => {
	const valley = smoothstep(9, 70, Math.abs(x - pathX(z)));
	return fbm(x * 0.022 + 7, z * 0.022) * 62 * valley ** 1.4 + noise(x * 0.12, z * 0.12) * 1.4 - 2;
};

const rand = (min, max) => min + Math.random() * (max - min);

// ---------------------------------------------------------------------------
// Drifting particles (snow, embers, petals)
// ---------------------------------------------------------------------------

class Drift {
	constructor({ count, color, size, map, blending, fall, sway, range }) {
		this.range = range;
		this.fall = fall;
		this.sway = sway;
		this.positions = new Float32Array(count * 3);
		this.phase = new Float32Array(count);
		for (let i = 0; i < count; i++) {
			this.positions[i * 3] = rand(-range.x, range.x);
			this.positions[i * 3 + 1] = rand(-range.y, range.y);
			this.positions[i * 3 + 2] = rand(-range.z, range.z) - 30 + START_Z;
			this.phase[i] = Math.random() * Math.PI * 2;
		}
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
		this.material = new THREE.PointsMaterial({
			color,
			size,
			map,
			transparent: true,
			depthWrite: false,
			blending: blending ?? THREE.NormalBlending,
			opacity: 0,
		});
		this.points = new THREE.Points(geometry, this.material);
		this.points.frustumCulled = false;
	}

	update(dt, t, center, opacity) {
		this.material.opacity = opacity;
		this.points.visible = opacity > 0.01;
		if (!this.points.visible) return;
		const { x: rx, y: ry, z: rz } = this.range;
		const p = this.positions;
		for (let i = 0; i < p.length; i += 3) {
			const ph = this.phase[i / 3];
			p[i] += Math.sin(t * 0.7 + ph) * this.sway * dt;
			p[i + 1] += this.fall * dt * (0.6 + 0.4 * Math.sin(ph));
			p[i + 2] += Math.cos(t * 0.5 + ph) * this.sway * 0.5 * dt;
			if (p[i] - center.x > rx) p[i] -= 2 * rx;
			else if (p[i] - center.x < -rx) p[i] += 2 * rx;
			if (p[i + 1] - center.y > ry) p[i + 1] -= 2 * ry;
			else if (p[i + 1] - center.y < -ry) p[i + 1] += 2 * ry;
			if (p[i + 2] - center.z > rz) p[i + 2] -= 2 * rz;
			else if (p[i + 2] - center.z < -rz) p[i + 2] += 2 * rz;
		}
		this.points.geometry.attributes.position.needsUpdate = true;
	}
}

// ---------------------------------------------------------------------------
// World
// ---------------------------------------------------------------------------

export function createWorld(canvas) {
	const renderer = new THREE.WebGLRenderer({
		canvas,
		antialias: !MOBILE || window.devicePixelRatio < 2,
		powerPreference: "high-performance",
	});
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, MOBILE ? 1.6 : 2));
	renderer.toneMapping = THREE.ACESFilmicToneMapping;

	const scene = new THREE.Scene();
	scene.fog = new THREE.Fog(0xffd3dd, 40, 300);

	const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1400);

	// --- Sky dome -----------------------------------------------------------
	const skyUniforms = {
		top: { value: new THREE.Color() },
		mid: { value: new THREE.Color() },
		bottom: { value: new THREE.Color() },
		sunColor: { value: new THREE.Color() },
		sunDir: { value: new THREE.Vector3(0, 0.1, -1).normalize() },
		sunGlow: { value: 1 },
	};
	const sky = new THREE.Mesh(
		new THREE.SphereGeometry(1000, 32, 16),
		new THREE.ShaderMaterial({
			uniforms: skyUniforms,
			side: THREE.BackSide,
			depthWrite: false,
			fog: false,
			vertexShader: /* glsl */ `
				varying vec3 vDir;
				void main() {
					vDir = normalize(position);
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}`,
			fragmentShader: /* glsl */ `
				uniform vec3 top;
				uniform vec3 mid;
				uniform vec3 bottom;
				uniform vec3 sunColor;
				uniform vec3 sunDir;
				uniform float sunGlow;
				varying vec3 vDir;
				void main() {
					vec3 dir = normalize(vDir);
					float h = dir.y;
					vec3 c = mix(bottom, mid, smoothstep(-0.04, 0.16, h));
					c = mix(c, top, smoothstep(0.16, 0.75, h));
					float s = max(dot(dir, sunDir), 0.0);
					c += sunColor * (pow(s, 6.0) * 0.28 + pow(s, 48.0) * 0.55) * sunGlow;
					gl_FragColor = vec4(c, 1.0);
					#include <tonemapping_fragment>
					#include <colorspace_fragment>
				}`,
		}),
	);
	sky.renderOrder = -1;
	scene.add(sky);

	// --- Lights -------------------------------------------------------------
	const hemi = new THREE.HemisphereLight(0xffe6ef, 0xc77a9c, 1.1);
	const sunLight = new THREE.DirectionalLight(0xffffff, 2);
	scene.add(hemi, sunLight, sunLight.target);

	// --- Sun ----------------------------------------------------------------
	const glowMap = glowTexture();
	const sunHalo = new THREE.Sprite(
		new THREE.SpriteMaterial({
			map: glowMap,
			blending: THREE.AdditiveBlending,
			depthWrite: false,
			fog: false,
			transparent: true,
		}),
	);
	const sunCore = new THREE.Sprite(
		new THREE.SpriteMaterial({
			map: glowMap,
			color: 0xfffaf0,
			depthWrite: false,
			fog: false,
			transparent: true,
		}),
	);
	scene.add(sunHalo, sunCore);

	// Sun rays — a slow-turning fan of soft blades behind the sun.
	const rays = new THREE.Group();
	const rayMaterial = new THREE.MeshBasicMaterial({
		map: rayTexture(),
		blending: THREE.AdditiveBlending,
		transparent: true,
		depthWrite: false,
		fog: false,
		side: THREE.DoubleSide,
	});
	const rayGeometry = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
	const RAY_COUNT = 16;
	for (let i = 0; i < RAY_COUNT; i++) {
		const ray = new THREE.Mesh(rayGeometry, rayMaterial);
		ray.rotation.z = (i / RAY_COUNT) * Math.PI * 2;
		ray.scale.set(i % 2 ? 18 : 30, i % 2 ? 260 : 380, 1);
		rays.add(ray);
	}
	scene.add(rays);

	// --- Terrain ------------------------------------------------------------
	const TERRAIN_W = 420;
	const TERRAIN_L = 860;
	const terrainGeo = new THREE.PlaneGeometry(
		TERRAIN_W,
		TERRAIN_L,
		MOBILE ? 96 : 150,
		MOBILE ? 210 : 330,
	)
		.rotateX(-Math.PI / 2)
		.translate(0, 0, START_Z + 90 - TERRAIN_L / 2)
		.toNonIndexed();
	{
		const pos = terrainGeo.attributes.position;
		const colors = new Float32Array(pos.count * 3);
		const low = new THREE.Color("#f7a6c2");
		const mid = new THREE.Color("#d885b0");
		const high = new THREE.Color("#a77bb4");
		const peak = new THREE.Color("#fff1f6");
		const c = new THREE.Color();
		for (let i = 0; i < pos.count; i++) {
			const x = pos.getX(i);
			const z = pos.getZ(i);
			const y = terrainHeight(x, z);
			pos.setY(i, y);
		}
		// Colour per face so the low-poly facets read crisply.
		for (let i = 0; i < pos.count; i += 3) {
			const y = (pos.getY(i) + pos.getY(i + 1) + pos.getY(i + 2)) / 3;
			const jitter = (hash(pos.getX(i), pos.getZ(i)) - 0.5) * 0.08;
			if (y < 8) c.copy(low).lerp(mid, smoothstep(-2, 8, y) + jitter);
			else if (y < 28) c.copy(mid).lerp(high, smoothstep(8, 28, y) + jitter);
			else c.copy(high).lerp(peak, smoothstep(28, 40, y) + jitter);
			for (let k = 0; k < 3; k++) c.toArray(colors, (i + k) * 3);
		}
		terrainGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
		terrainGeo.computeVertexNormals();
	}
	const terrain = new THREE.Mesh(
		terrainGeo,
		new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }),
	);
	scene.add(terrain);

	// A glassy pink river that pools in the valley floor.
	const water = new THREE.Mesh(
		new THREE.PlaneGeometry(TERRAIN_W, TERRAIN_L).rotateX(-Math.PI / 2),
		new THREE.MeshStandardMaterial({
			color: 0xffc2d6,
			roughness: 0.2,
			metalness: 0,
			transparent: true,
			opacity: 0.85,
		}),
	);
	water.position.set(0, -1.15, START_Z + 90 - TERRAIN_L / 2);
	scene.add(water);

	// --- Blossom trees ------------------------------------------------------
	const TREE_COUNT = MOBILE ? 160 : 320;
	const trunks = new THREE.InstancedMesh(
		new THREE.CylinderGeometry(0.18, 0.28, 2.2, 5).translate(0, 1.1, 0),
		new THREE.MeshStandardMaterial({ color: 0x8a5a6e, flatShading: true }),
		TREE_COUNT,
	);
	const canopies = new THREE.InstancedMesh(
		new THREE.IcosahedronGeometry(1.5, 0),
		new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.8 }),
		TREE_COUNT,
	);
	{
		const m = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const s = new THREE.Vector3();
		const p = new THREE.Vector3();
		const blossom = ["#ffb7d0", "#ff9fc0", "#ffd3e2", "#fbc4ff", "#ffe4ec"].map(
			(h) => new THREE.Color(h),
		);
		let placed = 0;
		while (placed < TREE_COUNT) {
			const z = rand(START_Z + 40, START_Z - PATH_LENGTH - 160);
			const side = Math.random() < 0.5 ? -1 : 1;
			const x = pathX(z) + side * rand(7, 46);
			const y = terrainHeight(x, z);
			if (y > 16 || y < -1) continue;
			const scale = rand(0.7, 1.5);
			s.setScalar(scale);
			q.setFromEuler(new THREE.Euler(0, Math.random() * Math.PI, 0));
			trunks.setMatrixAt(placed, m.compose(p.set(x, y - 0.2, z), q, s));
			canopies.setMatrixAt(placed, m.compose(p.set(x, y + 2.6 * scale, z), q, s));
			canopies.setColorAt(placed, blossom[placed % blossom.length]);
			placed++;
		}
	}
	scene.add(trunks, canopies);

	// --- Clouds -------------------------------------------------------------
	const puff = new THREE.IcosahedronGeometry(1, 1);
	const makeClouds = ({ clusters, color, yMin, yMax, spread, size }) => {
		const PUFFS = 6;
		const material = new THREE.MeshStandardMaterial({
			color,
			flatShading: true,
			roughness: 1,
			transparent: true,
			depthWrite: false,
		});
		const mesh = new THREE.InstancedMesh(puff, material, clusters * PUFFS);
		const m = new THREE.Matrix4();
		const q = new THREE.Quaternion();
		const s = new THREE.Vector3();
		const p = new THREE.Vector3();
		let i = 0;
		for (let c = 0; c < clusters; c++) {
			const z = rand(START_Z + 60, START_Z - PATH_LENGTH - 260);
			const x = pathX(z) + rand(-spread, spread);
			const y = rand(yMin, yMax);
			const base = rand(size * 0.7, size * 1.3);
			for (let k = 0; k < PUFFS; k++) {
				const r = base * rand(0.55, 1);
				p.set(
					x + (k - PUFFS / 2) * base * 0.75,
					y + rand(-0.4, 0.6) * base,
					z + rand(-1, 1) * base,
				);
				s.set(r * 1.25, r, r);
				mesh.setMatrixAt(i++, m.compose(p, q, s));
			}
		}
		return mesh;
	};
	const fairClouds = makeClouds({
		clusters: MOBILE ? 40 : 70,
		color: 0xfff3f8,
		yMin: 30,
		yMax: 62,
		spread: 140,
		size: 4.5,
	});
	const stormClouds = makeClouds({
		clusters: MOBILE ? 45 : 80,
		color: 0xa898b6,
		yMin: 16,
		yMax: 30,
		spread: 90,
		size: 5,
	});
	scene.add(fairClouds, stormClouds);

	// --- Floating math solids ----------------------------------------------
	const palette = ["#ff8fb8", "#ffc1d6", "#ffb38a", "#d9a6ff", "#ffe08a"];
	const grey = new THREE.Color("#9a8c99");
	const solidMaterials = palette.map(
		(hex) =>
			new THREE.MeshStandardMaterial({
				color: hex,
				flatShading: true,
				roughness: 0.35,
				metalness: 0.15,
				emissive: hex,
				emissiveIntensity: 0.12,
			}),
	);
	const solidTargets = palette.map((hex) => new THREE.Color(hex));
	const geometries = [
		new THREE.IcosahedronGeometry(1, 0),
		new THREE.OctahedronGeometry(1, 0),
		new THREE.TorusGeometry(0.85, 0.32, 10, 24),
		new THREE.TorusKnotGeometry(0.7, 0.22, 64, 8),
		new THREE.DodecahedronGeometry(1, 0),
		new THREE.TetrahedronGeometry(1.1, 0),
	];
	const solids = [];
	const SOLID_COUNT = MOBILE ? 34 : 54;
	for (let i = 0; i < SOLID_COUNT; i++) {
		const mesh = new THREE.Mesh(
			geometries[i % geometries.length],
			solidMaterials[i % solidMaterials.length],
		);
		const z = START_Z - 24 - (i / SOLID_COUNT) * (PATH_LENGTH + 60) + rand(-4, 4);
		const side = i % 2 ? 1 : -1;
		mesh.position.set(pathX(z) + side * rand(4.5, 16), rand(5, 15), z);
		mesh.scale.setScalar(rand(0.6, 1.5));
		mesh.userData = { spin: rand(0.2, 0.7), bob: rand(0, Math.PI * 2), y: mesh.position.y };
		solids.push(mesh);
		scene.add(mesh);
	}

	// --- Bugs (they scatter once Math shows up) -----------------------------
	const BUG_COUNT = MOBILE ? 60 : 110;
	const bugMaterial = new THREE.MeshStandardMaterial({
		color: 0x3a2c3c,
		flatShading: true,
		transparent: true,
	});
	const bugs = new THREE.InstancedMesh(
		new THREE.TetrahedronGeometry(0.22, 0),
		bugMaterial,
		BUG_COUNT,
	);
	bugs.frustumCulled = false;
	const bugSeeds = Array.from({ length: BUG_COUNT }, () => {
		const z = rand(START_Z - 18, START_Z - 80);
		return {
			x: pathX(z) + rand(-12, 12),
			y: rand(4, 14),
			z,
			phase: Math.random() * Math.PI * 2,
			speed: rand(2, 5),
		};
	});
	scene.add(bugs);

	// --- Question marks & exclamations ("Let's fix this!") -----------------
	const glyphs = [];
	const glyphMaterials = ["?", "!", "?", "✦"].map(
		(g) =>
			new THREE.SpriteMaterial({
				map: glyphTexture(g),
				transparent: true,
				depthWrite: false,
				fog: false,
			}),
	);
	for (let i = 0; i < (MOBILE ? 22 : 36); i++) {
		const sprite = new THREE.Sprite(glyphMaterials[i % glyphMaterials.length]);
		const z = rand(-185, -320);
		sprite.position.set(pathX(z) + rand(-14, 14), rand(5, 16), z);
		sprite.scale.setScalar(rand(1.6, 3));
		sprite.userData = { y: sprite.position.y, phase: Math.random() * Math.PI * 2 };
		glyphs.push(sprite);
		scene.add(sprite);
	}

	// --- Particles ----------------------------------------------------------
	const dot = dotTexture();
	const snow = new Drift({
		count: MOBILE ? 900 : 1800,
		color: 0xffffff,
		size: 0.45,
		map: dot,
		fall: -3.2,
		sway: 1.2,
		range: { x: 50, y: 22, z: 55 },
	});
	const embers = new Drift({
		count: MOBILE ? 350 : 700,
		color: 0xffcf8a,
		size: 0.55,
		map: dot,
		blending: THREE.AdditiveBlending,
		fall: 1.6,
		sway: 0.8,
		range: { x: 45, y: 20, z: 55 },
	});
	const petals = new Drift({
		count: MOBILE ? 260 : 520,
		color: 0xffa9c9,
		size: 0.75,
		map: petalTexture(),
		fall: -1.4,
		sway: 2.4,
		range: { x: 45, y: 20, z: 50 },
	});
	scene.add(snow.points, embers.points, petals.points);

	// -------------------------------------------------------------------------
	// Frame loop
	// -------------------------------------------------------------------------

	const pointer = new THREE.Vector2();
	const pointerTarget = new THREE.Vector2();
	window.addEventListener(
		"pointermove",
		(e) => {
			if (e.pointerType !== "mouse") return;
			pointerTarget.set(
				(e.clientX / window.innerWidth) * 2 - 1,
				(e.clientY / window.innerHeight) * 2 - 1,
			);
		},
		{ passive: true },
	);

	const look = new THREE.Vector3();
	const sunPos = new THREE.Vector3();
	const bugAxis = new THREE.Vector3(0.3, 1, 0.2).normalize();
	const tmpColor = new THREE.Color();
	const m4 = new THREE.Matrix4();
	const q4 = new THREE.Quaternion();
	const s4 = new THREE.Vector3();
	const p4 = new THREE.Vector3();
	const particleCenter = new THREE.Vector3();
	let progress = 0;
	let time = 0;

	const resize = () => {
		const w = window.innerWidth;
		const h = window.innerHeight;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		// Portrait screens get a wider lens so the valley still feels expansive.
		camera.fov = camera.aspect < 0.8 ? 72 : camera.aspect < 1.2 ? 62 : 52;
		camera.updateProjectionMatrix();
	};
	resize();
	window.addEventListener("resize", resize);

	const render = (dt) => {
		time += dt;
		const mood = moodAt(progress);
		pointer.lerp(pointerTarget, 1 - Math.exp(-dt * 3));

		// Camera glides down the valley, then lifts its gaze to the sun.
		const camZ = START_Z - progress * PATH_LENGTH;
		const camX = pathX(camZ) + pointer.x * 1.6;
		const camY = 7.5 + Math.sin(progress * Math.PI * 5) * 1.1 + mood.lift * 9 - pointer.y * 0.8;
		camera.position.set(camX, camY + Math.sin(time * 0.6) * 0.15, camZ);
		// Tall portrait screens tilt up a touch so the sky isn't lost below the fold.
		const tilt = camera.aspect < 0.8 ? 5 : 0;
		look.set(pathX(camZ - 40), camY - 1.5 + tilt + mood.lift * 22, camZ - 40);
		camera.lookAt(look);

		// Sky, fog, exposure
		skyUniforms.top.value.copy(mood.skyTop);
		skyUniforms.mid.value.copy(mood.skyMid);
		skyUniforms.bottom.value.copy(mood.skyBottom);
		skyUniforms.sunColor.value.copy(mood.sun);
		skyUniforms.sunGlow.value = mood.sunIntensity;
		sky.position.copy(camera.position);
		scene.fog.color.copy(mood.fog);
		scene.fog.near = mood.fogNear;
		scene.fog.far = mood.fogFar;
		renderer.toneMappingExposure = mood.exposure;
		water.material.emissive.copy(mood.fog).multiplyScalar(0.35);

		// Sun
		sunPos.set(pathX(camZ - 520), mood.sunY, camZ - 520);
		skyUniforms.sunDir.value.copy(sunPos).sub(camera.position).normalize();
		sunHalo.position.copy(sunPos);
		sunHalo.material.color.copy(mood.sun);
		sunHalo.scale.setScalar(150 + mood.sunIntensity * 120);
		sunHalo.material.opacity = Math.min(mood.sunIntensity, 1);
		sunCore.position.copy(sunPos);
		sunCore.scale.setScalar(46 + mood.sunIntensity * 10);
		sunCore.material.opacity = Math.min(mood.sunIntensity * 1.2, 1);
		sunLight.position.copy(sunPos);
		sunLight.target.position.copy(camera.position);
		sunLight.color.copy(mood.sun);
		sunLight.intensity = 0.6 + mood.sunIntensity * 1.6;
		hemi.color.copy(mood.skyMid);
		hemi.intensity = 0.8 + mood.sunIntensity * 0.4;

		rays.visible = mood.rays > 0.01;
		if (rays.visible) {
			rays.position.copy(sunPos);
			rays.quaternion.copy(camera.quaternion);
			rays.rotateZ(time * 0.05);
			rayMaterial.opacity = mood.rays * 0.4 * (0.85 + Math.sin(time * 1.3) * 0.15);
		}

		// Clouds
		fairClouds.material.opacity = 0.92;
		fairClouds.material.emissive.copy(mood.sun).multiplyScalar(0.08);
		fairClouds.position.x = Math.sin(time * 0.03) * 6;
		stormClouds.visible = mood.storm > 0.01;
		stormClouds.material.opacity = mood.storm * 0.95;
		stormClouds.position.set(Math.sin(time * 0.05) * 8, (1 - mood.storm) * 14, 0);

		// Solids — greyed out in the gloom, blooming into colour with the light.
		for (let i = 0; i < solidMaterials.length; i++) {
			tmpColor.copy(grey).lerp(solidTargets[i], mood.color);
			solidMaterials[i].color.copy(tmpColor);
			solidMaterials[i].emissive.copy(tmpColor);
			solidMaterials[i].emissiveIntensity = 0.05 + mood.color * 0.18;
		}
		for (const s of solids) {
			s.rotation.x += s.userData.spin * dt;
			s.rotation.y += s.userData.spin * 0.7 * dt;
			s.position.y = s.userData.y + Math.sin(time + s.userData.bob) * 0.6;
		}

		// Bugs jitter, then scatter away as the light arrives.
		bugs.visible = mood.bugs > 0.01;
		if (bugs.visible) {
			bugMaterial.opacity = mood.bugs;
			const scatter = (1 - mood.bugs) * 18;
			for (let i = 0; i < BUG_COUNT; i++) {
				const b = bugSeeds[i];
				const a = time * b.speed + b.phase;
				p4.set(
					b.x + Math.sin(a) * 0.6 + Math.cos(b.phase) * scatter,
					b.y + Math.sin(a * 1.7) * 0.4 + scatter * 0.6,
					b.z + Math.cos(a * 1.3) * 0.6 + Math.sin(b.phase) * scatter,
				);
				q4.setFromAxisAngle(bugAxis, a);
				s4.setScalar(0.6 + mood.bugs * 0.6);
				bugs.setMatrixAt(i, m4.compose(p4, q4, s4));
			}
			bugs.instanceMatrix.needsUpdate = true;
		}

		// Curious glyphs
		for (const g of glyphs) {
			g.visible = mood.questions > 0.01;
			if (!g.visible) continue;
			g.material.opacity = mood.questions;
			g.position.y = g.userData.y + Math.sin(time * 0.8 + g.userData.phase) * 0.8;
		}

		// Particles live in a box just ahead of the camera.
		particleCenter.set(camera.position.x, camera.position.y, camera.position.z - 25);
		snow.update(dt, time, particleCenter, mood.snow);
		embers.update(dt, time, particleCenter, mood.embers);
		petals.update(dt, time, particleCenter, mood.petals);

		renderer.render(scene, camera);
	};

	return {
		setProgress: (p) => {
			progress = p;
		},
		render,
	};
}
