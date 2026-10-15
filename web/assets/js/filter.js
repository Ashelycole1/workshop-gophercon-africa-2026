// Narrows a list in place: a chip ticked or a word typed hides the items that
// don't match and counts those that do. Adapted from the workshop's filter block.
(function () {
	"use strict";

	document.querySelectorAll("form[data-filter]").forEach(function (form) {
		var list = document.getElementById(form.dataset.filter);
		if (!list) return;

		var items = Array.prototype.map.call(list.children, function (el) {
			return { el: el, data: Object.assign({}, el.dataset) };
		});
		var search = form.querySelector('input[type="search"]');
		var count = form.querySelector(".filter__count");
		var frame = 0;

		function selected() {
			var groups = {};
			form.querySelectorAll("input:checked").forEach(function (box) {
				(groups[box.name] = groups[box.name] || []).push(box.value);
				box.closest(".chip").classList.add("is-active");
			});
			form.querySelectorAll("input[type=checkbox]:not(:checked)").forEach(function (box) {
				box.closest(".chip").classList.remove("is-active");
			});
			return groups;
		}

		function matches(data, groups, query) {
			for (var key in groups) {
				if (groups[key].indexOf(data[key]) < 0) return false;
			}
			return !query || (data.search || "").indexOf(query) >= 0;
		}

		function apply() {
			frame = 0;
			var groups = selected();
			var query = search ? search.value.trim().toLowerCase() : "";
			var shown = 0;
			items.forEach(function (item) {
				var show = matches(item.data, groups, query);
				item.el.hidden = !show;
				if (show) {
					shown++;
					item.el.classList.add("is-visible");
				}
			});
			count.textContent = shown === 0
				? "No sightings match. Clear a filter to see more."
				: "Showing " + shown + " of " + items.length;
		}

		function schedule() {
			if (!frame) frame = requestAnimationFrame(apply);
		}

		form.addEventListener("input", schedule);
		form.addEventListener("reset", schedule);
		form.addEventListener("submit", function (e) { e.preventDefault(); });
		form.hidden = false;
	});
})();
