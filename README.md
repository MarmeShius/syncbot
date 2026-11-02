# SyncBot

SyncBot is a customer support and ticket management system. A customer can create a complaint and talk with the support team. An agent can see the ticket, reply to the customer, change its status, and use AI to understand the issue faster. An admin can manage the support system.

This project was made for a MERN stack assignment. The main purpose was to build a real workflow, not only a page with fake ticket numbers.

## What the project has

### Customer

- Register and login
- Create a support ticket
- Select category and priority
- View own tickets
- See ticket status
- Reply to the support team
- Use the support assistant for general questions

### Support agent

- Login through a private staff account
- See the customer ticket queue
- Search tickets by subject, ticket ID, or customer
- Filter by status and priority
- See total tickets and customers reporting issues
- Open ticket details
- Reply to customers
- Add private internal notes
- Change ticket status, priority, and category
- Click **Analyze with AI** on a real ticket

### Administrator

- Use a private admin account
- Open the admin dashboard
- View the support system overview
- See each agent's distinct customers and unresolved ticket count in **Agent Workload**
- Track distinct customers with resolved or closed tickets separately; this history does not affect assignment
- Automatically route new tickets to the active agent with the fewest customers on unresolved tickets; ties go to the agent with fewer unresolved tickets

The workload rule is deterministic, not an AI model. Resolved and closed tickets do not count toward agent workload. Customers are counted once per agent, even if they have multiple unresolved tickets with that agent.

The public registration page creates customer accounts only. Agent and admin accounts are created privately by the owner of the system.

## Technology used

- React and Vite for the frontend
- Tailwind CSS for styling
- Node.js and Express for the backend
- MongoDB Atlas for the database
- Mongoose for MongoDB models
- JWT for login sessions
- bcrypt for password hashing
- OpenRouter API for optional AI responses

## Project folders

```text
SyncBot/
├── frontend/
│   └── src/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   └── createStaff.js
│   └── .env
└── README.md
```

## Run the project on your computer

### 1. Install requirements

Install Node.js first. You also need a MongoDB Atlas database. The project is already using Mongoose, so no separate MongoDB server is needed when Atlas is used.

### 2. Setup the backend environment

Create this file:

```text
backend/.env
```

Add your own values:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
JWT_SECRET=put-a-long-random-secret-here
MONGO_URI=mongodb+srv://DATABASE_USER:DATABASE_PASSWORD@YOUR_CLUSTER.mongodb.net/syncbot?retryWrites=true&w=majority
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openai/gpt-oss-20b
OPENROUTER_TICKET_MODEL=openai/gpt-4o-mini
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```

Do not commit `backend/.env` to GitHub. It contains passwords and private keys.

### 3. Install and start the backend

```powershell
cd backend
npm install
npm run dev
```

The backend should show:

```text
MongoDB connected
SyncBot API listening on http://localhost:5000
```

### 4. Install and start the frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open this address in the browser:

```text
http://localhost:5173
```

## Private agent and admin accounts

Customers register from the website. Staff accounts are not created from the public register form.

To create an agent or admin account, temporarily add these values to `backend/.env`:

```env
STAFF_NAME=Your Name
STAFF_USERNAME=private_username
STAFF_EMAIL=private@example.com
STAFF_PASSWORD=use-a-strong-password
STAFF_ROLE=agent
```

Then run:

```powershell
cd backend
npm run create-staff
```

Use this for an administrator:

```env
STAFF_ROLE=admin
```

After the account is created, remove the `STAFF_*` values from `.env`. The password is saved as a hash in MongoDB, not as plain text.

## Email notifications

SyncBot sends a welcome email to new customers, notifies active admins about registrations, and sends a sign-in alert to the email address of each user who successfully logs in. It also confirms every new ticket to its customer, emails support staff and assigned agents, notifies the other participant on every customer/agent reply, and emails customers when ticket status changes (including resolution and closure). First response and resolution SLA targets send met/breached messages, plus one advance warning near each deadline. The backend checks active ticket deadlines once per minute and saves notification flags so restart/repeated checks do not resend the same SLA event. Internal staff notes stay private and are not emailed to customers.

Email delivery uses SMTP. Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM` in `backend/.env` for a local backend, or in the project-root `.env` for Docker Compose. Use SMTP credentials and a sender address approved by your email provider; keep the password private and out of Git. Port `587` is the default, and port `465` uses a secure SMTP connection.

