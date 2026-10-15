// Karibu Safari: one tooltip for every chart mark with data-tip, following the
// pointer on hover and sitting above the mark on keyboard focus.
(function () {
	"use strict";

	var tip = document.createElement("div");
	tip.className = "chart-tip";
	tip.hidden = true;
	tip.setAttribute("aria-hidden", "true");
	document.body.appendChild(tip);

	function show(el, x, y) {
		tip.textContent = el.getAttribute("data-tip");
		tip.style.left = x + "px";
		tip.style.top = y + "px";
		tip.hidden = false;
	}

	document.addEventListener("pointermove", function (e) {
		var el = e.target.closest && e.target.closest("[data-tip]");
		if (!el) { tip.hidden = true; return; }
		show(el, e.clientX, e.clientY);
	});
	document.addEventListener("focusin", function (e) {
		var el = e.target.closest && e.target.closest("[data-tip]");
		if (!el) { tip.hidden = true; return; }
		var r = el.getBoundingClientRect();
		show(el, r.left + r.width / 2, r.top);
	});
	document.addEventListener("focusout", function () { tip.hidden = true; });
	addEventListener("scroll", function () { tip.hidden = true; }, { passive: true });
})();
