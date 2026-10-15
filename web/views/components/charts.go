package components

import (
	"fmt"
	"workshop/web/safari"
)

// colW is the width of one year's slot in the 600-wide column chart.
func colW(cols []safari.Column) string {
	return fmt.Sprintf("%.1f", 600/float64(max(len(cols), 1)))
}

// colX is where a year's slot starts.
func colX(cols []safari.Column, c safari.Column) string {
	for i, x := range cols {
		if x.Year == c.Year {
			return fmt.Sprintf("%.1f", float64(i)*600/float64(len(cols)))
		}
	}
	return "0"
}
