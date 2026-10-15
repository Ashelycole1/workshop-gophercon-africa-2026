package pages

import (
	"strconv"
	"time"
	"workshop/web/safari"
)

// thisMonth is today's month, counted from 0 for January.
func thisMonth() int {
	return int(time.Now().Month()) - 1
}

// scaled sizes a marker for the route's own zoom.
func scaled(r safari.Route, v float64) string {
	return strconv.FormatFloat(v*r.Scale(), 'f', 2, 64)
}

// stopX and stopY place a monthly stop on the map.
func stopX(s safari.Stop) string {
	x, _ := safari.Project(s.Lat, s.Lng)
	return strconv.FormatFloat(x, 'f', 2, 64)
}

func stopY(s safari.Stop) string {
	_, y := safari.Project(s.Lat, s.Lng)
	return strconv.FormatFloat(y, 'f', 2, 64)
}

// routeAnimal links to the first of a route's animals that has been seen.
func routeAnimal(site *safari.Site, r safari.Route) string {
	for _, slug := range r.Animals {
		if _, ok := site.Animal(slug); ok {
			return "/animals/" + slug
		}
	}
	return "/animals/"
}
