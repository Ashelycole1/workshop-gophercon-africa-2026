// Migrations: one month slider moves every herd along its trail, the walked
// part of the trail fills in, and the month's stop is highlighted. Play runs
// through the year. With Leaflet loaded, each route is redrawn over Esri's
// satellite imagery; the SVG underneath stays as the fallback and still does
// the path maths.
(function () {
	"use strict";

	var bar = document.querySelector("[data-months]");
	if (!bar) return;
	var input = bar.querySelector("input[type=range]");
	var now = bar.querySelector(".months__now");
	var play = bar.querySelector("[data-months-play]");
	var ticks = bar.querySelectorAll("[data-tick]");
	var names = Array.prototype.map.call(ticks, function (t) { return t.textContent; });
	var still = matchMedia("(prefers-reduced-motion: reduce)").matches;

	var routes = Array.prototype.map.call(document.querySelectorAll("[data-route]"), setup);

	// setup finds how far along the trail each month's stop sits.
	function setup(el) {
		var trail = el.querySelector("[data-trail]");
		var herd = el.querySelector("[data-herd]");
		var total = trail.getTotalLength();
		var pts = el.querySelector("[data-points]").dataset.points.split(" ").map(function (p) {
			var xy = p.split(",");
			return { x: +xy[0], y: +xy[1] };
		});
		var samples = [];
		for (var i = 0; i <= 800; i++) samples.push(trail.getPointAtLength(total * i / 800));
		var at = pts.map(function (p, n) {
			var best = 0, dist = Infinity;
			samples.forEach(function (s, i) {
				var d = (s.x - p.x) * (s.x - p.x) + (s.y - p.y) * (s.y - p.y);
				if (d < dist) { dist = d; best = i; }
			});
			return n === 0 ? 0 : total * best / 800;
		});
		trail.style.strokeDasharray = total + " " + total;
		var r = {
			el: el, trail: trail, herd: herd, total: total, at: at, pos: null, frame: 0,
			stops: el.querySelectorAll("[data-stop]"),
			months: el.querySelectorAll("[data-month]"),
			samples: samples
		};
		if (window.L) satellite(r);
		return r;
	}

	// latLng undoes the SVG map's projection: x = (lng + 18.5) * 10, y = (38 - lat) * 10.
	function latLng(x, y) { return [38 - y / 10, x / 10 - 18.5]; }

	function satellite(r) {
		var box = r.el.querySelector(".route__map");
		var div = document.createElement("div");
		div.className = "route__leaf";
		div.setAttribute("aria-label", r.el.querySelector("svg").getAttribute("aria-label"));
		box.insertBefore(div, box.firstChild);

		// One finger scrolls the page on a phone; pinch or the buttons zoom.
		var map = L.map(div, { scrollWheelZoom: false, zoomControl: false, zoomSnap: 0.25, dragging: !L.Browser.mobile });
		L.control.zoom({ position: "bottomright" }).addTo(map);
		L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
			maxZoom: 17,
			attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics"
		}).addTo(map);
		L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
			maxZoom: 17, opacity: 0.8
		}).addTo(map);

		r.line = r.samples.map(function (p) { return latLng(p.x, p.y); });
		L.polyline(r.line, { color: "#ffffff", weight: 3, opacity: 0.75, dashArray: "2 9", lineCap: "round", interactive: false }).addTo(map);
		r.walked = L.polyline([], { color: "#d4f06a", weight: 5, opacity: 0.95, lineCap: "round", lineJoin: "round", interactive: false }).addTo(map);

		r.el.querySelectorAll(".route__seen circle").forEach(function (c) {
			var t = c.querySelector("title");
			L.circleMarker(latLng(+c.getAttribute("cx"), +c.getAttribute("cy")), {
				radius: 5, color: "#ffffff", weight: 1.5, fillColor: "#4e7d3a", fillOpacity: 0.95
			}).bindTooltip(t ? t.textContent : "A sighting", { direction: "top", className: "route__tip" }).addTo(map);
		});

		r.dots = Array.prototype.map.call(r.stops, function (c, i) {
			var label = r.months[i].querySelector(".route__month").textContent + ": " + r.months[i].querySelector("strong").textContent;
			return L.circleMarker(latLng(+c.getAttribute("cx"), +c.getAttribute("cy")), {
				radius: 6, color: "#1f4d3a", weight: 2, fillColor: "#ffffff", fillOpacity: 1
			}).bindTooltip(label, { direction: "top", className: "route__tip" }).on("click", function () { pick(i); }).addTo(map);
		});

		r.pin = L.marker(r.line[0], {
			interactive: false, keyboard: false, zIndexOffset: 1000,
			icon: L.divIcon({ className: "route__herd-pin", html: "<span></span>", iconSize: [26, 26] })
		}).addTo(map);

		map.fitBounds(L.latLngBounds(r.line), { padding: [44, 44] });
		new ResizeObserver(function () { map.invalidateSize(); }).observe(div);
		box.classList.add("has-leaf");
	}

	function place(r, len) {
		var p = r.trail.getPointAtLength(len);
		r.herd.setAttribute("transform", "translate(" + p.x.toFixed(2) + " " + p.y.toFixed(2) + ")");
		r.trail.style.strokeDashoffset = String(r.total - len);
		if (r.pin) {
			var here = latLng(p.x, p.y);
			r.pin.setLatLng(here);
			r.walked.setLatLngs(r.line.slice(0, Math.floor(len / r.total * 800) + 1).concat([here]));
		}
	}

	function go(r, month) {
		var to = r.at[month];
		var from = r.pos === null ? to : r.pos;
		cancelAnimationFrame(r.frame);
		r.stops.forEach(function (s, i) { s.classList.toggle("is-now", i === month); });
		r.months.forEach(function (m, i) { m.classList.toggle("is-now", i === month); });
		if (r.dots) r.dots.forEach(function (d, i) { d.setStyle({ fillColor: i === month ? "#d4f06a" : "#ffffff" }).setRadius(i === month ? 8 : 6); });
		if (still || from === to) { r.pos = to; place(r, to); return; }
		var start = performance.now(), dur = 900;
		(function step(t) {
			var k = Math.min(1, (t - start) / dur);
			k = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
			r.pos = from + (to - from) * k;
			place(r, r.pos);
			if (k < 1) r.frame = requestAnimationFrame(step);
		})(start);
	}

	function show(month, scroll) {
		input.value = String(month);
		input.setAttribute("aria-valuetext", names[month]);
		now.textContent = names[month];
		ticks.forEach(function (t, i) { t.classList.toggle("is-now", i === month); });
		routes.forEach(function (r) {
			go(r, month);
			if (scroll) {
				var item = r.months[month];
				var list = item.parentElement;
				list.scrollTo({ top: item.offsetTop - list.offsetTop - 8, behavior: still ? "auto" : "smooth" });
			}
		});
	}

	var timer = 0;
	function stop() {
		clearInterval(timer);
		timer = 0;
		bar.classList.remove("is-playing");
		play.setAttribute("aria-label", "Play the year");
	}
	play.addEventListener("click", function () {
		if (timer) return stop();
		bar.classList.add("is-playing");
		play.setAttribute("aria-label", "Pause");
		show((+input.value + 1) % 12, true);
		timer = setInterval(function () { show((+input.value + 1) % 12, true); }, 1600);
	});
	input.addEventListener("input", function () { stop(); show(+input.value, true); });
	ticks.forEach(function (t, i) {
		t.addEventListener("click", function () { stop(); show(i, true); });
	});
	routes.forEach(function (r) {
		r.months.forEach(function (m, i) {
			m.addEventListener("click", function () { pick(i); });
		});
	});
	function pick(i) { stop(); show(i, false); }

	bar.hidden = false;
	document.documentElement.classList.add("has-months");
	show(+bar.dataset.start, true);
})();
