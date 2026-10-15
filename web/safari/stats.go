package safari

import (
	"fmt"
	"workshop/internal/domain/sighting"
)

type (
	// Bar is one row of a bar chart: a label, its value, the bar's share of
	// the longest, and where it leads.
	Bar struct {
		Label string
		Value int
		Width string
		Href  string
	}
	// Column is one year of the sightings-over-time chart, drawn in a 600
	// by 200 SVG box as a bar with a rounded top on the baseline.
	Column struct {
		Year  int
		Value int
		D     string
		Label bool
	}
	// Highlight is a headline fact about the safari, with its sighting.
	Highlight struct {
		Title    string
		Value    string
		Note     string
		Sighting sighting.Sighting
	}
)

// Bars turns a tally into chart rows, the longest bar at full width.
func Bars(rows []sighting.Tally, n int, href func(string) string) []Bar {
	if n > 0 && len(rows) > n {
		rows = rows[:n]
	}
	top := 1
	for _, r := range rows {
		top = max(top, r.Count)
	}
	out := make([]Bar, len(rows))
	for i, r := range rows {
		out[i] = Bar{Label: r.Name, Value: r.Count, Width: fmt.Sprintf("%.1f%%", float64(r.Count)/float64(top)*100)}
		if href != nil {
			out[i].Href = href(r.Name)
		}
	}
	return out
}

// AnimalBars tallies sightings per animal.
func (s *Site) AnimalBars(n int) []Bar {
	rows := make([]sighting.Tally, len(s.Animals))
	for i, a := range s.Animals {
		rows[i] = sighting.Tally{Name: a.Name, Count: len(a.Sightings)}
	}
	return Bars(rows, n, func(name string) string { return "/animals/" + Slug(name) })
}

// CountryBars tallies sightings per country.
func (s *Site) CountryBars() []Bar {
	rows := make([]sighting.Tally, len(s.Countries))
	for i, c := range s.Countries {
		rows[i] = sighting.Tally{Name: c.Name, Count: len(c.Sightings)}
	}
	return Bars(rows, 0, func(name string) string { return "/countries/" + Slug(name) })
}

// SkyBars tallies the weather the sightings were made in.
func (s *Site) SkyBars() []Bar {
	return Bars(sighting.Top(sighting.CountBy(s.Sightings, func(sight sighting.Sighting) string {
		sky, ok := Weather(sight)
		if !ok {
			return ""
		}
		return sky.Word
	}), 0), 0, nil)
}

// Columns counts sightings per year, every year from the first to the last
// so empty years show as gaps.
func (s *Site) Columns() []Column {
	if len(s.Sightings) == 0 {
		return nil
	}
	counts := sighting.CountByYear(s.Sightings)
	first, last := s.Sightings[len(s.Sightings)-1].HappenedAt.Year(), s.Sightings[0].HappenedAt.Year()
	top := 1
	for _, c := range counts {
		top = max(top, c)
	}
	n := last - first + 1
	slot := 600.0 / float64(n)
	w := slot - 2
	var out []Column
	for i := range n {
		year := first + i
		h := float64(counts[year]) / float64(top) * 180
		out = append(out, Column{
			Year:  year,
			Value: counts[year],
			D:     column(float64(i)*slot+1, w, h),
			Label: n <= 12 || i%2 == 0 || i == n-1,
		})
	}
	return out
}

// column draws a bar standing on y=200 with its top corners rounded by 4.
func column(x, w, h float64) string {
	if h <= 0 {
		return ""
	}
	r := min(4, w/2, h)
	y := 200 - h
	return fmt.Sprintf("M%.1f 200V%.1fQ%.1f %.1f %.1f %.1fH%.1fQ%.1f %.1f %.1f %.1fV200Z",
		x, y+r, x, y, x+r, y, x+w-r, x+w, y, x+w, y+r)
}

// Highlights picks the safari's headline facts.
func (s *Site) Highlights() []Highlight {
	var out []Highlight
	if len(s.Animals) == 0 {
		return out
	}
	top := s.Animals[0]
	if cover, ok := Cover(top.Sightings); ok {
		out = append(out, Highlight{"Most spotted animal", top.Name, Plural(len(top.Sightings), "sighting"), cover})
	}

	var rare sighting.Sighting
	found := false
	for _, a := range s.Animals {
		if len(a.Sightings) == 1 && Photo(a.Sightings[0]) != "" &&
			(!found || Hash(a.Sightings[0].ID.String()) < Hash(rare.ID.String())) {
			rare, found = a.Sightings[0], true
		}
	}
	if found {
		out = append(out, Highlight{"Rarest sighting", AnimalName(rare.Species), "Seen once, in " + Place(rare), rare})
	}

	var hot, cold sighting.Sighting
	haveHot, haveCold := false, false
	for _, sight := range s.Sightings {
		if sight.Weather.ObservedAt.IsZero() || Photo(sight) == "" {
			continue
		}
		t := sight.Weather.Temperature.Actual
		if !haveHot || t > hot.Weather.Temperature.Actual {
			hot, haveHot = sight, true
		}
		if !haveCold || t < cold.Weather.Temperature.Actual {
			cold, haveCold = sight, true
		}
	}
	if haveHot {
		out = append(out, Highlight{"Hottest sighting", fmt.Sprintf("%.0f°C", hot.Weather.Temperature.Actual), AnimalName(hot.Species) + " in " + Place(hot), hot})
	}
	if haveCold {
		out = append(out, Highlight{"Coldest sighting", fmt.Sprintf("%.0f°C", cold.Weather.Temperature.Actual), AnimalName(cold.Species) + " in " + Place(cold), cold})
	}
	return out
}
