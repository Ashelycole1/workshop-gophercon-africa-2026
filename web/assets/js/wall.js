// The home page's wall of sightings: filters that narrow it instantly, 24 at a
// time with "Show more", filters kept in the address so a view can be shared,
// and a "Surprise me" button. The photo strip above it opens one photo at a time.
(function () {
	"use strict";

	var PAGE = 24;

	var form = document.querySelector("form[data-wall]");
	var list = form && document.getElementById(form.dataset.wall);
	if (list) wall(form, list);

	var strip = document.querySelector("[data-strip]");
	if (strip) photoStrip(strip);

	function wall(form, list) {
		var items = Array.prototype.map.call(list.children, function (el, i) {
			return { el: el, i: i, d: el.dataset };
		});
		var note = document.querySelector("[data-wall-note]");
		var empty = document.querySelector("[data-wall-empty]");
		var more = document.querySelector("[data-wall-more]");
		var surprise = document.querySelector("[data-wall-surprise]");
		var quick = document.querySelector("[data-wall-quick]");
		var limit = PAGE;
		var matched = [];
		var frame = 0;

		function values() {
			var f = form.elements;
			return {
				q: f.q.value.trim().toLowerCase(),
				animal: f.animal.value,
				country: f.country.value,
				from: f.from.value,
				to: f.to.value,
				sort: f.sort.value
			};
		}

		function keep(d, v) {
			if (v.animal && d.animal !== v.animal) return false;
			if (v.country && d.country !== v.country) return false;
			if (v.from && d.date < v.from) return false;
			if (v.to && d.date > v.to) return false;
			return !v.q || (d.search || "").indexOf(v.q) >= 0;
		}

		function render(from) {
			frame = 0;
			from = from || 0;
			var v = values();
			matched = items.filter(function (it) { return keep(it.d, v); });
			if (v.sort === "old") matched.reverse();
			matched.forEach(function (it) { list.appendChild(it.el); });
			items.forEach(function (it) { it.el.hidden = true; });
			var fresh = matched.slice(from, limit);
			matched.slice(0, limit).forEach(function (it) { it.el.hidden = false; });
			fresh.forEach(function (it, n) {
				it.el.classList.remove("is-in");
				it.el.style.setProperty("--n", String(n));
			});
			void list.offsetWidth;
			fresh.forEach(function (it) { it.el.classList.add("is-in"); });

			var shown = Math.min(limit, matched.length);
			var filtered = matched.length !== items.length;
			note.textContent = matched.length === 0
				? "No matches yet."
				: "Showing " + shown + " of " + matched.length + (filtered ? " matching" : "") + ", " + (v.sort === "old" ? "oldest" : "newest") + " first.";
			empty.hidden = matched.length > 0;
			more.hidden = shown >= matched.length;
			more.querySelector("span").textContent = "Show " + Math.min(PAGE, matched.length - shown) + " more sightings";
			surprise.disabled = matched.length === 0;

			if (quick) {
				quick.querySelectorAll("[data-animal]").forEach(function (b) {
					var on = b.dataset.animal === v.animal;
					b.setAttribute("aria-pressed", on ? "true" : "false");
					b.classList.toggle("is-active", on);
				});
			}
			remember(v);
		}

		function schedule(reset) {
			if (reset) limit = PAGE;
			if (!frame) frame = requestAnimationFrame(function () { render(0); });
		}

		function remember(v) {
			var p = new URLSearchParams();
			["q", "animal", "country", "from", "to"].forEach(function (k) { if (v[k]) p.set(k, v[k]); });
			if (v.sort === "old") p.set("sort", "old");
			var qs = p.toString();
			try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash); } catch (e) {}
		}

		function restore() {
			var p = new URLSearchParams(location.search);
			var f = form.elements;
			["q", "animal", "country", "from", "to", "sort"].forEach(function (k) {
				if (p.has(k)) f[k].value = p.get(k);
			});
		}

		form.addEventListener("input", function () { schedule(true); });
		form.addEventListener("change", function () { schedule(true); });
		form.addEventListener("reset", function () { setTimeout(function () { schedule(true); }); });
		form.addEventListener("submit", function (e) { e.preventDefault(); });

		more.addEventListener("click", function () {
			var first = matched[limit];
			limit += PAGE;
			render(limit - PAGE);
			var link = first && first.el.querySelector("a[href]:not([tabindex])");
			if (link) link.focus({ preventScroll: true });
		});

		surprise.addEventListener("click", function () {
			if (!matched.length) return;
			var pick = matched[Math.floor(Math.random() * matched.length)];
			var link = pick.el.querySelector(".card__title a");
			if (link) location.href = link.href;
		});

		if (quick) {
			quick.addEventListener("click", function (e) {
				var b = e.target.closest("[data-animal]");
				if (!b) return;
				var f = form.elements.animal;
				f.value = f.value === b.dataset.animal ? "" : b.dataset.animal;
				schedule(true);
			});
			quick.hidden = false;
		}

		restore();
		form.hidden = false;
		surprise.hidden = false;
		render();
	}

	// One photo is open at a time: hover, focus or the arrows open another, and
	// it moves on by itself every 5 seconds until someone touches it.
	function photoStrip(root) {
		var items = Array.prototype.slice.call(root.querySelectorAll(".strip__item"));
		var dots = root.querySelectorAll(".strip__dot");
		var row = root.querySelector(".strip__row");
		var current = 0;
		var touched = false;
		var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
		var wide = matchMedia("(min-width: 800px)");

		function open(i, scroll) {
			current = (i + items.length) % items.length;
			items.forEach(function (it, n) { it.classList.toggle("is-open", n === current); });
			dots.forEach(function (d, n) { d.classList.toggle("is-on", n === current); });
			if (scroll && !wide.matches) {
				row.scrollTo({ left: items[current].offsetLeft - row.offsetLeft, behavior: still ? "auto" : "smooth" });
			}
		}

		items.forEach(function (it, n) {
			it.addEventListener("mouseenter", function () { touched = true; open(n); });
			it.addEventListener("focusin", function () { touched = true; open(n); });
		});
		root.querySelectorAll("[data-strip-step]").forEach(function (b) {
			b.addEventListener("click", function () {
				touched = true;
				open(current + Number(b.dataset.stripStep), true);
			});
		});

		var ticking = 0;
		row.addEventListener("scroll", function () {
			if (wide.matches || ticking) return;
			ticking = requestAnimationFrame(function () {
				ticking = 0;
				var mid = row.scrollLeft + row.clientWidth / 2;
				var best = 0;
				items.forEach(function (it, n) {
					if (Math.abs(it.offsetLeft - row.offsetLeft + it.offsetWidth / 2 - mid) <
						Math.abs(items[best].offsetLeft - row.offsetLeft + items[best].offsetWidth / 2 - mid)) best = n;
				});
				if (best !== current) open(best);
			});
		}, { passive: true });

		if (!still) {
			setInterval(function () {
				if (!touched && wide.matches && !document.hidden) open(current + 1);
			}, 5000);
		}
	}
})();
