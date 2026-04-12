# Deployment Report

This report documents the current production deployment setup for PartnerSync.

## 1. Live Deployment URLs

- Frontend: https://partner-sync-chi.vercel.app/
- Backend: https://partnersync-backend-c9aj.onrender.com

## 2. Deployment Topology

- Frontend is deployed on Vercel.
- Backend API is deployed on Render.
- Database is MongoDB Atlas.
- Frontend and backend communicate via HTTPS.

## 3. Platform Configuration

## 3.1 Backend (Render)

Service type:
- Web service (Node.js)

Repository subdirectory:
- backend

Commands:
- Build: npm install
- Start: npm start

Required environment variables:

```env
PORT=5000
MONGO_URI=<mongodb_atlas_connection_string>
JWT_SECRET=<strong_random_secret>
NODE_ENV=production
```

Health endpoints:
- https://partnersync-backend-c9aj.onrender.com/
- https://partnersync-backend-c9aj.onrender.com/api-docs

## 3.2 Frontend (Vercel)

Project root:
- frontend

Build/output:
- Build command: npm run build
- Output directory: build

Recommended environment variable:

```env
REACT_APP_API_BASE_URL=https://partnersync-backend-c9aj.onrender.com
```

## 4. Production Validation

## 4.1 API Reachability

- Root endpoint responds successfully.
- Swagger UI endpoint is reachable.

## 4.2 Application Reachability

- Frontend home page loads successfully.
- Navigation routes render.
- Auth screens are accessible.

## 4.3 Functional Smoke Tests

1. Register user.
2. Login user.
3. Call public project and report endpoints.
4. Perform one protected write operation with JWT.
5. Verify collaboration feed access.

## 5. Known Deployment Considerations

- Several frontend files currently call hardcoded localhost endpoints.
- For reliable production operation, all API calls should use an environment-driven base URL.
- If backend responds slowly after inactivity on free tiers, first request latency may increase (cold start behavior).

## 6. Security and Operations Notes

- Keep .env files and connection strings out of source control.
- Rotate JWT secret and database credentials if exposed.
- Restrict MongoDB Atlas network and user permissions where possible.
- Enable platform logging and monitor 4xx/5xx response trends.

## 7. Rollback Guidance

- Frontend rollback: redeploy previous successful Vercel build.
- Backend rollback: redeploy previous successful Render service revision.
- Validate rollback by re-running smoke tests in Section 4.
