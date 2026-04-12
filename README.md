# PartnerSync

PartnerSync is a MERN-based collaboration platform for NGOs, government institutions, and partners working on SDG-aligned initiatives. It includes user onboarding and role approval, SDG target management (Goal 17), project registry and analytics, progress reports, and a collaboration hub.

This documentation covers:
- Setup instructions (backend + frontend)
- Complete API endpoint documentation
- Authentication and authorization requirements
- Request and response formats with examples
- Deployment report and production URLs

## 1. Tech Stack

- Frontend: React (Create React App), Axios, React Router
- Backend: Node.js, Express, Mongoose, JWT auth, Swagger UI
- Database: MongoDB Atlas (or local MongoDB)
- Testing: Jest, Supertest, mongodb-memory-server
- Performance testing: Artillery

## 2. Project Structure

```text
PartnerSync/
	backend/
		controllers/
		middleware/
		models/
		routes/
		tests/
		config/
		server.js
	frontend/
		src/
		public/
```

## 3. Setup Instructions

### 3.1 Prerequisites

- Node.js 18+ recommended
- npm 9+ recommended
- MongoDB connection string (Atlas or local)

### 3.2 Clone and Install

From the workspace root:

```bash
cd PartnerSync

cd backend
npm install

cd ../frontend
npm install
```

### 3.3 Environment Configuration

Create or update backend environment variables in backend/.env:

```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_secure_jwt_secret>
NODE_ENV=development
```

Notes:
- The backend will fail at startup if MONGO_URI is missing.
- If JWT_SECRET is not set, code falls back to a default value. For security, always set your own JWT_SECRET.

### 3.4 Run the Backend

```bash
cd backend
npm run dev
```

Backend default URL:
- http://localhost:5000

Swagger/OpenAPI docs:
- http://localhost:5000/api-docs

### 3.5 Run the Frontend

In a separate terminal:

```bash
cd frontend
npm start
```

Frontend default URL:
- http://localhost:3000

### 3.6 Quick Smoke Check

1. Open http://localhost:5000 and confirm API status message.
2. Open http://localhost:5000/api-docs and confirm endpoint list.
3. Open frontend and register/login.

## 4. Authentication and Authorization

### 4.1 Auth Model

- Login/register returns JWT token.
- Protected endpoints require header:

```http
Authorization: Bearer <token>
```

### 4.2 Roles Used

- public
- partner
- government
- admin

### 4.3 Authorization Rules (high-level)

- Admin-only:
	- PUT /api/auth/approve/:id
	- GET /api/auth/users
	- DELETE /api/auth/users/:id
	- DELETE /api/projects/:id
- Admin, partner, government:
	- POST /api/projects
	- PUT /api/projects/:id
	- POST /api/reports
- Protected (authenticated user):
	- PUT /api/reports/:id (owner or admin)
	- DELETE /api/reports/:id (owner or admin)

- Collaboration routes note:
	- Current route configuration does not apply auth middleware at route level for `/api/collab/*`.
	- Some collaboration actions still perform controller-level user/role checks and may fail without user context.

## 5. API Endpoint Documentation

Base URL (local):

```text
http://localhost:5000
```

## 5.1 Health

### GET /

- Auth: Public
- Purpose: API health/status message

Example request:

```bash
curl http://localhost:5000/
```

Example response:

```json
"PartnerSync API is running... OpenAPI docs: /api-docs"
```

## 5.2 Authentication Endpoints

### POST /api/auth/register

- Auth: Public
- Purpose: Register a user with requested role (user starts as public until approval)

Request body:

```json
{
	"name": "Jane Doe",
	"email": "jane@example.com",
	"password": "password123",
	"organization": "NGO Lanka",
	"role": "partner"
}
```

Success response (201):

```json
{
	"success": true,
	"token": "<jwt_token>",
	"user": {
		"id": "<user_id>",
		"name": "Jane Doe",
		"email": "jane@example.com",
		"role": "public"
	}
}
```

