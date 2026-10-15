package safari

import (
	"fmt"
	"math/rand/v2"
	"slices"
	"strings"
	"time"
	"workshop/internal/domain/sighting"
)

// Spot is an animal peeking out of the landing page's grass.
type Spot struct {
	Sighting sighting.Sighting
	Left     string
	Back     bool
}

// Spots spreads the sightings across the grass, alternating back and front
// rows, jittered by a hash of each id so the layout is the same every visit.
func Spots(sightings []sighting.Sighting) []Spot {
	n := len(sightings)
	spots := make([]Spot, n)
	order := slices.Clone(sightings)
	slices.SortFunc(order, func(a, b sighting.Sighting) int {
		return int(Hash(a.ID.String())%1000) - int(Hash(b.ID.String())%1000)
	})
	for i, s := range order {
		jitter := float64(Hash(s.ID.String())%600)/100 - 3
		left := 6 + (float64(i)+.5)/float64(n)*84 + jitter
		spots[i] = Spot{Sighting: s, Left: fmt.Sprintf("%.1f%%", left), Back: i%2 == 1}
	}
	return spots
}

// Grass draws clumps of grass blades as SVG paths across a 1200 by height
// box, the blades leaning by seeded random amounts.
func Grass(seed uint64, clumps, blades int, height float64) []string {
	r := rand.New(rand.NewPCG(seed, seed*7919))
	width := 1200.0 / float64(clumps)
	out := make([]string, clumps)
	for c := range clumps {
		var b strings.Builder
		for range blades {
			x := float64(c)*width + r.Float64()*width
			h := height*.35 + r.Float64()*height*.65
			lean := (r.Float64() - .5) * 46
			w := 5 + r.Float64()*7
			fmt.Fprintf(&b, "M%.1f %.1fQ%.1f %.1f %.1f %.1fL%.1f %.1fZ",
				x, height, x+lean*.3, height-h*.6, x+lean, height-h, x+w, height)
		}
		out[c] = b.String()
	}
	return out
}

// BestSpot picks one sighting for today, the same all day for everyone.
func BestSpot(sightings []sighting.Sighting, now time.Time) (sighting.Sighting, bool) {
	var withPhoto []sighting.Sighting
	for _, s := range sightings {
		if Photo(s) != "" {
			withPhoto = append(withPhoto, s)
		}
	}
	if len(withPhoto) == 0 {
		return sighting.Sighting{}, false
	}
	return withPhoto[(now.YearDay()*31+now.Year())%len(withPhoto)], true
}
