package layout

import "cmp"

type navItem struct {
	Label, Href, Page string
}

var navItems = []navItem{
	{"Safari", "/", "home"},
	{"Map", "/map/", "map"},
	{"Sightings", "/sightings/", "sightings"},
	{"Animals", "/animals/", "animals"},
	{"Countries", "/countries/", "countries"},
	{"Gallery", "/gallery/", "gallery"},
	{"Stats", "/stats/", "stats"},
	{"Migrations", "/migrations/", "migrations"},
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
