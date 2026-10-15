// Package safari shapes the stored sightings into what the Karibu Safari
// pages show: African sightings only, grouped by animal and by country.
package safari

import (
	"cmp"
	"hash/fnv"
	"slices"
	"strings"
	"unicode"
	"workshop/internal/domain/sighting"
	"workshop/internal/domain/species"
)

type (
	// Site is every African sighting, with the animal and country indexes
	// built from them once per request.
	Site struct {
		Sightings []sighting.Sighting
		Animals   []Animal
		Countries []Country
		byID      map[string]int
	}
	// Animal is one species and every sighting of it.
	Animal struct {
		Slug       string
		Name       string
		Scientific string
		Emoji      string
		Fact       string
		Sightings  []sighting.Sighting
	}
	// Country is one African country and every sighting in it.
	Country struct {
		Slug      string
		Name      string
		Code      string
		Sightings []sighting.Sighting
	}
)

// Build keeps the African sightings, newest first, and indexes them.
func Build(all []sighting.Sighting) *Site {
	site := &Site{byID: make(map[string]int)}
	for _, s := range all {
		if InAfrica(s) {
			site.Sightings = append(site.Sightings, s)
		}
	}
	slices.SortStableFunc(site.Sightings, func(a, b sighting.Sighting) int {
		return b.HappenedAt.Compare(a.HappenedAt)
	})

	animals := make(map[string]*Animal)
	countries := make(map[string]*Country)
	for i, s := range site.Sightings {
		site.byID[s.ID.String()] = i

		name := AnimalName(s.Species)
		a, ok := animals[name]
		if !ok {
			a = &Animal{
				Slug:       Slug(name),
				Name:       name,
				Scientific: s.Species.ScientificName,
				Emoji:      Emoji(name),
				Fact:       Fact(name),
			}
			animals[name] = a
		}
		a.Sightings = append(a.Sightings, s)

		code := s.Location.CountryCode.String()
		c, ok := countries[code]
		if !ok {
			c = &Country{Slug: Slug(CountryName(s)), Name: CountryName(s), Code: code}
			countries[code] = c
		}
		c.Sightings = append(c.Sightings, s)
	}

	for _, a := range animals {
		site.Animals = append(site.Animals, *a)
	}
	slices.SortFunc(site.Animals, func(a, b Animal) int {
		return cmp.Or(cmp.Compare(len(b.Sightings), len(a.Sightings)), cmp.Compare(a.Name, b.Name))
	})
	for _, c := range countries {
		site.Countries = append(site.Countries, *c)
	}
	slices.SortFunc(site.Countries, func(a, b Country) int {
		return cmp.Or(cmp.Compare(len(b.Sightings), len(a.Sightings)), cmp.Compare(a.Name, b.Name))
	})

	return site
}

// Find returns the sighting with the id and its position, newest first.
func (s *Site) Find(id string) (sighting.Sighting, int, bool) {
	i, ok := s.byID[id]
	if !ok {
		return sighting.Sighting{}, 0, false
	}
	return s.Sightings[i], i, true
}

// Animal returns the animal with the slug.
func (s *Site) Animal(slug string) (Animal, bool) {
	for _, a := range s.Animals {
		if a.Slug == slug {
			return a, true
		}
	}
	return Animal{}, false
}

// AnimalOf returns the animal a sighting is of.
func (s *Site) AnimalOf(sight sighting.Sighting) Animal {
	a, _ := s.Animal(Slug(AnimalName(sight.Species)))
	return a
}

// Country returns the country with the slug.
func (s *Site) Country(slug string) (Country, bool) {
	for _, c := range s.Countries {
		if c.Slug == slug {
			return c, true
		}
	}
	return Country{}, false
}

// CountryOf returns the country a sighting was made in.
func (s *Site) CountryOf(sight sighting.Sighting) Country {
	c, _ := s.Country(Slug(CountryName(sight)))
	return c
}

// Related returns up to n other sightings of the same animal, then from the
// same country, never the sighting itself.
func (s *Site) Related(sight sighting.Sighting, n int) []sighting.Sighting {
	var out []sighting.Sighting
	seen := map[string]bool{sight.ID.String(): true}
	add := func(list []sighting.Sighting) {
		for _, r := range list {
			if len(out) == n {
				return
			}
			if !seen[r.ID.String()] {
				seen[r.ID.String()] = true
				out = append(out, r)
			}
		}
	}
	add(s.AnimalOf(sight).Sightings)
	add(s.CountryOf(sight).Sightings)
	return out
}

// Pick returns n sightings with photos, one per animal where it can, chosen
// by a stable hash so the same animals greet every visitor.
func (s *Site) Pick(n int) []sighting.Sighting {
	var out []sighting.Sighting
	for _, a := range s.Animals {
		if len(out) == n {
			break
		}
		best := -1
		for i, sight := range a.Sightings {
			if Photo(sight) == "" {
				continue
			}
			if best < 0 || Hash(sight.ID.String()) < Hash(a.Sightings[best].ID.String()) {
				best = i
			}
		}
		if best >= 0 {
			out = append(out, a.Sightings[best])
		}
	}
	return out
}

// Recorders tallies the people who made the sightings.
func (s *Site) Recorders() []sighting.Tally {
	return sighting.Top(sighting.CountBy(s.Sightings, func(sight sighting.Sighting) string {
		return sight.RecordedBy
	}), 0)
}

// AnimalName is the species' common name in title case, falling back to its
// scientific name.
func AnimalName(sp species.Species) string {
	name := cmp.Or(sp.VernacularName, sp.CanonicalName, sp.ScientificName, "Unknown animal")
	if strings.EqualFold(name, "hippo") {
		name = "hippopotamus"
	}
	return Title(name)
}

// Title upper-cases the first letter of every word.
func Title(s string) string {
	words := strings.Fields(s)
	for i, w := range words {
		r := []rune(w)
		r[0] = unicode.ToUpper(r[0])
		words[i] = string(r)
	}
	return strings.Join(words, " ")
}

// Slug turns a name into a URL path segment.
func Slug(s string) string {
	var b strings.Builder
	dash := false
	for _, r := range strings.ToLower(s) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			dash = false
		case r == '\'':
		default:
			if !dash && b.Len() > 0 {
				b.WriteByte('-')
				dash = true
			}
		}
	}
	return strings.TrimSuffix(b.String(), "-")
}

// Hash is a stable number for a string, used to place things the same way on
// every render.
func Hash(s string) uint32 {
	h := fnv.New32a()
	_, _ = h.Write([]byte(s))
	return h.Sum32()
}
