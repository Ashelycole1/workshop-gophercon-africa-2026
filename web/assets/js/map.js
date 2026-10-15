// Karibu Safari: every sighting on a Leaflet map, with photo pins, clusters and
// filters that update the map, the count and the URL as you change them.
(function () {
	"use strict";

	var el = document.getElementById("atlas");
	var dataEl = document.getElementById("atlas-data");
	if (!el || !dataEl || !window.L) return;

	var data = JSON.parse(dataEl.textContent);
	var form = document.querySelector("[data-atlas-filters]");
	var count = form.querySelector(".atlas__count");
	var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

	var map = L.map(el, { zoomSnap: 0.5, worldCopyJump: false, minZoom: 2 });
	var africa = L.latLngBounds([[-36, -19], [38, 52]]);
	map.fitBounds(africa);

	// Two key-free base maps: OpenStreetMap, warmed or darkened in CSS to suit
	// day or night, and Esri's satellite imagery for zooming into the parks.
	var streets = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
		maxZoom: 19,
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		className: "atlas-tiles--streets",
	});
	var satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
		maxZoom: 18,
		attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
		className: "atlas-tiles--satellite",
	});
	var base = streets.addTo(map);

	// The country outlines ship with the page, so Africa shows even if the
	// conference wifi blocks the tiles.
	var land = L.polygon(data.outlines, {
		interactive: false, weight: 1, color: "#8A5A2B", opacity: 0.55, fillColor: "#E2C98F", fillOpacity: 0.28,
	}).addTo(map);

	function theme(t) {
		var night = t === "night";
		land.setStyle(night
			? { color: "#F4EBC1", opacity: 0.35, fillColor: "#2A3A5C", fillOpacity: 0.25 }
			: { color: "#8A5A2B", opacity: 0.55, fillColor: "#E2C98F", fillOpacity: 0.28 });
	}
	theme(document.documentElement.dataset.theme);
	document.addEventListener("safari:theme", function (e) { theme(e.detail); });

	// A two-button switch between the base maps, as a Leaflet control.
	var Switch = L.Control.extend({
		options: { position: "topright" },
		onAdd: function () {
			var box = L.DomUtil.create("div", "atlas-switch");
			box.setAttribute("role", "group");
			box.setAttribute("aria-label", "Base map");
			[["Map", streets], ["Satellite", satellite]].forEach(function (pair) {
				var b = L.DomUtil.create("button", "", box);
				b.type = "button";
				b.textContent = pair[0];
				b.setAttribute("aria-pressed", String(pair[1] === base));
				L.DomEvent.on(b, "click", function (e) {
					L.DomEvent.stop(e);
					if (pair[1] === base) return;
					map.removeLayer(base);
					base = pair[1].addTo(map).bringToBack();
					box.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
					land.setStyle({ fillOpacity: base === satellite ? 0 : (document.documentElement.dataset.theme === "night" ? 0.25 : 0.28) });
				});
			});
			L.DomEvent.disableClickPropagation(box);
			return box;
		},
	});
	new Switch().addTo(map);

	var clusters = L.markerClusterGroup({
		showCoverageOnHover: false,
		maxClusterRadius: 48,
		spiderfyDistanceMultiplier: 1.6,
		iconCreateFunction: function (cluster) {
			var n = cluster.getChildCount();
			return L.divIcon({
				html: "<span>" + n + "</span>",
				className: "atlas-cluster" + (n >= 20 ? " atlas-cluster--big" : ""),
				iconSize: [48, 48],
			});
		},
	});
	map.addLayer(clusters);

	// Markers and popups are built as elements, never from HTML strings:
	// names, places and photo URLs all came from GBIF.
	var markers = data.pins.map(function (p) {
		var pin = document.createElement("span");
		pin.className = "atlas-pin";
		if (p.photo) {
			var img = document.createElement("img");
			img.src = p.photo;
			img.alt = "";
			img.loading = "lazy";
			pin.appendChild(img);
		} else {
			pin.classList.add("atlas-pin--empty");
		}
		var marker = L.marker([p.lat, p.lng], {
			icon: L.divIcon({ html: pin, className: "atlas-pin-wrap", iconSize: [46, 46], iconAnchor: [23, 23], popupAnchor: [0, -24] }),
			title: p.animal + ", " + p.place,
			alt: p.animal + ", " + p.place,
			riseOnHover: true,
		});
		marker.bindPopup(function () { return popup(p); }, { maxWidth: 260, minWidth: 220, className: "atlas-popup" });
		marker.on("click", function () {
			if (reduced) return;
			pin.classList.remove("is-bounce");
			void pin.offsetWidth;
			pin.classList.add("is-bounce");
		});
		marker.pin = p;
		return marker;
	});

	function popup(p) {
		var box = document.createElement("div");
		if (p.photo) {
			var img = document.createElement("img");
			img.src = p.photo;
			img.alt = p.animal + " photographed in " + p.place;
			img.width = 240;
			img.height = 180;
			box.appendChild(img);
		}
		var h = document.createElement("p");
		h.className = "atlas-popup__name";
		h.textContent = p.animal;
		var where = document.createElement("p");
		where.className = "atlas-popup__meta";
		where.textContent = p.place + ", " + p.date;
		var who = document.createElement("p");
		who.className = "atlas-popup__meta";
		who.textContent = "Spotted by " + p.spotter;
		var a = document.createElement("a");
		a.className = "atlas-popup__link";
		a.href = p.url;
		a.textContent = "View sighting →";
		box.append(h, where, who, a);
		return box;
	}

	// Filters.
	function read() {
		var f = new FormData(form);
		return {
			animals: f.getAll("animal"),
			countries: f.getAll("country"),
			from: parseInt(f.get("from"), 10) || data.firstYear,
			to: parseInt(f.get("to"), 10) || data.lastYear,
		};
	}

	function apply(fit) {
		var q = read();
		var shown = markers.filter(function (m) {
			var p = m.pin;
			return (!q.animals.length || q.animals.indexOf(p.slug) >= 0) &&
				(!q.countries.length || q.countries.indexOf(p.country) >= 0) &&
				p.year >= Math.min(q.from, q.to) && p.year <= Math.max(q.from, q.to);
		});
		clusters.clearLayers();
		clusters.addLayers(shown);
		count.textContent = shown.length
			? "Showing " + shown.length + " of " + markers.length
			: "No sightings match. Clear a filter.";

		var params = new URLSearchParams();
		q.animals.forEach(function (a) { params.append("animal", a); });
		q.countries.forEach(function (c) { params.append("country", c); });
		if (q.from !== data.firstYear) params.set("from", q.from);
		if (q.to !== data.lastYear) params.set("to", q.to);
		var qs = params.toString();
		history.replaceState(null, "", location.pathname + (qs ? "?" + qs : ""));

		if (fit) {
			var bounds = shown.length ? L.latLngBounds(shown.map(function (m) { return m.getLatLng(); })) : africa;
			map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 9, duration: reduced ? 0 : 0.8 });
		}
	}

	// Start from the URL, so a filtered map can be shared.
	var start = new URLSearchParams(location.search);
	form.querySelectorAll("input[type=checkbox]").forEach(function (box) {
		box.checked = start.getAll(box.name).indexOf(box.value) >= 0;
	});
	if (start.get("from")) form.elements.from.value = start.get("from");
	if (start.get("to")) form.elements.to.value = start.get("to");

	form.addEventListener("change", function () { apply(true); });
	form.addEventListener("reset", function () { setTimeout(function () { apply(true); }, 0); });
	form.addEventListener("submit", function (e) { e.preventDefault(); });
	apply(location.search !== "");

	// The panel starts closed on phones so the map gets the screen.
	if (matchMedia("(max-width: 899px)").matches && !location.search) {
		form.querySelector("details").open = false;
	}
	setTimeout(function () { map.invalidateSize(); }, 0);
})();
