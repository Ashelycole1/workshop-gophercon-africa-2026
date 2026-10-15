package handlers

import (
	"net/http"
	"workshop/web/safari"
	"workshop/web/views/pages"

	"github.com/a-h/templ"
)

// Sighting is one sighting's field log.
func Sighting(r *http.Request, site *safari.Site) (templ.Component, bool) {
	s, i, ok := site.Find(r.PathValue("id"))
	if !ok {
		return nil, false
	}
	props := pages.SightingProps{Sighting: s, Animal: site.AnimalOf(s), Related: site.Related(s, 4)}
	if i > 0 {
		props.Newer = &site.Sightings[i-1]
	}
	if i < len(site.Sightings)-1 {
		props.Older = &site.Sightings[i+1]
	}
	return pages.Sighting(props), true
}

// Animals is the index of every animal seen.
func Animals(r *http.Request, site *safari.Site) (templ.Component, bool) {
	return pages.Animals(site), true
}

// Animal is one animal and every sighting of it.
func Animal(r *http.Request, site *safari.Site) (templ.Component, bool) {
	a, ok := site.Animal(r.PathValue("slug"))
	if !ok {
		return nil, false
	}
	return pages.Animal(site, a), true
}

// Countries is the index of every country with sightings.
func Countries(r *http.Request, site *safari.Site) (templ.Component, bool) {
	return pages.Countries(site), true
}

// Country is one country and every sighting in it.
func Country(r *http.Request, site *safari.Site) (templ.Component, bool) {
	c, ok := site.Country(r.PathValue("slug"))
	if !ok {
		return nil, false
	}
	return pages.Country(site, c), true
}
