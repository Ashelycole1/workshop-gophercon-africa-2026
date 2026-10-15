// Karibu Safari: shared behaviour on every page. No framework, no build step.
(function () {
	"use strict";

	var root = document.documentElement;
	root.classList.add("js");
	var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
	var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

	function store(key, value) {
		try {
			if (value === undefined) return localStorage.getItem(key);
			localStorage.setItem(key, value);
		} catch (e) { return null; }
	}

	function toast(html, ms) {
		var old = document.querySelector(".toast");
		if (old) old.remove();
		var el = document.createElement("div");
		el.className = "toast";
		el.setAttribute("role", "status");
		el.innerHTML = html;
		document.body.appendChild(el);
		setTimeout(function () { el.remove(); }, ms || 4200);
	}
	window.safariToast = toast;

	function confetti() {
		if (reduced) return;
		var colours = ["#1E7A3A", "#F2B312", "#C0391B", "#6AD4E8", "#E26D1F"];
		var box = document.createElement("div");
		box.className = "confetti";
		box.setAttribute("aria-hidden", "true");
		for (var i = 0; i < 110; i++) {
			var p = document.createElement("i");
			p.style.left = Math.random() * 100 + "vw";
			p.style.background = colours[i % colours.length];
			p.style.setProperty("--dx", (Math.random() * 200 - 100) + "px");
			p.style.setProperty("--r", (Math.random() * 1080 - 540) + "deg");
			p.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
			p.style.animationDelay = Math.random() * .4 + "s";
			box.appendChild(p);
		}
		document.body.appendChild(box);
		setTimeout(function () { box.remove(); }, 4200);
	}
	window.safariConfetti = confetti;

	// Day and night safari.

	var themeBtn = document.querySelector(".theme-toggle");
	function setTheme(theme, remember) {
		root.dataset.theme = theme;
		if (remember) store("safari_theme", theme);
		if (themeBtn) themeBtn.setAttribute("aria-label", theme === "night" ? "Switch to day safari" : "Switch to night safari");
		fireflies(theme === "night");
		document.dispatchEvent(new CustomEvent("safari:theme", { detail: theme }));
	}
	if (themeBtn) {
		themeBtn.addEventListener("click", function () {
			setTheme(root.dataset.theme === "night" ? "day" : "night", true);
		});
	}

	function fireflies(on) {
		document.querySelectorAll(".firefly").forEach(function (f) { f.remove(); });
		if (!on || reduced) return;
		for (var i = 0; i < 14; i++) {
			var f = document.createElement("span");
			f.className = "firefly";
			f.setAttribute("aria-hidden", "true");
			f.style.left = 5 + Math.random() * 90 + "vw";
			f.style.top = 30 + Math.random() * 65 + "vh";
			f.style.setProperty("--d", 7 + Math.random() * 8 + "s");
			f.style.setProperty("--delay", -Math.random() * 8 + "s");
			document.body.appendChild(f);
		}
	}
	setTheme(root.dataset.theme || "day", false);

	// Konami code: up up down down left right left right b a.
	var konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
	var progress = 0;
	document.addEventListener("keydown", function (e) {
		var key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
		progress = key === konami[progress] ? progress + 1 : (key === konami[0] ? 1 : 0);
		if (progress === konami.length) {
			progress = 0;
			setTheme("night", true);
			confetti();
			toast("Night safari unlocked. Listen for the hyenas.");
		}
	});

	// Mobile menu.

	var navBtn = document.querySelector(".nav-toggle");
	var nav = document.getElementById("site-nav");
	if (navBtn && nav) {
		navBtn.addEventListener("click", function () {
			var open = navBtn.getAttribute("aria-expanded") !== "true";
			navBtn.setAttribute("aria-expanded", String(open));
			nav.classList.toggle("is-open", open);
		});
		document.addEventListener("keydown", function (e) {
			if (e.key === "Escape" && nav.classList.contains("is-open")) {
				navBtn.setAttribute("aria-expanded", "false");
				nav.classList.remove("is-open");
				navBtn.focus();
			}
		});
	}

	// Scroll reveals, staggered within each group.

	var reveals = document.querySelectorAll(".reveal");
	if ("IntersectionObserver" in window && !reduced) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (!entry.isIntersecting) return;
				var el = entry.target;
				var siblings = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
				el.style.setProperty("--delay", Math.min(siblings % 8, 7) * 60 + "ms");
				el.classList.add("is-visible");
				io.unobserve(el);
			});
		}, { rootMargin: "0px 0px -8% 0px" });
		reveals.forEach(function (el) { io.observe(el); });
	} else {
		reveals.forEach(function (el) { el.classList.add("is-visible"); });
	}

	// Tilt on hover, at most six degrees.

	if (finePointer && !reduced) {
		document.addEventListener("pointermove", function (e) {
			var card = e.target.closest && e.target.closest("[data-tilt], .card");
			if (!card) return;
			var r = card.getBoundingClientRect();
			var x = (e.clientX - r.left) / r.width - .5;
			var y = (e.clientY - r.top) / r.height - .5;
			card.style.transform = "perspective(900px) rotateY(" + (x * 12).toFixed(2) + "deg) rotateX(" + (-y * 12).toFixed(2) + "deg) translateY(-4px)";
		});
		document.addEventListener("pointerout", function (e) {
			var card = e.target.closest && e.target.closest("[data-tilt], .card");
			if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
		});
	}

	// Count-up numbers.

	var counters = document.querySelectorAll("[data-count]");
	function countUp(el) {
		var end = parseFloat(el.dataset.count);
		if (reduced || !isFinite(end)) { el.textContent = el.dataset.count; return; }
		var start = performance.now(), dur = 1200;
		(function tick(now) {
			var t = Math.min(1, (now - start) / dur);
			el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3))).toLocaleString("en-GB");
			if (t < 1) requestAnimationFrame(tick);
		})(start);
	}
	if (counters.length && "IntersectionObserver" in window) {
		var cio = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) { countUp(entry.target); cio.unobserve(entry.target); }
			});
		});
		counters.forEach(function (el) { cio.observe(el); });
	}

	// The Gopher Guide.

	var gopher = document.querySelector(".gopher");
	if (!gopher) return;
	var bubble = gopher.querySelector(".gopher__bubble");
	var say = gopher.querySelector(".gopher__say");
	var avatar = gopher.querySelector(".gopher__avatar");
	var welcome = say.textContent;
	var tip = gopher.dataset.tip;
	var tipTimer;

	var jokes = [
		"Why did the gopher refuse to share memory? It prefers to communicate.",
		"A lion walks into a goroutine. Nobody waits for it.",
		"I tried to catch a zebra, but it returned a nil pointer… just stripes.",
		"<code>if err != nil { return safari.Njema() }</code>",
		"My favourite animal? The <code>select</code>-ive leopard. It only waits on one channel.",
		"Why are giraffes great at code review? They always see the bigger picture.",
	];

	function openBubble(text, isTip, focus) {
		clearTimeout(tipTimer);
		say.innerHTML = "";
		say.textContent = text;
		bubble.classList.toggle("gopher__bubble--tip", !!isTip);
		bubble.hidden = false;
		avatar.setAttribute("aria-expanded", "true");
		if (focus) {
			var first = bubble.querySelector(isTip ? ".gopher__close" : "[data-gopher-start]");
			if (first) first.focus();
		}
	}

	function closeBubble(returnFocus) {
		if (bubble.hidden) return;
		bubble.hidden = true;
		avatar.setAttribute("aria-expanded", "false");
		gopher.classList.remove("is-big");
		store("gopher_seen", "1");
		if (returnFocus) avatar.focus();
	}

	setTimeout(function () {
		gopher.classList.add("is-in");
		if (!store("gopher_seen")) {
			gopher.classList.add("is-big");
			openBubble(welcome, false, false);
		} else if (tip && sessionStorageGet("tip:" + location.pathname) !== "1") {
			openBubble(tip, true, false);
			sessionStorageSet("tip:" + location.pathname, "1");
			tipTimer = setTimeout(function () { closeBubble(false); }, 7000);
		}
	}, reduced ? 0 : 900);

	function sessionStorageGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
	function sessionStorageSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { } }

	var clicks = 0, clickTimer;
	avatar.addEventListener("click", function () {
		clicks++;
		clearTimeout(clickTimer);
		clickTimer = setTimeout(function () { clicks = 0; }, 1600);
		if (clicks >= 5) {
			clicks = 0;
			confetti();
			openBubble("", true, false);
			say.innerHTML = jokes[Math.floor(Math.random() * jokes.length)];
			return;
		}
		if (bubble.hidden) openBubble(tip || welcome, !!tip, true);
		else closeBubble(false);
	});

	bubble.querySelector(".gopher__close").addEventListener("click", function () { closeBubble(true); });
	bubble.querySelector("[data-gopher-later]").addEventListener("click", function () { closeBubble(true); });
	bubble.querySelector("[data-gopher-start]").addEventListener("click", function () { store("gopher_seen", "1"); });

	document.addEventListener("keydown", function (e) {
		if (e.key === "Escape" && !bubble.hidden) closeBubble(bubble.contains(document.activeElement));
		if (e.key === "Tab" && !bubble.hidden && bubble.contains(document.activeElement)) {
			var items = Array.prototype.filter.call(bubble.querySelectorAll("a, button"), function (el) { return el.offsetParent !== null; });
			var first = items[0], last = items[items.length - 1];
			if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
			else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
		}
	});
	document.addEventListener("click", function (e) {
		if (!bubble.hidden && !gopher.contains(e.target)) closeBubble(false);
	});
})();
