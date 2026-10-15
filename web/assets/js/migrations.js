// Migrations: one month slider moves every herd along its trail, the walked
// part of the trail fills in, and the month's stop is highlighted. Play runs
// through the year.
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
		return {
			el: el, trail: trail, herd: herd, total: total, at: at, pos: null, frame: 0,
			stops: el.querySelectorAll("[data-stop]"),
			months: el.querySelectorAll("[data-month]")
		};
	}

	function place(r, len) {
		var p = r.trail.getPointAtLength(len);
		r.herd.setAttribute("transform", "translate(" + p.x.toFixed(2) + " " + p.y.toFixed(2) + ")");
		r.trail.style.strokeDashoffset = String(r.total - len);
	}

	function go(r, month) {
		var to = r.at[month];
		var from = r.pos === null ? to : r.pos;
		cancelAnimationFrame(r.frame);
		r.stops.forEach(function (s, i) { s.classList.toggle("is-now", i === month); });
		r.months.forEach(function (m, i) { m.classList.toggle("is-now", i === month); });
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
			m.addEventListener("click", function () { stop(); show(i, false); });
		});
	});

	bar.hidden = false;
	document.documentElement.classList.add("has-months");
	show(+bar.dataset.start, true);
})();