### POST /api/auth/login

- Auth: Public
- Purpose: Login existing user

Request body:

```json
{
	"email": "jane@example.com",
	"password": "password123"
}
```

Success response (200):

```json
{
	"success": true,
	"token": "<jwt_token>",
	"user": {
		"id": "<user_id>",
		"name": "Jane Doe",
		"email": "jane@example.com",
		"role": "partner"
	}
}
```

### PUT /api/auth/approve/:id

- Auth: Bearer token required
- Role: admin
- Purpose: Verify user and promote to requested role

Example request:

```bash
curl -X PUT http://localhost:5000/api/auth/approve/<user_id> \
	-H "Authorization: Bearer <admin_token>"
```

Success response (200):

```json
{
	"success": true,
	"data": {
		"_id": "<user_id>",
		"name": "Jane Doe",
		"role": "partner",
		"isVerified": true
	},
	"message": "User verified! Role updated to partner"
}
```

### GET /api/auth/users

- Auth: Bearer token required
- Role: admin
- Purpose: Retrieve all users

Success response (200):

```json
{
	"success": true,
	"count": 2,
	"data": [
		{
			"_id": "<user_id>",
			"name": "Jane Doe",
			"email": "jane@example.com",
			"organization": "NGO Lanka",
			"role": "public",
			"requestedRole": "partner"
		}
	]
}
```

### DELETE /api/auth/users/:id

- Auth: Bearer token required
- Role: admin
- Purpose: Delete user

Success response (200):

```json
{
	"success": true,
	"message": "User removed from system"
}
```

## 5.3 SDG Endpoints

### POST /api/sdg/create

- Auth: Public (current implementation)
- Purpose: Create SDG target

Request body:

```json
{
	"targetNumber": "17.1",
	"title": "Strengthen domestic resource mobilization",
	"description": "Support domestic resource mobilization in developing countries",
	"indicatorCode": "17.1.1",
	"benchmark": "Increase tax-to-GDP ratio"
}
```

Success response (201):

```json
{
	"success": true,
	"message": "SDG target created successfully",
	"data": {
		"_id": "<sdg_id>",
		"targetNumber": "17.1",
		"category": "Goal 17"
	}
}
```

### GET /api/sdg/all

- Auth: Public
- Purpose: List Goal 17 SDG targets

Success response (200):

```json
{
	"success": true,
	"count": 5,
	"data": [
		{
			"_id": "<sdg_id>",
			"targetNumber": "17.1",
			"title": "...",
			"description": "...",
			"isOfficialUN": true
		}
	]
}
```

### GET /api/sdg/:id

- Auth: Public
- Purpose: Fetch one SDG target by ID

### PUT /api/sdg/update/:id

- Auth: Public (current implementation)
- Purpose: Update SDG target fields (title, description, benchmark)

### DELETE /api/sdg/delete/:id

- Auth: Public (current implementation)
- Purpose: Delete SDG target

### POST /api/sdg/sync-un

- Auth: Public (current implementation)
- Purpose: Sync SDG targets from UN API with fallback sample data

Success response example (200):

```json
{
	"success": true,
	"message": "Successfully synced with UN Global Standards",
	"stats": {
		"newTargets": 3,
		"updatedTargets": 2,
		"failedTargets": [],
		"totalProcessed": 5
	}
}
```

## 5.4 Project Endpoints

### GET /api/projects

- Auth: Public
- Purpose: List all projects

Success response (200):

```json
{
	"success": true,
	"count": 1,
	"data": [
		{
			"_id": "<project_id>",
			"title": "Clean Water Initiative",
			"description": "Installing rural water systems",
			"sdgGoal": "Clean Water",
			"organization": "NGO Lanka",
			"budget": 2500000,
			"status": "In Progress"
		}
	]
}
```

### POST /api/projects

- Auth: Bearer token required
- Roles: admin, partner, government
- Purpose: Create project

