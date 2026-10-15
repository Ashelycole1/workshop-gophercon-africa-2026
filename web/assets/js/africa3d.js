// Karibu Safari: the landing page's 3D Africa. Every country is extruded from
// its real outline, as tall as its number of sightings, with a pin for each
// sighting. Drag to turn it, hover a pin to meet the animal, scroll to lower the
// camera into golden hour. If WebGL is unavailable the server-rendered SVG map
// underneath stays put.
import * as THREE from "/assets/vendor/three/three.module.min.js";

const root = document.querySelector("[data-africa3d]");
const dataEl = document.getElementById("africa3d-data");
if (root && dataEl) init(root, JSON.parse(dataEl.textContent));

function init(root, data) {
	const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
	const stage = root.querySelector(".a3d__stage");
	const tip = root.querySelector(".a3d__tip");

	let renderer;
	try {
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
	} catch (e) {
		return;
	}
	if (!renderer.getContext()) return;

	renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
	renderer.outputColorSpace = THREE.SRGBColorSpace;
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	const canvas = renderer.domElement;
	canvas.className = "a3d__canvas";
	canvas.setAttribute("role", "img");
	canvas.setAttribute("aria-label",
		"3D map of Africa. Each country rises by its number of wildlife sightings, with a pin for every sighting. " +
		"Drag to turn it, or use the turn buttons. Every sighting is also listed further down the page.");
	stage.appendChild(canvas);
	root.classList.add("is-3d");

	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

	// Light: a low golden sun from the west, a warm sky, a dusty ground bounce.
	const hemi = new THREE.HemisphereLight(0xffe2b8, 0x5a3418, 1.25);
	scene.add(hemi);
	const sun = new THREE.DirectionalLight(0xffb45e, 3.0);
	sun.position.set(-7, 6.5, 4);
	sun.castShadow = true;
	sun.shadow.mapSize.set(2048, 2048);
	sun.shadow.camera.left = -6;
	sun.shadow.camera.right = 6;
	sun.shadow.camera.top = 6;
	sun.shadow.camera.bottom = -6;
	sun.shadow.bias = -0.0008;
	scene.add(sun);

	const ground = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.ShadowMaterial({ opacity: 0.22 }));
	ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;
	scene.add(ground);

	// Countries.
	const toWorld = (x, y) => [(x - 355) / 100, -(y - 370) / 100];
	const sand = new THREE.Color("#E9D3A1");
	const low = new THREE.Color("#F5A524");
	const high = new THREE.Color("#B8321F");
	const africa = new THREE.Group();
	africa.rotation.x = -Math.PI / 2;
	scene.add(africa);

	const countries = [];
	const heights = {};
	for (const c of data.countries) {
		const share = c.count ? Math.sqrt(c.count / data.max) : 0;
		const h = 0.06 + (c.count ? 0.1 + 0.95 * share : 0);
		heights[c.code] = h;
		const shapes = shapesFromPath(c.path, toWorld);
		if (!shapes.length) continue;
		const geo = new THREE.ExtrudeGeometry(shapes, { depth: h, bevelEnabled: false });
		const colour = c.count ? low.clone().lerp(high, share) : sand.clone();
		const top = new THREE.MeshStandardMaterial({ color: colour, roughness: 0.85, metalness: 0 });
		const side = new THREE.MeshStandardMaterial({ color: colour.clone().multiplyScalar(0.62), roughness: 0.95 });
		const mesh = new THREE.Mesh(geo, [top, side]);
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		mesh.userData = { country: c, lift: 0, target: 0, base: colour };
		const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo, 40),
			new THREE.LineBasicMaterial({ color: 0x2b1b0e, transparent: true, opacity: 0.35 }));
		mesh.add(edges);
		africa.add(mesh);
		countries.push(mesh);
	}

	// Pins: one instanced stem and one instanced glowing head per sighting.
	const pins = data.pins;
	const stemGeo = new THREE.CylinderGeometry(0.007, 0.007, 1, 6);
	stemGeo.translate(0, 0.5, 0);
	const stems = new THREE.InstancedMesh(stemGeo, new THREE.MeshStandardMaterial({ color: 0x2b1b0e, roughness: 1 }), pins.length);
	const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 16, 12),
		new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf2b312, emissiveIntensity: 0.45, roughness: 0.35 }), pins.length);
	heads.castShadow = true;
	const gold = new THREE.Color("#F2B312");
	const cyan = new THREE.Color("#6AD4E8");
	const m = new THREE.Matrix4();
	const pinWorld = [];
	pins.forEach((p, i) => {
		const [x, z] = toWorld(p.x, p.y);
		const base = heights[p.country] || 0.06;
		const jitter = ((i * 9301 + 49297) % 233280) / 233280;
		const stem = 0.28 + jitter * 0.22;
		m.compose(new THREE.Vector3(x, base, -z), new THREE.Quaternion(), new THREE.Vector3(1, stem, 1));
		stems.setMatrixAt(i, m);
		const head = new THREE.Vector3(x, base + stem, -z);
		pinWorld.push({ head, base: new THREE.Vector3(x, base, -z), stem, scale: 1, target: 1 });
		heads.setColorAt(i, gold);
	});
	writeHeads();
	scene.add(stems, heads);

	function writeHeads() {
		pinWorld.forEach((p, i) => {
			const s = p.scale;
			m.compose(p.head, new THREE.Quaternion(), new THREE.Vector3(s, s, s));
			heads.setMatrixAt(i, m);
		});
		heads.instanceMatrix.needsUpdate = true;
	}

	// Camera: an orbit in spherical coordinates. Scroll lowers it from a high
	// overview to a low golden-hour angle; drag adds to that with inertia.
	const target = new THREE.Vector3(0.1, 0.2, 0.35);
	let theta = -0.25, phiDrag = 0, vTheta = 0, vPhi = 0, scrollT = 0, idleT = 0;
	let radius = 15;

	function placeCamera() {
		const phi = THREE.MathUtils.clamp(0.62 + scrollT * 0.5 + phiDrag, 0.25, 1.32);
		const sway = reduced ? 0 : Math.sin(idleT * 0.12) * 0.22;
		const t = theta + sway;
		camera.position.set(
			target.x + radius * Math.sin(phi) * Math.sin(t),
			target.y + radius * Math.cos(phi),
			target.z + radius * Math.sin(phi) * Math.cos(t));
		camera.lookAt(target);
	}

	function resize() {
		const w = stage.clientWidth, h = stage.clientHeight;
		if (!w || !h) return;
		renderer.setSize(w, h, false);
		camera.aspect = w / h;
		// Far enough back that the whole continent fits, wide or tall.
		radius = w / h < 0.9 ? 15 / Math.max(w / h, 0.8) : 15;
		camera.updateProjectionMatrix();
	}
	new ResizeObserver(resize).observe(stage);
	resize();

	addEventListener("scroll", () => {
		const r = root.getBoundingClientRect();
		scrollT = THREE.MathUtils.clamp(-r.top / (r.height * 0.75), 0, 1);
		root.style.setProperty("--dusk", scrollT.toFixed(3));
	}, { passive: true });

	// Pointer: drag to orbit, hover to inspect, click or tap to open.
	const ray = new THREE.Raycaster();
	const ndc = new THREE.Vector2(-2, -2);
	let dragging = false, moved = 0, last = { x: 0, y: 0 }, hoverPin = -1, hoverCountry = null, peekPin = -1, pointerType = "mouse";

	canvas.addEventListener("pointerdown", e => {
		dragging = true; moved = 0; pointerType = e.pointerType;
		last = { x: e.clientX, y: e.clientY };
		canvas.setPointerCapture(e.pointerId);
		root.classList.add("is-dragging");
	});
	canvas.addEventListener("pointermove", e => {
		const r = canvas.getBoundingClientRect();
		ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
		if (!dragging) return;
		const dx = e.clientX - last.x, dy = e.clientY - last.y;
		moved += Math.abs(dx) + Math.abs(dy);
		vTheta = -dx * 0.006;
		vPhi = -dy * 0.004;
		theta += vTheta;
		phiDrag = THREE.MathUtils.clamp(phiDrag + vPhi, -0.35, 0.45);
		last = { x: e.clientX, y: e.clientY };
	});
	const end = e => {
		dragging = false;
		root.classList.remove("is-dragging");
		if (moved < 6) activate();
	};
	canvas.addEventListener("pointerup", end);
	canvas.addEventListener("pointercancel", () => { dragging = false; root.classList.remove("is-dragging"); });
	canvas.addEventListener("pointerleave", () => { if (!dragging) ndc.set(-2, -2); });

	function activate() {
		if (hoverPin >= 0) {
			// On touch the first tap shows the pin, the second opens it.
			if (pointerType !== "mouse" && tip.dataset.pin !== String(hoverPin)) { showTip(hoverPin, false); return; }
			location.href = pins[hoverPin].url;
		} else if (hoverCountry && hoverCountry.url) {
			location.href = hoverCountry.url;
		}
	}

	root.querySelectorAll("[data-turn]").forEach(btn => btn.addEventListener("click", () => {
		const d = btn.dataset.turn;
		if (d === "reset") { theta = -0.25; phiDrag = 0; vTheta = vPhi = 0; return; }
		vTheta = d === "left" ? -0.06 : 0.06;
	}));

	function pick() {
		ray.setFromCamera(ndc, camera);
		const hitPin = ray.intersectObject(heads, false)[0];
		hoverPin = hitPin ? hitPin.instanceId : -1;
		hoverCountry = null;
		if (hoverPin < 0) {
			const hitC = ray.intersectObjects(countries, false)[0];
			if (hitC) hoverCountry = hitC.object.userData.country;
		}
		countries.forEach(c => { c.userData.target = hoverPin < 0 && c.userData.country === hoverCountry ? 0.12 : 0; });
		canvas.style.cursor = dragging ? "grabbing" : (hoverPin >= 0 || (hoverCountry && hoverCountry.url)) ? "pointer" : "grab";
		if (hoverPin >= 0) showTip(hoverPin, false);
		else if (hoverCountry) showCountry(hoverCountry);
		else if (peekPin < 0) hideTip();
	}

	// The tooltip, written with textContent only: the data came from GBIF.
	const tipImg = tip.querySelector("img");
	const tipTitle = tip.querySelector(".a3d__tip-title");
	const tipPlace = tip.querySelector(".a3d__tip-place");
	const tipMeta = tip.querySelector(".a3d__tip-meta");
	let tipAt = null;

	function showTip(i, peek) {
		const p = pins[i];
		if (tip.dataset.pin !== String(i)) {
			tip.dataset.pin = String(i);
			tipTitle.textContent = p.animal;
			tipPlace.textContent = p.place;
			tipMeta.textContent = "Spotted by " + p.spotter + ", " + p.date;
			if (p.photo) { tipImg.src = p.photo; tipImg.alt = ""; tipImg.hidden = false; } else { tipImg.hidden = true; }
		}
		tip.classList.toggle("is-peek", !!peek);
		tip.classList.remove("is-country");
		tip.hidden = false;
		tipAt = pinWorld[i].head;
		pinWorld.forEach((pw, j) => { pw.target = j === i ? 2.1 : 1; });
	}

	function showCountry(c) {
		if (tip.dataset.pin !== "c:" + c.code) {
			tip.dataset.pin = "c:" + c.code;
			tipTitle.textContent = c.name || "This country";
			tipPlace.textContent = c.count ? c.count + (c.count === 1 ? " sighting" : " sightings") : "No sightings yet. Be the first!";
			tipMeta.textContent = c.url ? "Click to visit the country" : "";
			tipImg.hidden = true;
		}
		tip.classList.add("is-country");
		tip.classList.remove("is-peek");
		tip.hidden = false;
		tipAt = null;
		pinWorld.forEach(pw => { pw.target = 1; });
	}

	function hideTip() {
		tip.hidden = true;
		tip.dataset.pin = "";
		tipAt = null;
		pinWorld.forEach(pw => { pw.target = 1; });
	}

	const v = new THREE.Vector3();
	function placeTip() {
		if (tip.hidden) return;
		const r = stage.getBoundingClientRect();
		let x, y;
		if (tipAt) {
			v.copy(tipAt).project(camera);
			x = (v.x * 0.5 + 0.5) * r.width;
			y = (-v.y * 0.5 + 0.5) * r.height;
		} else {
			const cr = canvas.getBoundingClientRect();
			x = (ndc.x * 0.5 + 0.5) * cr.width;
			y = (-ndc.y * 0.5 + 0.5) * cr.height;
		}
		tip.style.transform = "translate(" + Math.round(x) + "px," + Math.round(y) + "px)";
	}

	// Idle: now and then an animal peeks out, as if from the grass.
	function schedulePeek() {
		if (reduced) return;
		setTimeout(() => {
			if (visible && hoverPin < 0 && !hoverCountry && !dragging && pins.length) {
				peekPin = Math.floor(Math.random() * pins.length);
				showTip(peekPin, true);
				setTimeout(() => {
					if (peekPin >= 0 && hoverPin < 0) hideTip();
					peekPin = -1;
				}, 2800);
			}
			schedulePeek();
		}, 6000 + Math.random() * 4000);
	}
	schedulePeek();

	// Day and night.
	function applyTheme(theme) {
		const night = theme === "night";
		hemi.color.set(night ? 0x8fa3d9 : 0xffe2b8);
		hemi.groundColor.set(night ? 0x0b1220 : 0x5a3418);
		hemi.intensity = night ? 0.7 : 1.25;
		sun.color.set(night ? 0xbfd0ff : 0xffb45e);
		sun.intensity = night ? 1.3 : 3.0;
		heads.material.emissiveIntensity = night ? 1.6 : 0.45;
	}
	applyTheme(document.documentElement.dataset.theme);
	document.addEventListener("safari:theme", e => applyTheme(e.detail));

	// Render only while the map is on screen and the tab is visible.
	let visible = true, frame = 0, lastTime = performance.now();
	new IntersectionObserver(entries => {
		visible = entries[0].isIntersecting;
		if (visible && !frame) frame = requestAnimationFrame(loop);
	}).observe(root);
	document.addEventListener("visibilitychange", () => {
		if (!document.hidden && visible && !frame) frame = requestAnimationFrame(loop);
	});

	function loop(now) {
		frame = 0;
		if (!visible || document.hidden) return;
		const dt = Math.min(0.05, (now - lastTime) / 1000);
		lastTime = now;
		idleT += dt;
		if (!dragging) {
			theta += vTheta;
			phiDrag = THREE.MathUtils.clamp(phiDrag + vPhi, -0.35, 0.45);
			vTheta *= 0.92;
			vPhi *= 0.88;
		}
		placeCamera();
		pick();

		let headsDirty = false;
		for (const p of pinWorld) {
			if (Math.abs(p.target - p.scale) > 0.01) { p.scale += (p.target - p.scale) * 0.2; headsDirty = true; }
		}
		if (headsDirty) writeHeads();
		for (const c of countries) {
			const u = c.userData;
			u.lift += (u.target - u.lift) * 0.18;
			c.position.z = u.lift;
			c.material[0].emissive.copy(u.base).multiplyScalar(u.lift * 2.2);
		}

		renderer.render(scene, camera);
		placeTip();
		frame = requestAnimationFrame(loop);
	}
	frame = requestAnimationFrame(loop);
}

