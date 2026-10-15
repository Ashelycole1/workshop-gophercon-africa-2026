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

// Builder makes a page from the site, or returns false when what the
// request names doesn't exist.
type Builder func(r *http.Request, site *safari.Site) (templ.Component, bool)

// Page serves a page built from every African sighting.
func Page(logger *slog.Logger, sightings SightingsLister, build Builder) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		site, err := loadSite(ctx, sightings)
		if err != nil {
			logger.ErrorContext(ctx, "handlers: listing sightings: "+err.Error())
			renderError(ctx, w, logger, http.StatusInternalServerError, "The sightings couldn't be loaded. Refresh to try again.")
			return
		}

		page, ok := build(r, site)
		if !ok {
			renderError(ctx, w, logger, http.StatusNotFound, "")
			return
		}

		render(ctx, w, logger, page)
	}
}

// NotFound serves the lost gopher for any URL the site doesn't know.
func NotFound(logger *slog.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		renderError(r.Context(), w, logger, http.StatusNotFound, "")
	}
}

// Redirect sends a request on to the same path with a trailing slash.
func Redirect(to string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, to, http.StatusMovedPermanently)
	}
}

func loadSite(ctx context.Context, sightings SightingsLister) (*safari.Site, error) {
	all, err := sightings.List(ctx, sighting.ListFilter{})
	if err != nil {
		return nil, err
	}
	return safari.Build(all), nil
}

func render(ctx context.Context, w http.ResponseWriter, logger *slog.Logger, page templ.Component) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := page.Render(ctx, w); err != nil {
		logger.ErrorContext(ctx, "handlers: rendering page: "+err.Error())
		renderError(ctx, w, logger, http.StatusInternalServerError, "The page couldn't be drawn. Refresh to try again.")
	}
}

// Sightings lists every African sighting with filters.
func Sightings(r *http.Request, site *safari.Site) (templ.Component, bool) {
	return pages.Sightings(site), true
}
