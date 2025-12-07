# 🚀 Task Management System - Microservices Architecture

A scalable and production-ready Task Management System built with **NestJS Microservices (Monorepo)** architecture for the backend and **React (Vite + Tailwind)** for the frontend.

## 🌐 Live Demo

> **🚀 This project is hosted on Oracle Cloud VPS Server and managed using nginx**

### 🔗 **Access the Application:**
### **[http://80.225.204.112/task-manager/](http://80.225.204.112/task-manager/)**

**Available Endpoints:**
- **Frontend:** http://80.225.204.112/task-manager/
- **Login Page:** http://80.225.204.112/task-manager/login
- **Dashboard:** http://80.225.204.112/task-manager/dashboard
- **API Gateway:** http://80.225.204.112/task-manager/api

---

## 🏗️ System Architecture

The backend follows a **Microservices Architecture** managed within a NestJS Monorepo. Each service handles its specific responsibility, ensuring separation of concerns and better scalability.

### 🔹 Services Breakdown

| Service | Type | Port | Description |
|---------|------|------|-------------|
| **API Gateway** | HTTP Server | 3000 | The single entry point. Handles routing, authentication (JWT Guards), and proxies requests to internal microservices. |
| **Auth Service** | Microservice (TCP) | 3001 | Handles user registration, login, password hashing (Bcrypt), and JWT validation. |
| **Project Service** | Microservice (TCP) | 3002 | Manages project creation and access control (Admin only for creation). |
| **Task Service** | Microservice (TCP) | 3003 | Handles task creation, status updates, and assignment logic. Verifies project existence before task creation. |

### 🔹 High-Level Design (HLD)

```
Client (React) 
    ↓ HTTP Request
API Gateway (Port 3000)
    ↓ JWT Validation (Auth Guard)
    ↓ TCP Transport
Microservices (Auth/Project/Task)
    ↓ Inter-Service Communication (TCP)
    ↓ Database Operations (MongoDB)
Response ← ← ← ← ← ← ← ← ← ← ←
```

**Flow Explanation:**
1. Client (React Frontend) sends HTTP requests to the API Gateway
2. API Gateway validates JWT token (via Auth Guard)
3. Gateway forwards the request to the appropriate microservice using **TCP Transport**
4. Inter-Service Communication: Services communicate internally (e.g., Task Service verifies project existence via Project Service)
5. Database operations are performed in MongoDB
6. Response is returned to the client

### 🔹 Project Structure

```
nestjs-task-platform/
├── backend/                          # NestJS Monorepo Backend
│   ├── apps/
│   │   ├── api-gateway/             # API Gateway Service
│   │   │   ├── src/
│   │   │   │   ├── controllers/     # HTTP Controllers (auth, projects, tasks)
│   │   │   │   ├── services/        # Service layer (proxies to microservices)
│   │   │   │   ├── guards/         # JWT Auth Guard
│   │   │   │   ├── filters/         # Exception filters
│   │   │   │   └── main.ts          # Entry point
│   │   │   └── Dockerfile
│   │   ├── auth-service/             # Authentication Microservice
│   │   │   ├── src/
│   │   │   │   ├── auth-service.controller.ts
│   │   │   │   ├── auth-service.service.ts
│   │   │   │   ├── auth-service.service.spec.ts  # Unit tests
│   │   │   │   ├── schemas/         # MongoDB schemas (user.schema.ts)
│   │   │   │   └── main.ts
│   │   │   └── Dockerfile
│   │   ├── project-service/         # Project Management Microservice
│   │   │   ├── src/
│   │   │   │   ├── project-service.controller.ts
│   │   │   │   ├── project-service.service.ts
│   │   │   │   ├── project-service.service.spec.ts  # Unit tests
│   │   │   │   ├── schemas/         # MongoDB schemas (project.schema.ts)
│   │   │   │   └── main.ts
│   │   │   └── Dockerfile
│   │   └── task-service/            # Task Management Microservice
│   │       ├── src/
│   │       │   ├── task-service.controller.ts
│   │       │   ├── task-service.service.ts
│   │       │   ├── task-service.service.spec.ts  # Unit tests
│   │       │   ├── schemas/         # MongoDB schemas (task.schema.ts)
│   │       │   └── main.ts
│   │       └── Dockerfile
│   ├── libs/
│   │   └── common/                   # Shared Library
│   │       └── src/
│   │           ├── dto/             # Shared DTOs (create-user, create-project, create-task)
│   │           └── index.ts
│   ├── package.json
│   ├── nest-cli.json
│   └── tsconfig.json
│
├── frontend/                         # React Frontend
│   ├── src/
│   │   ├── api/                     # API client functions
│   │   │   ├── axiosClient.js       # Axios configuration
│   │   │   ├── authApi.js
│   │   │   ├── projectApi.js
│   │   │   └── taskApi.js
│   │   ├── components/             # Reusable components
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── PublicRoute.jsx
│   │   ├── pages/                  # Page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── ProjectDetailPage.jsx
│   │   ├── utils/                  # Utility functions
│   │   │   └── cookieUtils.js
│   │   ├── App.jsx                 # Main app component
│   │   └── main.jsx                # Entry point
│   ├── public/                     # Static assets
│   ├── Dockerfile                  # Production Dockerfile
│   ├── vite.config.js              # Vite config (production)
│   └── vite.config.local.js        # Vite config (local)
│
├── docker-compose.yml               # Production/VPS configuration
├── docker-compose.local.yml        # Local development configuration
├── Dockerfile.local                 # Local frontend Dockerfile
└── README.md
```

