package handlers

import (
	"context"
	"log/slog"
	"net/http"
	"workshop/internal/domain/sighting"
	"workshop/web/safari"
	"workshop/web/views/pages"

	"github.com/a-h/templ"
)

type SightingsLister interface {
	List(ctx context.Context, filter sighting.ListFilter) ([]sighting.Sighting, error)
}

// Home serves the savanna landing page.
func Home(logger *slog.Logger, sightings SightingsLister) http.HandlerFunc {
	return Page(logger, sightings, func(r *http.Request, site *safari.Site) (templ.Component, bool) {
		return pages.Sightings(site), true
	})
}
