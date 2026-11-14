# Deployment & Operations Runbook
## The Grand Bahamian Resort & Reserve (`bahamas-hotel-resort`)

### 1. Overview
The Grand Bahamian Resort Property Management System (PMS) is deployed as a standalone containerized Next.js 14 service on Alpine Linux.

### 2. Environment Prerequisites
- Docker Engine 24+ & Docker Compose v2+
- Node.js 20+ (for local bare-metal execution)
- PostgreSQL 15+ (or Supabase instance)

### 3. Quick Start (Production Docker)
```bash
# Build and start containerized stack
docker compose -f deploy/docker-compose.yml up -d --build

# Verify container health
curl -f http://localhost:3000/api/health
```

### 4. Bare-Metal Development Run
```bash
# Run unit & integration test suites
npm test

# Start Next.js development server
npm run dev
```

### 5. Healthcheck & Statutory Compliance Verification
Endpoint: `http://localhost:3000/api/health`
Expected HTTP Status: `200 OK`
Response validates:
- Bahamas VAT Rate: 10.0%
- Resort Service Charge: 10.0%
- Hotel Guest Levy: 10.0%
- TIN: `100293848-VAT-BS`
