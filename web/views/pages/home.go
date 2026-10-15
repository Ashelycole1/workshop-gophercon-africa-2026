package pages

import (
	"strconv"
	"time"
	"workshop/internal/domain/sighting"
	"workshop/web/safari"
)

// letters splits a word so each letter can rise on its own.
func letters(word string) []string {
	var out []string
	for _, r := range word {
		out = append(out, string(r))
	}
	return out
}

// delay staggers the hero's letters, 45ms apart.
func delay(i int) string {
	return "--i:" + strconv.Itoa(i)
}

// latest keeps the n newest sightings.
func latest(site *safari.Site, n int) []sighting.Sighting {
	if len(site.Sightings) > n {
		return site.Sightings[:n]
	}
	return site.Sightings
}

// bestSpot is today's featured sighting.
func bestSpot(site *safari.Site) (sighting.Sighting, bool) {
	return safari.BestSpot(site.Sightings, time.Now())
}

// spotters counts the distinct people behind the sightings.
func spotters(site *safari.Site) int {
	return len(site.Recorders())
}

// itoa is strconv.Itoa, short for templates.
func itoa(n int) string {
	return strconv.Itoa(n)
}
