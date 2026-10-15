// Karibu Safari: on the landing page, an animal in the grass peeks out and
// ducks back every 6 to 10 seconds.
(function () {
	"use strict";

	if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	var peekers = Array.prototype.slice.call(document.querySelectorAll(".peeker"));
	if (!peekers.length) return;
	var field = document.querySelector(".grassline");
	var onScreen = false;

	if ("IntersectionObserver" in window) {
		new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; }).observe(field);
	}

	function peek() {
		var visible = peekers.filter(function (p) { return p.offsetParent !== null; });
		if (onScreen && visible.length && !field.matches(":hover")) {
			var p = visible[Math.floor(Math.random() * visible.length)];
			p.classList.add("is-peeking");
			setTimeout(function () {
				p.classList.remove("is-peeking");
				p.classList.add("is-ducking");
				setTimeout(function () { p.classList.remove("is-ducking"); }, 700);
			}, 2200);
		}
		setTimeout(peek, 6000 + Math.random() * 4000);
	}
	setTimeout(peek, 2500);
})();