Request body:

```json
{
	"title": "Clean Water Initiative",
	"description": "Installing rural water systems",
	"sdgGoal": "Clean Water",
	"organization": "NGO Lanka",
	"budget": 2500000,
	"status": "Proposed"
}
```

Success response (201):

```json
{
	"success": true,
	"data": {
		"_id": "<project_id>",
		"title": "Clean Water Initiative"
	}
}
```

### GET /api/projects/with-stats

- Auth: Public
- Purpose: Paginated project list enriched with computed statistics
- Query params: page, limit, sdgGoal, status, organization

Example request:

```bash
curl "http://localhost:5000/api/projects/with-stats?page=1&limit=12&status=In%20Progress"
```

Example response (200):

```json
{
	"success": true,
	"page": 1,
	"limit": 12,
	"totalProjects": 20,
	"totalPages": 2,
	"count": 12,
	"data": [
		{
			"_id": "<project_id>",
			"title": "Clean Water Initiative",
			"totalSpent": 600000,
			"totalPeopleImpacted": 1200,
			"budgetRemaining": 1900000,
			"budgetUtilization": 24,
			"isOverBudget": false,
			"warningLevel": null
		}
	]
}
```

### GET /api/projects/organizations

- Auth: Public
- Purpose: Fetch distinct project organizations

### GET /api/projects/:id/statistics

- Auth: Public
- Purpose: Statistics for a specific project

### GET /api/projects/:id

- Auth: Public
- Purpose: Get project by ID

### PUT /api/projects/:id

- Auth: Bearer token required
- Roles: admin, partner, government
- Purpose: Update project

### DELETE /api/projects/:id

- Auth: Bearer token required
- Role: admin
- Purpose: Delete project

## 5.5 Report Endpoints

### GET /api/reports

- Auth: Public
- Purpose: List reports
- Query params: project, reportType

### GET /api/reports/:id

- Auth: Public
- Purpose: Fetch one report by ID

### POST /api/reports

- Auth: Bearer token required
- Roles: admin, partner, government
- Purpose: Submit report with validation and optional USD conversion

Request body examples:

Financial report:

```json
{
	"project": "<project_id>",
	"reportType": "financial",
	"amountLKR": 100000,
	"description": "Q1 budget utilization"
}
```

People helped report:

```json
{
	"project": "<project_id>",
	"reportType": "people_helped",
	"peopleImpacted": 150,
	"description": "Community health camp"
}
```

Success response (201):

```json
{
	"success": true,
	"data": {
		"_id": "<report_id>",
		"project": "<project_id>",
		"reportType": "financial",
		"amountLKR": 100000,
		"amountUSD": 333.33,
		"description": "Q1 budget utilization"
	},
	"message": "Progress report submitted successfully",
	"warning": null
}
```

### PUT /api/reports/:id

- Auth: Bearer token required
- Access: report owner or admin
- Purpose: Update report

### DELETE /api/reports/:id

- Auth: Bearer token required
- Access: report owner or admin
- Purpose: Delete report

Success response (200):

```json
{
	"success": true,
	"message": "Report removed successfully",
	"data": {}
}
```

### GET /api/reports/project/:id

- Auth: Public
- Purpose: Get timeline of reports for project

### GET /api/reports/stats/summary

- Auth: Public
- Purpose: Aggregated report impact summary

Example response (200):

```json
{
	"success": true,
	"data": {
		"financial": {
			"totalLKR": 80000,
			"totalUSD": 400,
			"reportCount": 2
		},
		"people": {
			"totalPeople": 250,
			"reportCount": 2
		},
		"reportsByType": [
			{ "_id": "financial", "count": 2 },
			{ "_id": "milestone", "count": 1 }
		],
		"projectsReported": 1,
		"totalReports": 3
	}
}
```

## 5.6 Collaboration Endpoints

The currently exposed collaboration routes are listed below.

### GET /api/collab/feed

