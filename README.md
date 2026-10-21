# MERN Testing Lab

A MERN notes application for practicing automated testing in a test suite course.
Based on [Coding in Flow's MERN course](https://github.com/codinginflow/MERN-course)
and its [video tutorial](https://www.youtube.com/watch?v=FcxjCPeicvU).

Runs the React development server, Express API, and MongoDB in separate Linux
containers. Source edits reload automatically, including on Windows.

## Requirements

- Docker Desktop running with Linux containers and Docker Compose available.
- Free host ports 3000 and 5000 (stop locally running frontend/backend servers).
- A `backend/.env` file. If missing, create it in PowerShell:

  ```powershell
  Copy-Item backend/.env.example backend/.env
  ```

Set `SESSION_SECRET` in that file to a long random value. Existing values can be
kept. Compose overrides `PORT` and `MONGO_CONNECTION_STRING` for the container,
so your local database configuration does not need to change. Environment files
are excluded from image builds. The frontend container does not need an `.env`.

## Start

From the repository root:

```powershell
docker compose up --build
```

Open http://localhost:3000. The API is available at http://localhost:5000/api.
The frontend forwards `/api` requests to `backend:5000` inside Docker, preserving
cookie-based login on the frontend origin. The local frontend package proxy
still points to `localhost:5000` when running outside Docker.

MongoDB starts with a separate, empty database; existing local data is not
imported. Application data and sessions persist in the `mongo_data` volume.
MongoDB is reachable by containers at `mongo:27017` and is not published to the
host. To open its shell:

```powershell
docker compose exec mongo mongosh mern-course
```

## Daily commands

```powershell
docker compose up -d
docker compose logs -f
docker compose ps
docker compose down
```

`down` stops and removes containers while keeping database data. To deliberately
delete the Docker database as well, use `docker compose down --volumes`.

Source and TypeScript configuration are mounted from your working folder.
Dependencies stay in the Linux images, separate from Windows `node_modules`.
After changing either app's package files or other files outside the mounted
folders, run `docker compose up --build` again. After changing backend `.env`,
run `docker compose up -d --force-recreate backend`.

This configuration is for local development. Startup waits for MongoDB and the
API to become healthy before starting their dependent services.

If PowerShell recognizes Docker but an IDE terminal does not, restart the IDE
so it picks up the updated PATH. Check `docker version` and
`docker compose version`; the Docker engine must be running as well as the CLI
being installed.
