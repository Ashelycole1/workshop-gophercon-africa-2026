package safari

import (
	"fmt"
	"math"
	"strings"
	"workshop/internal/domain/sighting"
)

// Coords writes a position the way a field guide would: 1°23′S 36°49′E.
func Coords(s sighting.Sighting) string {
	return dms(s.Location.Latitude, "N", "S") + " " + dms(s.Location.Longitude, "E", "W")
}

func dms(v float64, pos, neg string) string {
	dir := pos
	if v < 0 {
		dir, v = neg, -v
	}
	deg := math.Floor(v)
	mins := math.Round((v - deg) * 60)
	if mins == 60 {
		deg, mins = deg+1, 0
	}
	return fmt.Sprintf("%.0f°%02.0f′%s", deg, mins, dir)
}

// Elevation is the sighting's height above sea level, or "".
func Elevation(s sighting.Sighting) string {
	if s.Location.ElevationInMetres == nil {
		return ""
	}
	return fmt.Sprintf("%.0f m above sea level", *s.Location.ElevationInMetres)
}

// Precision says how exactly the position is known, or "".
func Precision(s sighting.Sighting) string {
	u := s.Location.CoordinateUncertaintyInMetres
	if u == nil || *u <= 0 {
		return ""
	}
	if *u >= 1000 {
		return fmt.Sprintf("within %.1f km", *u/1000)
	}
	return fmt.Sprintf("within %.0f m", *u)
}

// Basis turns GBIF's basis of record into plain words.
func Basis(s sighting.Sighting) string {
	switch s.BasisOfRecord {
	case "HUMAN_OBSERVATION":
		return "Seen in person"
	case "MACHINE_OBSERVATION":
		return "Camera trap or sensor"
	case "PRESERVED_SPECIMEN":
		return "Museum specimen"
	case "":
		return ""
	}
	return strings.ReplaceAll(strings.ToLower(s.BasisOfRecord), "_", " ")
}

// MapView frames a sighting on the Africa map: its country, or a box
// around the point when it has no outline (small islands).
func MapView(s sighting.Sighting) string {
	if _, ok := countryPaths[s.Location.CountryCode.String()]; ok {
		return CountryViewBox(s.Location.CountryCode.String())
	}
	x, y := Project(s.Location.Latitude, s.Location.Longitude)
	return fmt.Sprintf("%.0f %.0f 160 160", x-80, y-80)
}

// AnimalsIn tallies the animals seen in a country, most first.
func (c Country) AnimalsIn() []sighting.Tally {
	return sighting.Top(sighting.CountBy(c.Sightings, func(s sighting.Sighting) string {
		return AnimalName(s.Species)
	}), 0)
}

// CountriesOf tallies the countries an animal was seen in, most first.
func (a Animal) CountriesOf() []sighting.Tally {
	return sighting.Top(sighting.CountBy(a.Sightings, CountryName), 0)
}

// Cover is the newest sighting with a photo, to head a page.
func Cover(sightings []sighting.Sighting) (sighting.Sighting, bool) {
	for _, s := range sightings {
		if Photo(s) != "" {
			return s, true
		}
	}
	return sighting.Sighting{}, false
}

// Plural writes a count with its noun: "1 sighting", "3 sightings".
func Plural(n int, noun string) string {
	if n == 1 {
		return "1 " + noun
	}
	return fmt.Sprintf("%d %ss", n, noun)
}
