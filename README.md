# Personnel Tracking & Operations Management System

An enterprise-grade, comprehensive web application designed for real-time tracking, management, and orchestration of field personnel tasks. Built with modern web architecture, this system facilitates seamless task execution via QR/NFC scanning and provides administrators with a robust live monitoring dashboard.

---

## 🏗️ System Architecture

The application is structured as a scalable, microservices-oriented monorepo, leveraging industry-standard technologies to ensure high performance and maintainability.

### Technology Stack
- **Frontend:** Next.js (React), Tailwind CSS, Shadcn UI
- **Backend:** NestJS (Node.js), Prisma ORM
- **Database:** PostgreSQL
- **Message Broker & Caching:** Redis (Powered by BullMQ)

### Backend-For-Frontend (BFF) Pattern
To ensure robust security and mitigate Cross-Origin Resource Sharing (CORS) or `NetworkError` anomalies across diverse client environments (e.g., mobile devices, tablets, external networks), the system implements a strict **BFF Architecture**.

- **Isolated API Layer:** The frontend client does not communicate directly with the backend API.
- **Internal Proxy Routing:** All external client requests are intercepted by the Next.js server (`/api/proxy/...`).
- **Secure Docker Networking:** The Next.js proxy securely routes these requests to the internal NestJS backend (`http://backend:5000`) over the isolated Docker network bridge.
- **Enhanced Security:** Authentication tokens (JWT) are handled server-side and transported securely via `HttpOnly` cookies, preventing exposure to client-side vulnerabilities (XSS).

### Automated Task Orchestration (Nightly Generator)
Task assignment is highly automated to reduce administrative overhead. Administrators define physical **Zones** (e.g., Rooms, Facilities, Areas) rather than creating individual tasks manually.

- A **BullMQ-driven cron job** executes autonomously every night at `00:00 UTC`.
- The worker traverses all active Zones within the PostgreSQL database and systematically generates the required `TaskInstances` for the upcoming operational day.

---

## 🐳 Deployment (Dockerized Environment)

The entire infrastructure—comprising the frontend, backend, database, and caching layer—is fully containerized and orchestrated via Docker Compose for streamlined deployment.

### Prerequisites
- [Docker Engine](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Initialization Guide

1. **Spin up the Infrastructure:**
Execute the following command from the project's root directory:
```bash
docker-compose up -d --build
```
*This will provision and orchestrate the following microservices:*
- `local_postgres`: PostgreSQL instance (Port: 5432)
- `local_redis`: Redis in-memory data store (Port: 6379)
- `personel_takip_backend`: NestJS API Service (Port: 5000)
- `personel_takip_frontend`: Next.js Client Application (Port: 3000)

2. **Accessing the Interfaces:**
- **Web Dashboard:** `http://localhost:3000`
- **API Gateway:** Handled internally via the Frontend Proxy (no direct port binding required for clients).

3. **Database Migration Synchronization:**
If you need to push schema changes to the PostgreSQL container, run:
```bash
docker exec -it personel_takip_backend npx prisma db push
```

4. **Teardown Environment:**
To gracefully halt and remove the containers:
```bash
docker-compose down
```
*(Note: Persistent data is safely retained within `postgres_data` and `redis_data` Docker volumes).*

---

## 🛠️ Development & Debugging Scripts

Several utility scripts are provided in the root directory for local development and integration testing. **These are excluded from version control and production environments.**

- **`assign.sql` / `assign-tasks.js`**: Scripts to force-trigger task generation and bypass the nightly schedule for immediate debugging.
- **`create-admin.js` / `create-personel.js`**: Database seeders to inject default administrative and staff accounts into a fresh instance.

*Security Notice: Ensure these scripts remain in `.gitignore` to prevent accidental inclusion in the production repository.*