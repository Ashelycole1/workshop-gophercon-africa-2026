// Package handler serves the site as a Vercel Go function. vercel.json sends
// every path here, and the site's own mux routes it, as `workshop web` does.
package handler

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"workshop/internal/clients/gbif"
	"workshop/internal/clients/openmeteo"
	"workshop/internal/common/logs"
	"workshop/internal/domain/sighting"
	"workshop/internal/domain/sighting/stores/sightingsqlite"
	"workshop/internal/domain/species"
	"workshop/internal/domain/species/stores/speciessqlite"
	"workshop/internal/domain/weather"
	"workshop/internal/domain/weather/stores/weathersqlite"
	"workshop/internal/infra/config"
	"workshop/internal/infra/db/sqlite"
	"workshop/web"

	db "workshop/internal/infra/db/sqlc"
)

var (
	once    sync.Once
	site    http.Handler
	siteErr error
)

// Handler is the function's entry point.
func Handler(w http.ResponseWriter, r *http.Request) {
	once.Do(func() { site, siteErr = build(context.Background()) })
	if siteErr != nil {
		slog.Error("starting the site: " + siteErr.Error())
		http.Error(w, "The safari is resting. Try again in a moment.", http.StatusServiceUnavailable)
		return
	}
	site.ServeHTTP(w, r)
}

// build opens the committed database read-only, since a function's files
// can't be written, and wires the site the way the web command does.
func build(ctx context.Context) (http.Handler, error) {
	logger := logs.NewLocal(os.Stderr, slog.LevelInfo)

	url := os.Getenv("DB_URI")
	if url == "" {
		url = "file:workshop.db?mode=ro&immutable=1"
	}
	conn, err := sqlite.New(ctx, url)
	if err != nil {
		return nil, err
	}

	queries := db.New(conn)
	speciesSvc := species.NewService(logger, speciessqlite.New(queries))
	weatherSvc := weather.NewService(logger, weathersqlite.New(queries))
	sightings := sighting.NewService(logger,
		sightingsqlite.New(queries),
		speciesSvc,
		weatherSvc,
		gbif.New(gbif.BaseURL),
		openmeteo.New(openmeteo.BaseURL),
	)

	cfg := config.Config{Env: config.Production, DatabaseURL: url}
	return logs.RequestLogger(logger)(web.New(logger, cfg, sightings)), nil
}
