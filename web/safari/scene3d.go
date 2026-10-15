package safari

import (
	"maps"
	"slices"
)

type (
	// Scene is what the 3D map of Africa is built from: every country's
	// outline with how many sightings it has, and a pin per sighting.
	Scene struct {
		Countries []SceneCountry `json:"countries"`
		Pins      []ScenePin     `json:"pins"`
		Max       int            `json:"max"`
	}
	// SceneCountry is a country's outline in map space and its sightings.
	SceneCountry struct {
		Code  string `json:"code"`
		Name  string `json:"name"`
		URL   string `json:"url,omitzero"`
		Count int    `json:"count"`
		Path  string `json:"path"`
	}
	// ScenePin is one sighting, placed in map space.
	ScenePin struct {
		URL     string  `json:"url"`
		Animal  string  `json:"animal"`
		Place   string  `json:"place"`
		Spotter string  `json:"spotter"`
		Date    string  `json:"date"`
		Photo   string  `json:"photo,omitzero"`
		Country string  `json:"country"`
		X       float64 `json:"x"`
		Y       float64 `json:"y"`
	}
)

// Scene3D gathers the 3D map's data from the site.
func (s *Site) Scene3D() Scene {
	counts := make(map[string]Country)
	for _, c := range s.Countries {
		counts[c.Code] = c
	}

	var scene Scene
	for _, code := range slices.Sorted(maps.Keys(countryPaths)) {
		c := counts[code]
		sc := SceneCountry{Code: code, Name: africa[code], Count: len(c.Sightings), Path: countryPaths[code]}
		if sc.Count > 0 {
			sc.URL = "/countries/" + c.Slug
		}
		scene.Max = max(scene.Max, sc.Count)
		scene.Countries = append(scene.Countries, sc)
	}

	for _, sight := range s.Sightings {
		x, y := Project(sight.Location.Latitude, sight.Location.Longitude)
		scene.Pins = append(scene.Pins, ScenePin{
			URL:     SightingURL(sight),
			Animal:  AnimalName(sight.Species),
			Place:   FullPlace(sight),
			Spotter: Spotter(sight),
			Date:    Date(sight),
			Photo:   Sized(Photo(sight), "small"),
			Country: sight.Location.CountryCode.String(),
			X:       x,
			Y:       y,
		})
	}

	return scene
}