Without SMTP settings, local development logs a simulation and Docker production logs an error; neither delivers real email. After updating Docker environment values or email code, run `docker compose up -d --build backend` from the project root.

## AI ticket assistant

Customers can select **Create with AI** in the customer dashboard, describe their issue in a conversation, and answer any follow-up questions. Once enough information is available for an actionable ticket, the assistant automatically submits it through the existing ticket endpoint, which handles assignment and notifications. The authenticated customer email is used as the ticket contact, and the newly created ticket opens in the dashboard. Ticket intake defaults to the faster `openai/gpt-4o-mini` model; override it with `OPENROUTER_TICKET_MODEL` if needed. When OpenRouter is unconfigured or unavailable, ticket intake and title suggestions use local fallbacks, and customer chat falls back to the local knowledge base. After an API key receives HTTP 401, the backend stops retrying that rejected key to avoid delays; update the key and restart the backend to retry. The assistant identifies fallback responses; staff AI analysis also returns its local analysis instead of failing.

## AI feature

The important AI feature is inside the Agent Dashboard.

1. A customer creates a real ticket.
2. The agent opens that ticket.
3. The agent clicks **Analyze with AI**.
4. The backend sends the ticket subject, description, category, priority, status, and recent conversation to OpenRouter.
5. The agent gets:
   - A short summary
   - Suggested category
   - Suggested priority
   - Customer sentiment
   - Suggested response
   - Recommended next action

The OpenRouter key is only used by the backend. It is never placed in React.

If `OPENROUTER_API_KEY` is empty, the app uses a local fallback. When an OpenRouter key is available, AI responses come from OpenRouter.

There is also a small customer support chatbot for general questions. It is different from the Agent ticket analysis feature.