// shapesFromPath turns "M x y L x y … Z" rings into THREE.Shapes, treating a
// ring that sits inside a larger one as its hole (Lesotho inside South Africa).
function shapesFromPath(d, toWorld) {
	const rings = [];
	for (const part of d.split("M")) {
		if (!part.trim()) continue;
		const pts = part.replace(/Z/g, "").split("L").map(s => {
			const [x, y] = s.trim().split(/\s+/).map(Number);
			const [wx, wy] = toWorld(x, y);
			return new THREE.Vector2(wx, wy);
		}).filter(p => isFinite(p.x) && isFinite(p.y));
		if (pts.length >= 3) rings.push({ pts, area: Math.abs(THREE.ShapeUtils.area(pts)) });
	}
	rings.sort((a, b) => b.area - a.area);
	const shapes = [];
	for (const ring of rings) {
		const parent = shapes.find(s => inside(ring.pts[0], s.userData.pts));
		if (parent) {
			parent.holes.push(new THREE.Path(ring.pts));
		} else {
			const shape = new THREE.Shape(ring.pts);
			shape.userData = { pts: ring.pts };
			shapes.push(shape);
		}
	}
	return shapes;
}

function inside(p, poly) {
	let hit = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const a = poly[i], b = poly[j];
		if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
	}
	return hit;
}
