// The home page's "On the move" teaser: each mini map is redrawn over Esri's
// satellite imagery. Leaflet only loads as the teaser nears the screen, and the
// maps stay still, since each card is a link to the migrations page.
(function () {
	"use strict";

	var frames = document.querySelectorAll("[data-moving]");
	if (!frames.length || !("IntersectionObserver" in window)) return;

	var seen = new IntersectionObserver(function (entries) {
		if (!entries.some(function (e) { return e.isIntersecting; })) return;
		seen.disconnect();
		leaflet(function () { frames.forEach(draw); });
	}, { rootMargin: "600px 0px" });
	frames.forEach(function (f) { seen.observe(f); });

	function leaflet(done) {
		// The maps are sized by Leaflet's stylesheet, so draw once both are in.
		var left = 2;
		function one() { if (--left === 0) done(); }
		var css = document.createElement("link");
		css.rel = "stylesheet";
		css.href = "/assets/vendor/leaflet/leaflet.css";
		css.onload = css.onerror = one;
		document.head.appendChild(css);
		var js = document.createElement("script");
		js.src = "/assets/vendor/leaflet/leaflet.js";
		js.onload = one;
		document.head.appendChild(js);
	}

	// latLng undoes the SVG map's projection: x = (lng + 18.5) * 10, y = (38 - lat) * 10.
	function latLng(x, y) { return [38 - y / 10, x / 10 - 18.5]; }

	function draw(frame) {
		var trail = frame.querySelector(".moving__trail");
		var dot = frame.querySelector(".moving__dot");
		var total = trail.getTotalLength();
		var line = [];
		for (var i = 0; i <= 300; i++) {
			var p = trail.getPointAtLength(total * i / 300);
			line.push(latLng(p.x, p.y));
		}

		var div = document.createElement("span");
		div.className = "moving__leaf";
		frame.insertBefore(div, frame.firstChild);
		var map = L.map(div, {
			dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false,
			boxZoom: false, keyboard: false, zoomControl: false, zoomSnap: 0.25,
			zoomAnimation: false, fadeAnimation: false
		});
		map.attributionControl.setPrefix(false);
		L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
			maxZoom: 17, attribution: "Imagery © Esri"
		}).addTo(map);
		L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}", {
			maxZoom: 17, opacity: 0.75
		}).addTo(map);
		L.polyline(line, { color: "#d4f06a", weight: 3, opacity: 0.9, dashArray: "2 8", lineCap: "round", interactive: false }).addTo(map);
		L.marker(latLng(+dot.getAttribute("cx"), +dot.getAttribute("cy")), {
			interactive: false, keyboard: false,
			icon: L.divIcon({ className: "route__herd-pin", html: "<span></span>", iconSize: [24, 24] })
		}).addTo(map);
		var bounds = L.latLngBounds(line);
		map.fitBounds(bounds, { padding: [24, 24], animate: false });
		var width = div.clientWidth;
		new ResizeObserver(function () {
			if (div.clientWidth === width) return;
			width = div.clientWidth;
			map.invalidateSize(false);
			map.fitBounds(bounds, { padding: [24, 24], animate: false });
		}).observe(div);
		frame.classList.add("has-leaf");
	}
})();