**Key Directories:**
- **`backend/apps/`** - All microservices (api-gateway, auth-service, project-service, task-service)
- **`backend/libs/common/`** - Shared DTOs and types used across all services
- **`frontend/src/api/`** - API client functions for backend communication
- **`frontend/src/pages/`** - React page components
- **`frontend/src/components/`** - Reusable React components

---

## 🛠️ Tech Stack

### Backend
- **Framework:** NestJS (Monorepo Mode)
- **Language:** TypeScript
- **Database:** MongoDB (Mongoose ODM)
- **Communication:** TCP (Microservices Transport)
- **Security:** JWT (JSON Web Tokens), Bcrypt, HttpOnly Cookies
- **Validation:** class-validator, class-transformer

### Frontend
- **Framework:** React.js (Vite)
- **Styling:** Tailwind CSS
- **State/API:** Axios (with Interceptors), React Query
- **Notifications:** React Hot Toast
- **Routing:** React Router DOM

---

## 🚀 Setup & Installation Guide

### Prerequisites
- Node.js (v16+)
- MongoDB (Running locally on port 27017 or in Docker)
- Docker & Docker Compose (optional, for containerized setup)

### Option 1: Docker Compose Setup (Recommended)

#### Local Development:
```bash
# Clone repository
git clone <repository-url>
cd nestjs-task-platform

# Build and start all services
docker compose -f docker-compose.local.yml build
docker compose -f docker-compose.local.yml up -d

# Access application
# Frontend: http://localhost:5173
# API Gateway: http://localhost:3000
```

#### Production/VPS Setup:
```bash
# Clone repository
git clone <repository-url>
cd nestjs-task-platform

# Update VPS IP in docker-compose.yml (if needed)
# Then build and start
docker compose build
docker compose up -d

# Access via Nginx
# http://YOUR_VPS_IP/task-manager
```

### Option 2: Manual Setup (Without Docker)

#### Backend Setup

1. **Navigate to backend folder:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
```bash
# Copy example file
cp env.example .env
```

4. **Configure environment variables in `.env`:**
```env
# Database
MONGO_URI=mongodb://localhost:27017/task-manager

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Service Configuration
AUTH_HOST=localhost
AUTH_PORT=3001

PROJECT_HOST=localhost
PROJECT_PORT=3002

TASK_HOST=localhost
TASK_PORT=3003

# API Gateway
PORT=3000
FRONTEND_URL=http://localhost:5173
```

5. **Run Microservices (4 separate terminals):**

**Terminal 1 - Auth Service:**
```bash
cd backend
nest start auth-service
```

**Terminal 2 - Project Service:**
```bash
cd backend
nest start project-service
```

**Terminal 3 - Task Service:**
```bash
cd backend
nest start task-service
```

**Terminal 4 - API Gateway:**
```bash
cd backend
nest start api-gateway
```

Wait for Gateway to log: `Nest application successfully started.`

#### Frontend Setup

1. **Navigate to frontend folder:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
```bash
# Copy example file
cp env.example .env
```

4. **Configure environment variables in `.env`:**
```env
# Local Development
VITE_API_BASE_URL=http://localhost:3000
VITE_BASE_PATH=

# Production (with Nginx)
# VITE_API_BASE_URL=http://YOUR_VPS_IP/task-manager/api
# VITE_BASE_PATH=/task-manager
```

5. **Start the React App:**
```bash
npm run dev
```

6. **Open browser:**
```
http://localhost:5173
```

---

## 🧠 Design & Scalability Decisions

### 1. Monorepo Structure

**Why:** The Monorepo structure allows sharing DTOs and Enums (via `@app/common` library) across all microservices without code duplication. This approach ensures:
- **Type Safety:** TypeScript types remain consistent across the entire backend ecosystem
- **Code Reusability:** Common DTOs, interfaces, and enums are defined in one place
- **Easier Maintenance:** Changes propagate from one location to all services
- **Better Developer Experience:** Shared code can be directly imported without publishing packages

### 2. Database Design (Embedded vs Reference)

**Decision:** Used **Embedded Array** (`assignedUsers`) in the Project Schema within MongoDB, instead of a separate lookup table.

**Reasoning:** 
- This application is **Read-Heavy** (Users frequently view dashboards)
- Using MongoDB's `$in` operator on indexed arrays results in fast queries
- Expensive `$lookup` (JOIN) operations are eliminated
- Dashboard load time is drastically reduced
- Write operations are less frequent compared to reads, making the embedded approach efficient

