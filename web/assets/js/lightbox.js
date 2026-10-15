// Opens a[data-lightbox] photos in the layout's #lightbox dialog. Photos with
// the same data-lightbox value form a set: arrow keys, the buttons and a
// sideways swipe move through it. Adapted from the workshop's lightbox block.
(function () {
	"use strict";

	var dialog = document.getElementById("lightbox");
	if (!dialog || typeof dialog.showModal !== "function") return;

	var img = dialog.querySelector(".lightbox__image");
	var text = dialog.querySelector(".lightbox__text");
	var credit = dialog.querySelector(".lightbox__credit");
	var count = dialog.querySelector(".lightbox__count");
	var prev = dialog.querySelector(".lightbox__btn--prev");
	var next = dialog.querySelector(".lightbox__btn--next");
	var set = [], at = 0;

	function web(link) {
		return /^https?:$/.test(new URL(link.href, location.href).protocol);
	}

	function show(i) {
		at = (i + set.length) % set.length;
		var link = set[at];
		var thumb = link.querySelector("img");
		img.classList.remove("is-in");
		img.src = link.href;
		img.alt = thumb ? thumb.alt : "";
		// textContent only: captions and credits are GBIF's, so untrusted.
		text.textContent = link.dataset.caption || "";
		credit.textContent = link.dataset.credit ? "Photo: " + link.dataset.credit : "";
		count.textContent = set.length > 1 ? (at + 1) + " of " + set.length : "";
		prev.hidden = next.hidden = set.length < 2;
	}
	img.addEventListener("load", function () { img.classList.add("is-in"); });

	document.addEventListener("click", function (e) {
		var link = e.target.closest("a[data-lightbox]");
		if (!link || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !web(link)) return;
		e.preventDefault();
		var group = link.dataset.lightbox;
		set = Array.prototype.filter.call(document.querySelectorAll("a[data-lightbox]"), function (a) {
			return a.dataset.lightbox === group && web(a) && a.offsetParent !== null;
		});
		if (set.indexOf(link) < 0) set = [link];
		show(set.indexOf(link));
		dialog.showModal();
	});

	prev.addEventListener("click", function () { show(at - 1); });
	next.addEventListener("click", function () { show(at + 1); });
	dialog.addEventListener("keydown", function (e) {
		if (e.key === "ArrowLeft") { e.preventDefault(); show(at - 1); }
		if (e.key === "ArrowRight") { e.preventDefault(); show(at + 1); }
	});

	var startX = null;
	dialog.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
	dialog.addEventListener("touchend", function (e) {
		if (startX === null || set.length < 2) return;
		var dx = e.changedTouches[0].clientX - startX;
		if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
		startX = null;
	});

	dialog.addEventListener("click", function (e) {
		if (e.target === dialog) dialog.close();
	});
	dialog.addEventListener("close", function () {
		img.removeAttribute("src");
		if (set[at]) set[at].focus();
	});
})();