- Auth: Public (current route configuration)
- Purpose: Get post feed

Success response (200):

```json
[
	{
		"_id": "<post_id>",
		"title": "Seeking WASH partners in Kandy",
		"content": "Looking for field implementation partners.",
		"comments": []
	}
]
```

### POST /api/collab/comment

- Auth: Public (current route configuration)
- Purpose: Add comment on post

Request body:

```json
{
	"postId": "<post_id>",
	"text": "We can support implementation in two districts."
}
```

Success response (201):
```json
{
	"message": "Comment added successfully",
	"post": {
		"_id": "<post_id>",
		"comments": [
			{
				"user": "<user_id>",
				"userName": "Jane Doe",
				"text": "We can support implementation in two districts."
			}
		]
	}
}
```

### PUT /api/collab/comment/:commentId

- Auth: Public (current route configuration)
- Purpose: Update comment text by comment ID

Request body:

```json
{
	"text": "Updated comment text"
}
```

### GET /api/collab/notifications

- Auth: Public (current route configuration)
- Purpose: Retrieve notifications for current user

### PUT /api/collab/post/:id

- Auth: Public (current route configuration)
- Access: post owner only (controller-level check)
- Purpose: Update post

### DELETE /api/collab/post/:id

- Auth: Public (current route configuration)
- Access: post owner only (controller-level check)
- Purpose: Delete post

### POST /api/collab/announcement

- Auth: Public (current route configuration)
- Access: admin only (controller-level check)
- Purpose: Broadcast announcement to all users

Request body:

```json
{
	"message": "System maintenance at 10 PM"
}
```

## 6. Error Response Patterns

Current codebase has more than one error shape depending on route/middleware path.

Common patterns:

```json
{
	"success": false,
	"error": "Not authorized to access this route"
}
```

```json
{
	"success": false,
	"message": "Validation failed"
}
```

```json
{
	"error": "Post not found"
}
```

## 7. Testing and Performance Reports

Testing instructions are documented in:

- TESTING_INSTRUCTION_REPORT.md

This includes:
- Unit test commands
- Integration test setup and execution
- Performance testing setup and execution
- Testing environment configuration details

## 8. Deployment Report

Production deployments are now live:

- Frontend (Vercel): https://partner-sync-chi.vercel.app/
- Backend (Render): https://partnersync-backend-c9aj.onrender.com

## 8.1 Deployment Architecture

- Frontend is hosted on Vercel.
- Backend API is hosted on Render as a Node web service.
- MongoDB is hosted on MongoDB Atlas.
- Frontend communicates with backend over HTTPS.

## 8.2 Environment Variables (Production)

Backend (Render):

```env
PORT=5000
MONGO_URI=<mongodb_atlas_connection_string>
JWT_SECRET=<strong_random_secret>
NODE_ENV=production
```

Frontend (Vercel):

```env
REACT_APP_API_BASE_URL=https://partnersync-backend-c9aj.onrender.com
```

## 8.3 Build and Start Commands Used

Backend service (Render):
- Build command: npm install
- Start command: npm start
- Root directory: backend

Frontend app (Vercel):
- Build command: npm run build
- Output directory: build
- Root directory: frontend

## 8.4 Production Health Verification

Backend checks:

```bash
curl https://partnersync-backend-c9aj.onrender.com/
curl https://partnersync-backend-c9aj.onrender.com/api-docs
```

Frontend checks:
- Open https://partner-sync-chi.vercel.app/
- Confirm login/signup UI loads
- Confirm data pages can fetch API responses

## 8.5 Post-Deployment Smoke Test Checklist

1. Register a new user.
2. Log in and verify JWT is stored.
3. Access public project/report endpoints.
4. Verify protected operations with valid token.
5. Verify collaboration feed and notifications.
6. Verify SDG sync endpoint returns a success payload.

## 8.6 Deployment Report Document

Detailed deployment documentation is in:

- DEPLOYMENT_REPORT.md
