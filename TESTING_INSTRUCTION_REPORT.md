# Testing Instruction Report

This report documents how to run unit, integration, and performance tests for PartnerSync, including required environment configuration.

## 1. Testing Stack

- Unit and integration: Jest, Supertest
- Database for isolated tests: mongodb-memory-server
- Performance testing: Artillery

## 2. Testing Environment Configuration

## 2.1 Prerequisites

- Node.js 18+ recommended
- npm installed
- Backend dependencies installed

```bash
cd backend
npm install
```

## 2.2 Environment Variables

Set backend environment variables in backend/.env before running API-level tests:

```env
PORT=5000
MONGO_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_secure_jwt_secret>
NODE_ENV=test
```

Notes:
- Some backend tests import the app from server.js, which initializes DB connection.
- Isolated model/controller tests use mongodb-memory-server and do not depend on your Atlas dataset.

## 2.3 Current Test File Inventory

Located in backend/tests:

- auth.test.js
- project.test.js
- Report.test.js
- reportController.test.js

## 3. How To Run Unit Tests

Run all backend tests:

```bash
cd backend
npm test
```

Run a specific suite (example):

```bash
cd backend
npx jest tests/Report.test.js --runInBand
```

Recommended focused unit suites:

- Report model unit suite:

```bash
cd backend
npx jest tests/Report.test.js --runInBand
```

- Report controller unit suite:

```bash
cd backend
npx jest tests/reportController.test.js --runInBand
```

What these validate:
- Report model schema validation (financial, people_helped, required fields, defaults)
- Report controller business logic (validation, exchange-rate fallback, summary statistics)

## 4. Integration Testing Setup And Execution

## 4.1 Backend Integration Tests

Existing integration coverage is included inside:

- auth.test.js
- project.test.js
- reportController.test.js

Execution command:

```bash
cd backend
npm test -- --runInBand
```

Recommended troubleshooting command for hanging processes:

```bash
cd backend
npm test -- --runInBand --detectOpenHandles
```

## 4.2 Interpreting Current Known Behavior

In the current codebase state, full suite execution may produce mixed results:

- Pass: Report.test.js, reportController.test.js
- Failures observed in auth.test.js and project.test.js

These are test/data-contract alignment issues, not test-runner setup issues.

## 4.3 Optional UI Integration/E2E Baseline

A Playwright config exists at workspace root, but there are currently no Playwright spec files in the configured test directory.

If you add Playwright tests:

```bash
cd /Users/savindi/Documents/AF Project
npx playwright test
```

## 5. Performance Testing Setup And Execution

Performance scenario configuration is in backend/performance.yml.

## 5.1 Prerequisites

- Backend running locally on port 5000
- A valid user in DB that matches credentials in performance.yml (currently admin@partnersync.com / password123)

## 5.2 Install Artillery (if not already available)

```bash
cd backend
npm install --save-dev artillery
```

Or use without local install:

```bash
npx artillery --version
```

## 5.3 Run Performance Test

```bash
cd backend
npx artillery run performance.yml --output report.json
```

Current scenario profile (from performance.yml):
- Warm-up phase: 60s at 5 arrivals/sec
- Sustained load phase: 120s at 20 arrivals/sec
- Flow includes login, project listing, stats, reports fetch, and collab feed

## 5.4 Generate HTML Report

```bash
cd backend
npx artillery report report.json
```

Expected output:
- A generated HTML report file in backend (for sharing and analysis)
- Request rates, latencies, response status distribution

## 5.5 Common Performance Test Failure Causes

- Login credentials in scenario do not exist or are invalid
- Backend not running on http://localhost:5000
- Token capture step fails, causing downstream authenticated calls to fail

## 6. Suggested Testing Workflow

1. Start backend server:

```bash
cd backend
npm run dev
```

2. Run focused unit tests first:

```bash
cd backend
npx jest tests/Report.test.js tests/reportController.test.js --runInBand
```

3. Run full backend test suite:

```bash
cd backend
npm test -- --runInBand
```

4. Run performance tests once API baseline is healthy:

```bash
cd backend
npx artillery run performance.yml --output report.json
npx artillery report report.json
```

## 7. Test Data And Isolation Notes

- Report.test.js and reportController.test.js use in-memory MongoDB and clean collections between tests.
- auth.test.js and project.test.js use app-level routes and can be affected by live route middleware and external DB state.
- Keep credentials and environment secrets out of committed reports.
