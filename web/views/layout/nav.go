package layout

import "cmp"

type navItem struct {
	Label, Href, Page, Icon string
}

var navItems = []navItem{
	{"Safari", "/", "home", "house"},
	{"Map", "/map/", "map", "map-trifold"},
	{"Sightings", "/sightings/", "sightings", "binoculars"},
	{"Animals", "/animals/", "animals", "paw-print"},
	{"Countries", "/countries/", "countries", "globe-hemisphere-east"},
	{"Gallery", "/gallery/", "gallery", "images"},
	{"Stats", "/stats/", "stats", "chart-bar"},
	{"Migrations", "/migrations/", "migrations", "path"},
}

// pageTitle puts the site's name after the page's.
func pageTitle(title string) string {
	if title == "" {
		return "Karibu Safari · GopherCon Africa 2026"
	}
	return title + " · Karibu Safari"
}

// description falls back to the site's one-line pitch.
func description(d string) string {
	return cmp.Or(d, "A living safari of real African wildlife sightings, made in Go for GopherCon Africa 2026.")
}
