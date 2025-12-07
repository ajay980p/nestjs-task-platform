🚀 Task Management System - Microservices ArchitectureA scalable, role-based Task Management System built using NestJS Microservices (Monorepo) for the backend and React (Vite + Tailwind) for the frontend.The system is designed to handle high concurrency using an Event-Driven/Request-Response architecture over TCP, ensuring low latency communication between services.🏗️ System ArchitectureThe backend follows a Microservices Architecture managed within a NestJS Monorepo.🔹 Services BreakdownServiceTypePortDescriptionAPI GatewayHTTP Server3000The single entry point. Handles Routing, Authentication (Guards), and proxies requests to internal microservices.Auth ServiceMicroservice (TCP)3001Handles User Registration, Login, Password Hashing (Bcrypt), and JWT Validation.Project ServiceMicroservice (TCP)3002Manages Project creation and Access Control (Admin only).Task ServiceMicroservice (TCP)3003Manages Task creation, status updates, and assignment logic.🔹 High-Level Design (HLD)Client (React) sends HTTP requests to the API Gateway.API Gateway validates the JWT Token (via Auth Guard).Gateway forwards the request to the appropriate microservice using TCP Transport.Inter-Service Communication: Services communicate internally (e.g., Task Service verifies Project existence via Project Service) before processing data.🛠️ Tech StackBackendFramework: NestJS (Monorepo Mode)Language: TypeScriptDatabase: MongoDB (Mongoose ODM)Communication: TCP (Microservices Transport)Security: JWT (JSON Web Tokens), Bcrypt, HttpOnly CookiesValidation: class-validator, class-transformerFrontendFramework: React.js (Vite)Styling: Tailwind CSSState/API: Axios (with Interceptors), Context APINotifications: React Hot Toast🚀 Setup & Installation GuideFollow these steps to run the complete system locally.1️⃣ PrerequisitesNode.js (v16+)MongoDB (Running locally on port 27017 or use Atlas URI)2️⃣ Clone the Repositorygit clone <repository-url>
cd task-manager-microservices
3️⃣ Backend SetupNavigate to the backend folder (root of the repo) and install dependencies:npm install
Configure Environment Variables:Create a .env file in the root directory:# Database
MONGO_URI=mongodb://localhost:27017/task-manager

# JWT Secret
JWT_SECRET=super_secret_key_for_assessment

# Service Configuration
AUTH_HOST=localhost
AUTH_PORT=3001

PROJECT_HOST=localhost
PROJECT_PORT=3002

TASK_HOST=localhost
TASK_PORT=3003
Run Microservices (Open 4 separate terminals):# Terminal 1: Start Auth Service
nest start auth-service

# Terminal 2: Start Project Service
nest start project-service

# Terminal 3: Start Task Service
nest start task-service

# Terminal 4: Start API Gateway
nest start api-gateway
Wait for the Gateway to log: Nest application successfully started.4️⃣ Frontend SetupNavigate to the frontend folder:cd frontend
npm install
Start the React App:npm run dev
Open your browser at http://localhost:5173.🧠 Design & Scalability DecisionsWhy I chose this specific architecture:1. Monorepo StructureWhy: Allows sharing DTOs and Enums (via @app/common library) across all microservices without code duplication. Ensures type safety across the entire backend ecosystem.2. Database Design (Embedded vs Reference)Decision: I used an Embedded Array (assignedUsers) in the Project Schema instead of a separate lookup table.Reasoning: This application is Read-Heavy (Users view dashboards frequently). Using MongoDB's $in operator on an indexed array eliminates expensive $lookup (JOIN) operations, drastically reducing Dashboard load time.3. API Gateway PatternWhy: The frontend should not know about internal microservices ports. The Gateway acts as a reverse proxy and a security layer (Guards), ensuring microservices remain private and secure.4. TCP TransportWhy: For internal communication, TCP is lighter and faster than HTTP, reducing the overhead of internal network calls.🧪 API Endpoints (Postman)AuthPOST /auth/register - Create Admin/UserPOST /auth/login - Get JWT (HttpOnly Cookie)ProjectsPOST /projects - Create Project (Admin only)GET /projects - Get All Projects (Admin)GET /projects/my - Get Assigned Projects (User)TasksPOST /tasks - Create Task (Validates Project ID first)GET /projects/:id/tasks - Get Project TasksPATCH /tasks/:id/status - Update Status (TO_DO -> DONE)🔮 Future ImprovementsIf I had more time, I would implement:Redis Caching: To cache GET /projects for faster retrieval.RabbitMQ: Replace TCP with RabbitMQ for better load balancing and message durability.Docker Compose: To containerize all services and DB into a single run command.