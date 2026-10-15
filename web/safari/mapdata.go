package safari

import (
	"fmt"
	"maps"
	"slices"
	"strings"
)

type (
	// MapData is what the Leaflet map plots: a pin per sighting and the
	// country outlines to draw under them, as latitude and longitude.
	MapData struct {
		Pins      []MapPin       `json:"pins"`
		Outlines  [][][2]float64 `json:"outlines"`
		FirstYear int            `json:"firstYear"`
		LastYear  int            `json:"lastYear"`
	}
	// MapPin is one sighting on the map, with what the filters match on.
	MapPin struct {
		URL     string  `json:"url"`
		Animal  string  `json:"animal"`
		Slug    string  `json:"slug"`
		Country string  `json:"country"`
		Place   string  `json:"place"`
		Spotter string  `json:"spotter"`
		Date    string  `json:"date"`
		Year    int     `json:"year"`
		Photo   string  `json:"photo,omitzero"`
		Lat     float64 `json:"lat"`
		Lng     float64 `json:"lng"`
	}
)

// MapData gathers the map's pins and outlines.
func (s *Site) MapData() MapData {
	var d MapData
	for _, sight := range s.Sightings {
		year := sight.HappenedAt.Year()
		if d.FirstYear == 0 || year < d.FirstYear {
			d.FirstYear = year
		}
		d.LastYear = max(d.LastYear, year)
		d.Pins = append(d.Pins, MapPin{
			URL:     SightingURL(sight),
			Animal:  AnimalName(sight.Species),
			Slug:    Slug(AnimalName(sight.Species)),
			Country: Slug(CountryName(sight)),
			Place:   FullPlace(sight),
			Spotter: Spotter(sight),
			Date:    Date(sight),
			Year:    year,
			Photo:   Sized(Photo(sight), "small"),
			Lat:     sight.Location.Latitude,
			Lng:     sight.Location.Longitude,
		})
	}
	for _, code := range slices.Sorted(maps.Keys(countryPaths)) {
		d.Outlines = append(d.Outlines, rings(countryPaths[code])...)
	}
	return d
}

// rings turns map-space path data back into latitude and longitude rings,
// inverting Project.
func rings(d string) [][][2]float64 {
	var out [][][2]float64
	for _, part := range strings.Split(d, "M") {
		var ring [][2]float64
		for _, pt := range strings.FieldsFunc(part, func(r rune) bool { return r == 'L' || r == 'Z' }) {
			var x, y float64
			if _, err := fmt.Sscanf(pt, "%g %g", &x, &y); err == nil {
				ring = append(ring, [2]float64{38 - y/10, x/10 - 18.5})
			}
		}
		if len(ring) > 2 {
			out = append(out, ring)
		}
	}
	return out
}
