package safari

import (
	"cmp"
	"fmt"
	"strings"
	"workshop/internal/domain/sighting"
)

// Photo returns the URL of the sighting's first still image, or "".
func Photo(s sighting.Sighting) string {
	for _, m := range s.Media {
		if m.Type == "StillImage" && m.URL != "" {
			return m.URL
		}
	}
	return ""
}

// Photos returns the sighting's still images.
func Photos(s sighting.Sighting) []sighting.Media {
	var out []sighting.Media
	for _, m := range s.Media {
		if m.Type == "StillImage" && m.URL != "" {
			out = append(out, m)
		}
	}
	return out
}

// Sized asks iNaturalist for a smaller copy of a photo: "small" (240px),
// "medium" (500px) or "large" (1024px). Other hosts get the URL unchanged.
func Sized(url, size string) string {
	if !strings.Contains(url, "inaturalist-open-data") || !strings.Contains(url, "/original.") {
		return url
	}
	return strings.Replace(url, "/original.", "/"+size+".", 1)
}

// Thumb is the sighting's photo at card size.
func Thumb(s sighting.Sighting) string {
	return Sized(Photo(s), "medium")
}

// Credit says who took a photo and under which licence.
func Credit(m sighting.Media) string {
	who := cmp.Or(m.Creator, m.RightsHolder)
	if who == "" {
		return licence(m.License)
	}
	if l := licence(m.License); l != "" {
		return fmt.Sprintf("📷 %s · %s", who, l)
	}
	return "📷 " + who
}

func licence(url string) string {
	switch {
	case strings.Contains(url, "by-nc-sa"):
		return "CC BY-NC-SA"
	case strings.Contains(url, "by-nc"):
		return "CC BY-NC"
	case strings.Contains(url, "by-sa"):
		return "CC BY-SA"
	case strings.Contains(url, "/by/"):
		return "CC BY"
	case strings.Contains(url, "zero"), strings.Contains(url, "publicdomain"):
		return "CC0"
	}
	return ""
}

// Alt describes a sighting's photo for screen readers.
func Alt(s sighting.Sighting) string {
	return fmt.Sprintf("%s photographed in %s", AnimalName(s.Species), FullPlace(s))
}

// Spotter is who recorded the sighting, for "Spotted by …" lines.
func Spotter(s sighting.Sighting) string {
	return cmp.Or(s.RecordedBy, "an anonymous ranger")
}

// Date formats when the sighting happened.
func Date(s sighting.Sighting) string {
	return s.HappenedAt.Format("2 Jan 2006")
}

// LongDate formats when the sighting happened, with the weekday.
func LongDate(s sighting.Sighting) string {
	return s.HappenedAt.Format("Monday 2 January 2006, 15:04")
}

// ISODate is the sighting's date for <time datetime> and data attributes.
func ISODate(s sighting.Sighting) string {
	return s.HappenedAt.Format("2006-01-02")
}

// Count says how many animals were seen, or "".
func Count(s sighting.Sighting) string {
	if s.IndividualCount == nil || *s.IndividualCount < 1 {
		return ""
	}
	if *s.IndividualCount == 1 {
		return "1 individual"
	}
	return fmt.Sprintf("%d individuals", *s.IndividualCount)
}

// SightingURL is the sighting's page.
func SightingURL(s sighting.Sighting) string {
	return "/sightings/" + s.ID.String()
}

// AnimalURL is the page for the animal a sighting is of.
func AnimalURL(s sighting.Sighting) string {
	return "/animals/" + Slug(AnimalName(s.Species))
}

// CountryURL is the page for the country a sighting was made in.
func CountryURL(s sighting.Sighting) string {
	return "/countries/" + Slug(CountryName(s))
}
