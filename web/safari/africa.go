package safari

import (
	"cmp"
	"fmt"
	"maps"
	"math"
	"slices"
	"strings"
	"workshop/internal/domain/sighting"
)

// africa names each African country by the name a visitor would use.
var africa = map[string]string{
	"AO": "Angola", "BF": "Burkina Faso", "BI": "Burundi", "BJ": "Benin", "BW": "Botswana",
	"CD": "DR Congo", "CF": "Central African Republic", "CG": "Congo", "CI": "Côte d'Ivoire",
	"CM": "Cameroon", "CV": "Cabo Verde", "DJ": "Djibouti", "DZ": "Algeria", "EG": "Egypt",
	"EH": "Western Sahara", "ER": "Eritrea", "ET": "Ethiopia", "GA": "Gabon", "GH": "Ghana",
	"GM": "Gambia", "GN": "Guinea", "GQ": "Equatorial Guinea", "GW": "Guinea-Bissau",
	"KE": "Kenya", "KM": "Comoros", "LR": "Liberia", "LS": "Lesotho", "LY": "Libya",
	"MA": "Morocco", "MG": "Madagascar", "ML": "Mali", "MR": "Mauritania", "MU": "Mauritius",
	"MW": "Malawi", "MZ": "Mozambique", "NA": "Namibia", "NE": "Niger", "NG": "Nigeria",
	"RE": "Réunion", "RW": "Rwanda", "SC": "Seychelles", "SD": "Sudan", "SH": "Saint Helena",
	"SL": "Sierra Leone", "SN": "Senegal", "SO": "Somalia", "SS": "South Sudan",
	"ST": "São Tomé and Príncipe", "SZ": "Eswatini", "TD": "Chad", "TG": "Togo",
	"TN": "Tunisia", "TZ": "Tanzania", "UG": "Uganda", "YT": "Mayotte", "ZA": "South Africa",
	"ZM": "Zambia", "ZW": "Zimbabwe",
}

// InAfrica reports whether a sighting was made in an African country.
func InAfrica(s sighting.Sighting) bool {
	_, ok := africa[s.Location.CountryCode.String()]
	return ok
}

// CountryName is the sighting's country as a visitor would say it.
func CountryName(s sighting.Sighting) string {
	return cmp.Or(africa[s.Location.CountryCode.String()], s.Location.Country, "Somewhere in Africa")
}

// Place is the most specific place name the sighting has, then its country.
func Place(s sighting.Sighting) string {
	return cmp.Or(s.Location.Locality, s.Location.StateProvince, CountryName(s))
}

// FullPlace joins every distinct part of the location the sighting has.
func FullPlace(s sighting.Sighting) string {
	var parts []string
	for _, p := range []string{s.Location.Locality, s.Location.StateProvince, CountryName(s)} {
		if p != "" && !slices.ContainsFunc(parts, func(q string) bool { return strings.EqualFold(p, q) }) {
			parts = append(parts, p)
		}
	}
	return strings.Join(parts, ", ")
}

// MapWidth and MapHeight are the size of the Africa map's coordinate space.
const (
	MapWidth  = 710
	MapHeight = 740
)

// Project turns a latitude and longitude into map space. It's the same
// equirectangular projection the country outlines were drawn with.
func Project(lat, lon float64) (x, y float64) {
	return (lon + 18.5) * 10, (38 - lat) * 10
}

// X and Y place a sighting on the map, as strings for SVG attributes.
func X(s sighting.Sighting) string {
	x, _ := Project(s.Location.Latitude, s.Location.Longitude)
	return fmt.Sprintf("%.1f", x)
}

func Y(s sighting.Sighting) string {
	_, y := Project(s.Location.Latitude, s.Location.Longitude)
	return fmt.Sprintf("%.1f", y)
}

// MapViewBox is the whole Africa map's viewBox.
func MapViewBox() string {
	return fmt.Sprintf("0 0 %d %d", MapWidth, MapHeight)
}

// CountryViewBox frames a country's outline with some breathing room.
func CountryViewBox(code string) string {
	d, ok := countryPaths[code]
	if !ok {
		return MapViewBox()
	}
	minX, minY, maxX, maxY := math.Inf(1), math.Inf(1), math.Inf(-1), math.Inf(-1)
	for _, seg := range strings.FieldsFunc(d, func(r rune) bool { return r == 'M' || r == 'L' || r == 'Z' }) {
		var x, y float64
		if _, err := fmt.Sscanf(seg, "%g %g", &x, &y); err != nil {
			continue
		}
		minX, minY = math.Min(minX, x), math.Min(minY, y)
		maxX, maxY = math.Max(maxX, x), math.Max(maxY, y)
	}
	pad := math.Max(maxX-minX, maxY-minY)*0.25 + 10
	return fmt.Sprintf("%.0f %.0f %.0f %.0f", minX-pad, minY-pad, maxX-minX+2*pad, maxY-minY+2*pad)
}

// Outline is one country's path on the map.
type Outline struct {
	Code string
	D    string
}

// Outlines returns every African country's outline, in a stable order.
func Outlines() []Outline {
	out := make([]Outline, 0, len(countryPaths))
	for _, code := range slices.Sorted(maps.Keys(countryPaths)) {
		out = append(out, Outline{Code: code, D: countryPaths[code]})
	}
	return out
}

// CountryPath is a country's outline in map space, or "" if it has none.
func CountryPath(code string) string {
	return countryPaths[code]
}
