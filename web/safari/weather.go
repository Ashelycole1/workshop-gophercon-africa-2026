package safari

import (
	"fmt"
	"math"
	"workshop/internal/domain/sighting"
)

// Sky is a sighting's weather boiled down for a chip: an icon, one word, a
// temperature and whether it was a good day to be out.
type Sky struct {
	Icon    string
	Word    string
	Temp    string
	Kind    string
	Verdict string
	Detail  string
}

// Weather returns the sky for a sighting, and false if none was recorded.
func Weather(s sighting.Sighting) (Sky, bool) {
	w := s.Weather
	if w.ObservedAt.IsZero() {
		return Sky{}, false
	}

	sky := Sky{Temp: fmt.Sprintf("%.0f°C", w.Temperature.Actual)}
	code := w.Condition.Code
	switch {
	case code >= 95:
		sky.Icon, sky.Word, sky.Kind = "⛈️", "Stormy", "storm"
	case code >= 71 && code <= 79 || code == 85 || code == 86:
		sky.Icon, sky.Word, sky.Kind = "🌨️", "Snowy", "snow"
	case code >= 80:
		sky.Icon, sky.Word, sky.Kind = "🌦️", "Showers", "rain"
	case code >= 60:
		sky.Icon, sky.Word, sky.Kind = "🌧️", "Rainy", "rain"
	case code >= 50:
		sky.Icon, sky.Word, sky.Kind = "🌦️", "Drizzly", "rain"
	case code >= 40:
		sky.Icon, sky.Word, sky.Kind = "🌫️", "Foggy", "fog"
	case code == 3 || w.CloudCover > 70:
		sky.Icon, sky.Word, sky.Kind = "⛅", "Cloudy", "cloud"
	case code == 0 && w.CloudCover < 20:
		sky.Icon, sky.Word, sky.Kind = "☀️", "Sunny", "sun"
	default:
		sky.Icon, sky.Word, sky.Kind = "🌤️", "Fair", "sun"
	}

	t := w.Temperature.Actual
	switch {
	case sky.Kind == "storm":
		sky.Verdict = "Stay in the Land Cruiser ⚡"
	case sky.Kind == "rain" || sky.Kind == "snow":
		sky.Verdict = "Bring a poncho 🧥"
	case t >= 33:
		sky.Verdict = "Hat, water, shade 🧢"
	case t < 12:
		sky.Verdict = "Pack a fleece 🧣"
	case w.Wind.Speed > 35:
		sky.Verdict = "Hold on to your hat 💨"
	default:
		sky.Verdict = "Safari-ready ✓"
	}

	sky.Detail = fmt.Sprintf("Felt like %.0f°C · wind %.0f km/h · humidity %d%% · %s",
		w.Temperature.Apparent, w.Wind.Speed, w.Humidity, w.Condition.Description)

	return sky, true
}

// Compass turns a wind direction in degrees into a compass point.
func Compass(deg int) string {
	points := []string{"N", "NE", "E", "SE", "S", "SW", "W", "NW"}
	return points[int(math.Round(float64(deg%360)/45))%8]
}
