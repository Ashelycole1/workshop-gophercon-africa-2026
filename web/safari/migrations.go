package safari

import (
	"fmt"
	"math"
	"strings"
	"workshop/internal/domain/sighting"
)

type (
	// Route is an illustrative migration: where the herd is each month and
	// what it's doing there. It isn't tracking data.
	Route struct {
		Slug    string
		Name    string
		Animal  string
		Summary string
		Animals []string
		Loop    bool
		Months  [12]Stop
	}
	// Stop is where a route's herd is in one month.
	Stop struct {
		Lat, Lng float64
		Place    string
		Caption  string
	}
)

// MonthNames are the slider's labels.
var MonthNames = [12]string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}

// Routes are the migrations page's three illustrative journeys.
var Routes = []Route{
	{
		Slug: "wildebeest", Name: "The Great Migration", Animal: "Blue wildebeest",
		Summary: "Over a million wildebeest, with zebra and gazelle, loop between Tanzania's Serengeti and Kenya's Masai Mara, chasing the rain.",
		Animals: []string{"blue-wildebeest", "black-wildebeest", "plains-zebra"},
		Loop:    true,
		Months: [12]Stop{
			{-3.05, 34.95, "Ndutu, southern Serengeti", "Calving season on the short-grass plains. Thousands of calves are born every day."},
			{-3.15, 35.15, "Southern Serengeti", "The calves find their legs fast. Lions, cheetahs and hyenas follow the herds."},
			{-2.9, 34.75, "Southern Serengeti", "The plains begin to dry and the herds grow restless."},
			{-2.55, 34.5, "Central Serengeti", "The long rains arrive and the columns drift north-west."},
			{-2.3, 34.15, "Western Corridor", "The rut: bulls clash as the herds stream west."},
			{-2.05, 34.0, "Grumeti River", "The first river crossings, with Grumeti's giant crocodiles waiting."},
			{-1.75, 34.75, "Northern Serengeti", "North to the Kenyan border. The first Mara River crossings begin."},
			{-1.45, 35.0, "Mara River", "Peak crossings: the most dramatic weeks of the year on the Mara River."},
			{-1.35, 35.25, "Masai Mara", "Grazing the long grass of the Masai Mara."},
			{-1.6, 35.35, "Masai Mara", "The short rains build in the south, and the herds turn for home."},
			{-2.2, 35.2, "Lobo, eastern Serengeti", "Back south through Lobo's granite kopjes."},
			{-2.8, 35.15, "Southern Serengeti", "Home to the southern plains, ready to calve again."},
		},
	},
	{
		Slug: "elephant", Name: "The Elephant Corridor", Animal: "African elephant",
		Summary: "Africa's largest elephant population moves between Zimbabwe's Hwange and Botswana's Chobe River across the Kavango–Zambezi conservation area.",
		Animals: []string{"african-elephant"},
		Loop:    true,
		Months: [12]Stop{
			{-18.65, 26.9, "Hwange, Zimbabwe", "Rains fill the pans, and herds spread out across Hwange."},
			{-19.0, 25.9, "Kalahari woodland", "Wet-season browsing on fresh leaves far from any river."},
			{-19.3, 24.5, "Northern Botswana", "Deep in the mopane, where calves are born in the green season."},
			{-19.45, 23.3, "Okavango Delta", "The Okavango flood arrives, months after falling as rain in Angola."},
			{-19.2, 22.75, "Moremi", "Wading between the Delta's islands."},
			{-18.65, 23.45, "Linyanti", "The pans dry up and herds begin moving north."},
			{-18.25, 24.2, "Savuti", "Savuti's channel draws herds toward permanent water."},
			{-17.95, 24.85, "Chobe", "Converging on the Chobe River."},
			{-17.8, 25.15, "Chobe Riverfront", "Thousands of elephants come down to drink, swim and play."},
			{-17.85, 25.45, "Chobe Riverfront", "October is the hottest month. The river is everything."},
			{-18.1, 25.95, "Kasane", "The first storms break, and herds edge away from the river."},
			{-18.4, 26.5, "Towards Hwange", "Heading back to Hwange's fresh pans."},
		},
	},
	{
		Slug: "flamingo", Name: "The Rift Valley Lake Hop", Animal: "Lesser flamingo",
		Summary: "Flamingos hop between the Rift Valley's soda lakes as the water rises and falls, and breed on the caustic flats of Lake Natron.",
		Animals: []string{"greater-flamingo"},
		Loop:    true,
		Months: [12]Stop{
			{0.25, 36.1, "Lake Bogoria", "Pink shorelines at Lake Bogoria's hot springs."},
			{-0.36, 36.08, "Lake Nakuru", "Flocks feed on the blue-green algae that turn them pink."},
			{-0.45, 36.26, "Lake Elmenteita", "A shallow lake, perfect for filter-feeding."},
			{-0.8, 36.38, "Lake Naivasha", "The rains dilute the lakes, so the flocks keep moving south."},
			{-1.9, 36.27, "Lake Magadi", "Resting on Magadi's crusted soda."},
			{-2.4, 36.05, "Lake Natron", "Arriving at Lake Natron, where most of East Africa's flamingos breed."},
			{-2.3, 35.97, "Lake Natron", "Courtship marches: hundreds of birds parade in tight formation."},
			{-2.22, 35.92, "Lake Natron", "Mud nests on the soda flats, where few predators dare to walk."},
			{-2.35, 36.02, "Lake Natron", "The chicks hatch, grey and fluffy."},
			{-1.95, 36.24, "Lake Magadi", "Young birds take their first long flights north."},
			{-0.47, 36.24, "Lake Elmenteita", "Back up the valley as the short rains begin."},
			{0.2, 36.12, "Lake Bogoria", "Home to Bogoria for the end of the year."},
		},
	},
}

