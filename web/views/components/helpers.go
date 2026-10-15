package components

import (
	"strings"
	"workshop/internal/domain/sighting"
	"workshop/web/safari"

	"github.com/a-h/templ"
)

// FilterAttrs marks a list item with what the filter matches it on.
func FilterAttrs(s sighting.Sighting) templ.Attributes {
	return templ.Attributes{
		"data-animal":  safari.Slug(safari.AnimalName(s.Species)),
		"data-country": safari.Slug(safari.CountryName(s)),
		"data-date":    safari.ISODate(s),
		"data-search": strings.ToLower(strings.Join([]string{
			safari.AnimalName(s.Species), s.Species.ScientificName, safari.FullPlace(s), s.RecordedBy,
		}, " ")),
	}
}

// topAnimals keeps the n most-sighted animals.
func topAnimals(site *safari.Site, n int) []safari.Animal {
	if len(site.Animals) > n {
		return site.Animals[:n]
	}
	return site.Animals
}