**Trade-off:** If assigned users change frequently, a reference approach would be better, but in this case, read performance is the priority.

### 3. TCP Transport for Microservices

**Why TCP instead of HTTP:**
- **Lower Overhead:** TCP directly transfers binary data without HTTP headers overhead
- **Faster Communication:** HTTP protocol overhead is eliminated for internal network calls
- **Better Performance:** Communication between microservices is lightweight and fast
- **Suitable for Internal Communication:** HTTP is better for external APIs, but TCP is optimal for internal services

**When to use HTTP:** Use HTTP for external APIs, third-party integrations, or public-facing endpoints.

### 4. API Gateway Pattern

**Why:** 
- Frontend should not have knowledge of internal microservice ports
- Gateway acts as a reverse proxy and security layer (Guards)
- Microservices remain private and secure
- Single entry point enables easier monitoring and logging
- CORS, rate limiting, and other cross-cutting concerns can be handled in one place

---

## 🧪 API Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | Create new user (Admin/User) | ❌ |
| `POST` | `/auth/login` | Login user (returns JWT in HttpOnly cookie) | ❌ |
| `POST` | `/auth/logout` | Logout user (clears cookie) | ✅ |
| `GET` | `/auth/me` | Get current user profile | ✅ |
| `GET` | `/auth/users` | Get all users (Admin only) | ✅ |

### Project Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/projects` | Create new project (Admin only) | ✅ |
| `GET` | `/projects` | Get all projects (Admin: all, User: assigned only) | ✅ |
| `GET` | `/projects/my` | Get user's assigned projects | ✅ |
| `GET` | `/projects/:id` | Get project by ID | ✅ |
| `PATCH` | `/projects/:id` | Update project | ✅ |

### Task Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/tasks` | Create new task (validates Project ID first) | ✅ |
| `GET` | `/projects/:projectId/tasks` | Get all tasks for a project | ✅ |
| `PATCH` | `/tasks/:id/status` | Update task status (TO_DO → IN_PROGRESS → DONE) | ✅ |

### Request/Response Examples

**Register User:**
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "USER"
}
```

**Login:**
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

# Response: JWT token set in HttpOnly cookie
```

**Create Project:**
```bash
POST /projects
Content-Type: application/json
Cookie: accessToken=<jwt_token>

{
  "dto": {
    "name": "New Project",
    "description": "Project description",
    "assignedUsers": ["user_id_1", "user_id_2"]
  }
}
```

**Create Task:**
```bash
POST /tasks
Content-Type: application/json
Cookie: accessToken=<jwt_token>

{
  "projectId": "project_id_here",
  "title": "Task Title",
  "description": "Task description",
  "status": "TO_DO"
}
```

**Update Task Status:**
```bash
PATCH /tasks/:id/status
Content-Type: application/json
Cookie: accessToken=<jwt_token>

{
  "status": "IN_PROGRESS"
}
```

---

## 🔮 Future Improvements

If given more time, the following improvements would be implemented:

1. **Redis Caching:** Cache GET `/projects` requests for faster retrieval
2. **RabbitMQ:** Replace TCP with RabbitMQ for better load balancing and message durability
3. **Rate Limiting:** Add rate limiting in API Gateway to prevent abuse
4. **Monitoring:** Implement Prometheus + Grafana for service metrics and health monitoring
5. **Logging:** Centralized logging system (ELK Stack) for better debugging
6. **Testing:** Comprehensive unit tests and E2E tests
7. **CI/CD:** Automated deployment pipeline

---

## 📝 Environment Variables

### Backend (.env)
```env
MONGO_URI=mongodb://localhost:27017/task-manager
JWT_SECRET=your_jwt_secret_key_here
AUTH_HOST=localhost
AUTH_PORT=3001
PROJECT_HOST=localhost
PROJECT_PORT=3002
TASK_HOST=localhost
TASK_PORT=3003
PORT=3000
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:3000
VITE_BASE_PATH=
```

---

## 🧪 Testing

The project includes comprehensive unit tests for all backend services using **Jest** testing framework.

### Test Structure

Unit tests are implemented for:
- **Auth Service:** `auth-service.service.spec.ts` - Tests user registration, login, password hashing, and JWT validation
- **Project Service:** `project-service.service.spec.ts` - Tests project creation, retrieval, and access control
- **Task Service:** `task-service.service.spec.ts` - Tests task creation, status updates, and project validation

### Running Tests

```bash
# Navigate to backend folder
cd backend

# Run all tests
npm test

# Run tests in watch mode (auto-reload on changes)
npm run test:watch

# Generate coverage report
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run tests for specific service
npm test -- auth-service.service.spec.ts
```

### Test Coverage

The test suite covers:
- Service layer business logic
- Database operations (with mocked MongoDB)
- Error handling and edge cases
- Authentication and authorization flows
- Inter-service communication scenarios

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the UNLICENSED License.

---

## 👨‍💻 Author

Built with ❤️ using NestJS Microservices and React

---

**Note:** This system is production-ready and easily scalable. Due to the microservices architecture, each service can be independently scaled, deployed, and maintained.
