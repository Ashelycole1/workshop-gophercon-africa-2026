FROM golang:1.27-alpine AS build
WORKDIR /src

# Modules come from vendor/, so there's nothing to download first.
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/workshop .

# Migrate the committed database, or create an empty one if nothing was
# committed, since the web command refuses to start with pending migrations.
RUN /out/workshop --db file:/src/workshop.db db migrate up

FROM gcr.io/distroless/static-debian12
WORKDIR /app

COPY --from=build /out/workshop /app/workshop
COPY --from=build /src/workshop.db /app/workshop.db

ENV PORT=8080 \
	APP_ENV=production \
	DB_URI=file:/app/workshop.db

EXPOSE 8080
ENTRYPOINT ["/app/workshop", "web"]