## API routes

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/users/me
```

### Tickets

```text
GET   /api/tickets
POST  /api/tickets
GET   /api/tickets/:id
PATCH /api/tickets/:id
POST  /api/tickets/:id/messages
POST  /api/tickets/:id/notes
POST  /api/tickets/:id/ai-analysis
GET   /api/tickets/stats
```

### Customer assistant

```text
POST /api/ai/chat
```

The backend checks the JWT token and the user role before allowing private actions. Internal notes are not returned to customers.

## Database design

The main MongoDB collections are:

### users

Stores the user name, username, email, hashed password, role, and active status.

Roles are:

- customer
- agent
- admin

### tickets

Stores the ticket subject, description, contact information, category, priority, status, customer, assigned agent, and messages.

Messages are stored with a type:

- `reply` is visible in the conversation
- `note` is private for agents and admins

The ticket collection also has a text index for searching ticket subjects and ticket IDs.

## Testing and checks

Run the frontend checks:

```powershell
cd frontend
npm run build
npm run lint
```

Check the backend syntax:

```powershell
cd backend
node --check src/server.js
node --check src/createStaff.js
```

Run the backend API tests:

```powershell
cd backend
npm test
```

The backend tests use Node's test runner and Supertest. They run in an isolated in-memory mode, so they do not create test records in the real MongoDB Atlas database.

The backend test file is `backend/test/api.test.js`. It checks:

- Invalid login credentials return an authentication error.
- An agent cannot create a customer ticket.
- A customer can create a ticket.
- One customer cannot open another customer's ticket.
- An agent can change a ticket status.

The frontend tests are in `frontend/src/pages/Login.test.jsx`. They use Vitest and Testing Library to check login submission and visible login errors.

Run all frontend checks:

```powershell
cd frontend
npm test
npm run build
npm run lint
```

The main manual test is:

1. Register a customer.
2. Create a ticket.
3. Login as an agent.
4. Confirm the ticket appears in the queue.
5. Open the ticket and run AI analysis.
6. Reply to the customer and change the status.

## Deployment

### MongoDB Atlas

Create an Atlas cluster, database user, and network access rule. Use the Atlas connection string as `MONGO_URI` in the backend deployment settings.

### Deploy the backend on Render

1. Push the project to GitHub.
2. Create a new **Web Service** on Render.
3. Select the GitHub repository.
4. Set the root directory to `backend`.
5. Set the build command:

```text
npm install
```

6. Set the start command:

```text
npm start
```

7. Add these environment variables in Render:

```env
PORT=5000
CLIENT_URL=https://YOUR-FRONTEND-DOMAIN.vercel.app
JWT_SECRET=your-production-random-secret
MONGO_URI=your-mongodb-atlas-uri
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=openai/gpt-oss-20b
OPENROUTER_TICKET_MODEL=openai/gpt-4o-mini
```

Do not put `STAFF_PASSWORD` in GitHub. Create the staff account privately before or after deployment using the backend command, or create it directly in the database with the password hashed by the application.

### Deploy the frontend on Vercel

1. Create a new Vercel project from the same GitHub repository.
2. Set the root directory to `frontend`.
3. Vercel normally detects Vite automatically.
4. Add this frontend environment variable:

```env
VITE_API_URL=https://YOUR-BACKEND-DOMAIN.onrender.com/api
```

5. Deploy the frontend.
6. Update the backend `CLIENT_URL` with the final Vercel URL.

After changing `CLIENT_URL`, redeploy the backend. Otherwise the browser may block API requests because of CORS.

## Known limitations

- The current automated tests cover important authentication, authorization, ticket, and login behavior. More end-to-end browser tests can be added later.
- File attachment storage is not finished.
- The admin page still needs full API-backed user and category management.
- Real email delivery requires SMTP settings in the environment file used to start the backend.
- AI responses should always be checked by an agent before sending them to a customer.

## AI build log

I used GitHub Copilot while building this project.

It helped with:

- Planning the Express API
- Creating authentication middleware
- Connecting React to the backend
- Creating the ticket analysis endpoint
- Improving the responsive layout

I changed and checked the generated code myself. I also fixed issues with fake data, role access, MongoDB environment files, text overflow, and the agent/customer AI separation.

The project was checked with frontend build and lint commands, backend syntax checks, MongoDB connection checks, and manual customer-to-agent ticket tests.

## Run with Docker

Install Docker Desktop, then copy `.env.example` to `.env` in the project root. Set `JWT_SECRET` to a long random value. The OpenRouter key is optional.

Start the complete app, including MongoDB, with:

```powershell
docker compose up --build -d
```

Open `http://localhost:8080`. The Compose setup runs the frontend, backend, and MongoDB together; it keeps MongoDB data and uploaded attachments in named volumes. To stop the services while keeping data, run `docker compose down`. To follow logs, run `docker compose logs -f`.

## CI/CD with GitHub Actions

The workflow in `.github/workflows/ci-cd.yml` runs on pull requests and pushes to `main`. It installs dependencies from both lockfiles, runs backend and frontend tests, lints and builds the frontend, and then builds and publishes the frontend and backend Docker images to GitHub Container Registry (GHCR) after a successful push to `main`. Images are tagged `latest` and with the commit SHA. The publish job uses the built-in `GITHUB_TOKEN` with package write permission; no registry password is needed.

To enable publishing, push this repository to GitHub and allow the repository's Actions workflow to write packages. Image publishing is continuous delivery; deploying those images to a hosting provider or server requires adding that destination's deployment credentials and deployment step.
