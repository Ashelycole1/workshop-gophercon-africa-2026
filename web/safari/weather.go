package safari

import (
	"fmt"
	"math"
	"workshop/internal/domain/sighting"
)

// Sky is a sighting's weather boiled down for a chip: an icon name, one word, a
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
		sky.Icon, sky.Word, sky.Kind = "cloud-lightning", "Stormy", "storm"
	case code >= 71 && code <= 79 || code == 85 || code == 86:
		sky.Icon, sky.Word, sky.Kind = "snowflake", "Snowy", "snow"
	case code >= 80:
		sky.Icon, sky.Word, sky.Kind = "cloud-rain", "Showers", "rain"
	case code >= 60:
		sky.Icon, sky.Word, sky.Kind = "cloud-rain", "Rainy", "rain"
	case code >= 50:
		sky.Icon, sky.Word, sky.Kind = "cloud-rain", "Drizzly", "rain"
	case code >= 40:
		sky.Icon, sky.Word, sky.Kind = "cloud-fog", "Foggy", "fog"
	case code == 3 || w.CloudCover > 70:
		sky.Icon, sky.Word, sky.Kind = "cloud", "Cloudy", "cloud"
	case code == 0 && w.CloudCover < 20:
		sky.Icon, sky.Word, sky.Kind = "sun", "Sunny", "sun"
	default:
		sky.Icon, sky.Word, sky.Kind = "cloud-sun", "Fair", "sun"
	}

	t := w.Temperature.Actual
	switch {
	case sky.Kind == "storm":
		sky.Verdict = "Stay in the Land Cruiser"
	case sky.Kind == "rain" || sky.Kind == "snow":
		sky.Verdict = "Bring a poncho"
	case t >= 33:
		sky.Verdict = "Hat, water, shade"
	case t < 12:
		sky.Verdict = "Pack a fleece"
	case w.Wind.Speed > 35:
		sky.Verdict = "Hold on to your hat"
	default:
		sky.Verdict = "Safari-ready"
	}

	sky.Detail = fmt.Sprintf("%[4]s. Felt like %.0[1]f°C, wind %.0[2]f km/h, humidity %[3]d%%",
		w.Temperature.Apparent, w.Wind.Speed, w.Humidity, w.Condition.Description)

	return sky, true
}

// Compass turns a wind direction in degrees into a compass point.
func Compass(deg int) string {
	points := []string{"N", "NE", "E", "SE", "S", "SW", "W", "NW"}
	return points[int(math.Round(float64(deg%360)/45))%8]
}
