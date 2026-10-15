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

	// The panel starts closed on phones so the map gets the screen; close it
	// before the map measures itself.
	if (matchMedia("(max-width: 899px)").matches && !location.search) {
		form.querySelector("details").open = false;
	}

	var map = L.map(el, { zoomSnap: 0.5, worldCopyJump: false, minZoom: 2 });
	el.classList.add("is-satellite");
	var africa = L.latLngBounds([[-36, -19], [38, 52]]);
	map.fitBounds(africa);

	// Two key-free base maps: Esri's satellite imagery, the default, for zooming
	// into the parks, and OpenStreetMap, tinted in CSS to suit day or night.
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
	var base = satellite.addTo(map);

	// The country outlines ship with the page, so Africa shows even if the
	// conference wifi blocks the tiles.
	var land = L.polygon(data.outlines, { interactive: false, weight: 1 }).addTo(map);

	// Outlines read on both base maps: thin and light over the satellite, a
	// soft green fill over the streets.
	function theme() {
		var night = document.documentElement.dataset.theme === "night";
		if (base === satellite) {
			land.setStyle({ color: "#D4F06A", opacity: 0.55, fillOpacity: 0 });
		} else if (night) {
			land.setStyle({ color: "#9FD18A", opacity: 0.35, fillColor: "#213029", fillOpacity: 0.25 });
		} else {
			land.setStyle({ color: "#1F4D3A", opacity: 0.45, fillColor: "#B9DCA8", fillOpacity: 0.28 });
		}
	}
	theme();
	document.addEventListener("safari:theme", theme);

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
					el.classList.toggle("is-satellite", base === satellite);
					theme();
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
	// A pin shows a soft shimmer until its photo arrives, and a paw if the
	// photo never does. Clustering keeps only the pins on screen in the page,
	// so they load straight away rather than lazily.
	var markers = data.pins.map(function (p) {
		var pin = document.createElement("span");
		pin.className = "atlas-pin";
		if (p.photo) {
			pin.classList.add("is-loading");
			var img = document.createElement("img");
			img.alt = "";
			img.decoding = "async";
			img.referrerPolicy = "no-referrer";
			img.addEventListener("load", function () { pin.classList.remove("is-loading"); });
			img.addEventListener("error", function () {
				pin.classList.remove("is-loading");
				pin.classList.add("atlas-pin--empty");
				img.remove();
				p.photo = "";
			});
			img.src = p.photo;
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
		marker.bindPopup(function () { return popup(p, marker); }, { maxWidth: 260, minWidth: 240, className: "atlas-popup", autoPanPadding: [24, 24] });
		marker.on("click", function () {
			if (reduced) return;
			pin.classList.remove("is-bounce");
			void pin.offsetWidth;
			pin.classList.add("is-bounce");
		});
		marker.pin = p;
		return marker;
	});

	// The popup's photo has a fixed frame, so the popup is the right size
	// before the photo arrives; once it does, the map pans to fit it.
	function popup(p, marker) {
		var box = document.createElement("div");
		if (p.photo) {
			var frame = document.createElement("span");
			frame.className = "atlas-popup__photo is-loading";
			var img = document.createElement("img");
			img.alt = p.animal + " photographed in " + p.place;
			img.width = 240;
			img.height = 180;
			img.decoding = "async";
			img.referrerPolicy = "no-referrer";
			img.addEventListener("load", function () {
				frame.classList.remove("is-loading");
				var pop = marker.getPopup();
				if (pop && pop.isOpen()) pop.update();
			});
			img.addEventListener("error", function () { frame.remove(); });
			img.src = p.photo;
			frame.appendChild(img);
			box.appendChild(frame);
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

	form.querySelector("details").addEventListener("toggle", function () { map.invalidateSize(); });
})();
