package web

import (
	"embed"
	"io/fs"
	"log/slog"
	"net/http"
	"os"
	"workshop/internal/domain/sighting"
	"workshop/internal/infra/config"
	"workshop/web/handlers"
)

//go:generate go tool templ generate ./...

// assets holds the static files served under /assets.
// Note: The embedded paths keep their "assets/" prefix.
//
//go:embed assets
var assets embed.FS

// New returns a ServeMux serving the static assets and handler's patterns.
func New(logger *slog.Logger, config config.Config, sightingsSvc *sighting.Service) *http.ServeMux {
	mux := http.NewServeMux()
	page := func(build handlers.Builder) http.HandlerFunc {
		return handlers.Page(logger, sightingsSvc, build)
	}

	mux.Handle("GET /assets/", http.FileServerFS(assetsFs(config.IsProduction())))
	mux.Handle("GET /{$}", handlers.Home(logger, sightingsSvc))

	section(mux, "/map/", page(handlers.Map))
	section(mux, "/sightings/", page(handlers.Sightings))
	section(mux, "/stats/", page(handlers.Stats))
	section(mux, "/gallery/", page(handlers.Gallery))
	section(mux, "/migrations/", page(handlers.Migrations))
	mux.Handle("GET /sightings/{id}", page(handlers.Sighting))
	section(mux, "/animals/", page(handlers.Animals))
	mux.Handle("GET /animals/{slug}", page(handlers.Animal))
	section(mux, "/countries/", page(handlers.Countries))
	mux.Handle("GET /countries/{slug}", page(handlers.Country))

	mux.Handle("GET /", handlers.NotFound(logger))

	return mux
}

// section serves an index page at path, and redirects the path without its
// trailing slash there.
func section(mux *http.ServeMux, path string, h http.Handler) {
	mux.Handle("GET "+path+"{$}", h)
	mux.Handle("GET "+path[:len(path)-1], handlers.Redirect(path))
}

func assetsFs(prod bool) fs.FS {
	if prod {
		return assets
	}
	return os.DirFS("web")
}
