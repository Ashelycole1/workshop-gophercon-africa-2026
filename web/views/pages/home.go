package pages

import (
	"strconv"
	"strings"
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

// topNames lists the first n names of a tally, joined for reading.
func topNames(rows []sighting.Tally, n int) string {
	var names []string
	for i, r := range rows {
		if i == n {
			break
		}
		names = append(names, r.Name)
	}
	return strings.Join(names, ", ")
}

// animalTip points at where an animal was last seen.
func animalTip(a safari.Animal) string {
	if len(a.Sightings) == 0 {
		return ""
	}
	return "Psst, the latest one was spotted in " + safari.Place(a.Sightings[0]) + "!"
}

// countriesTip cheers on the busiest country and its nearest rival.
func countriesTip(site *safari.Site) string {
	if len(site.Countries) < 2 {
		return ""
	}
	return site.Countries[0].Name + " is winning today. Can " + site.Countries[1].Name + " catch up?"
}

// years lists every year from the first sighting to the last.
func years(site *safari.Site) []int {
	if len(site.Sightings) == 0 {
		return nil
	}
	last, first := site.Sightings[0].HappenedAt.Year(), site.Sightings[len(site.Sightings)-1].HappenedAt.Year()
	out := make([]int, 0, last-first+1)
	for y := first; y <= last; y++ {
		out = append(out, y)
	}
	return out
}

// statsTip cheers on whichever animal is ahead.
func statsTip(site *safari.Site) string {
	if len(site.Animals) == 0 {
		return ""
	}
	return site.Animals[0].Name + " sightings are winning today!"
}

// topSpotters ranks the people with the most sightings.
func topSpotters(site *safari.Site, n int) []sighting.Tally {
	rows := site.Recorders()
	if len(rows) > n {
		rows = rows[:n]
	}
	return rows
}

// countriesSummary names the busiest country for the chart's caption.
func countriesSummary(site *safari.Site) string {
	if len(site.Countries) == 0 {
		return "No sightings yet."
	}
	c := site.Countries[0]
	return c.Name + " leads with " + safari.Plural(len(c.Sightings), "sighting") + ". Click a country to visit it."
}

// yearsSummary describes the busiest year for the chart's caption.
func yearsSummary(site *safari.Site) string {
	best := safari.Column{}
	for _, c := range site.Columns() {
		if c.Value > best.Value {
			best = c
		}
	}
	if best.Value == 0 {
		return "No sightings yet."
	}
	return "Sightings per year. The busiest was " + itoa(best.Year) + ", with " + safari.Plural(best.Value, "sighting") + "."
}

// galleryPhotos is every photo on the safari.
func galleryPhotos(site *safari.Site) []safari.Shot {
	return site.Shots()
}