// Points are a route's monthly stops in map space, for the script.
func (r Route) Points() string {
	var b strings.Builder
	for i, s := range r.Months {
		x, y := Project(s.Lat, s.Lng)
		if i > 0 {
			b.WriteByte(' ')
		}
		fmt.Fprintf(&b, "%.2f,%.2f", x, y)
	}
	return b.String()
}

// D draws a smooth trail through the monthly stops, closed for a loop.
func (r Route) D() string {
	pts := make([][2]float64, 12)
	for i, s := range r.Months {
		x, y := Project(s.Lat, s.Lng)
		pts[i] = [2]float64{x, y}
	}
	at := func(i int) [2]float64 { return pts[((i%12)+12)%12] }
	var b strings.Builder
	fmt.Fprintf(&b, "M%.2f %.2f", pts[0][0], pts[0][1])
	end := 11
	if r.Loop {
		end = 12
	}
	// Catmull-Rom through the stops, written as cubic Béziers.
	for i := range end {
		p0, p1, p2, p3 := at(i-1), at(i), at(i+1), at(i+2)
		c1 := [2]float64{p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6}
		c2 := [2]float64{p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6}
		fmt.Fprintf(&b, "C%.2f %.2f %.2f %.2f %.2f %.2f", c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
	}
	return b.String()
}

// ViewBox frames the route with room around it, never narrower than a
// small country so the borders still read.
func (r Route) ViewBox() string {
	minX, minY, maxX, maxY := math.Inf(1), math.Inf(1), math.Inf(-1), math.Inf(-1)
	for _, s := range r.Months {
		x, y := Project(s.Lat, s.Lng)
		minX, minY = math.Min(minX, x), math.Min(minY, y)
		maxX, maxY = math.Max(maxX, x), math.Max(maxY, y)
	}
	size := math.Max(math.Max(maxX-minX, maxY-minY)*2.2, 70)
	cx, cy := (minX+maxX)/2, (minY+maxY)/2
	return fmt.Sprintf("%.1f %.1f %.1f %.1f", cx-size/2, cy-size/2, size, size)
}

// Scale is how large the route's markers should be, in its own viewBox.
func (r Route) Scale() float64 {
	var w float64
	_, _ = fmt.Sscanf(r.ViewBox(), "%f %f %f", new(float64), new(float64), &w)
	return w / 100
}

// Sightings are the real sightings of a route's animals.
func (r Route) Sightings(site *Site) []sighting.Sighting {
	var out []sighting.Sighting
	for _, slug := range r.Animals {
		if a, ok := site.Animal(slug); ok {
			out = append(out, a.Sightings...)
		}
	}
	return out
}
