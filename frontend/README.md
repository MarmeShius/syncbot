# SyncBot Frontend

This folder contains the React frontend for SyncBot, an AI-enhanced customer support and ticket management system.

The frontend is not a separate demo page. It is connected to the Express backend and displays users, tickets, messages, roles, statuses, and AI results from the application API.

For the full project documentation, also read the README in the project root.

## What the frontend does

The frontend provides three different workspaces:

### Customer workspace

Customers can:

- Register an account
- Log in and keep a secure session
- Create a support ticket
- Select a ticket category
- Select a ticket priority
- Add contact information
- See their own ticket history
- Read replies from the support team
- Reply to an open ticket
- See the current ticket status
- Use the customer support assistant for general questions

Customers do not see internal notes or other customers' tickets.

### Agent workspace

Agents can:

- Log in through a private staff account
- View the real ticket queue
- Search by ticket subject, ticket ID, or customer
- Filter by status and priority
- See ticket and customer totals from the API
- Open a ticket conversation
- Reply to a customer
- Add a private internal note
- Change ticket status
- Change ticket priority
- Run **Analyze with AI** on a real ticket

The agent workspace does not use a general chatbot. The main AI feature for agents is the ticket analysis action inside a ticket.

### Admin workspace

Administrators can:

- Log in through a private admin account
- View users from MongoDB
- View real tickets from the API
- See customer and agent counts
- See active and resolved ticket counts
- Search users and tickets
- Change a user's role
- Suspend or activate a user
- View category counts based on ticket data

Agent and admin accounts are not created from the public registration form.

## Frontend technology

The frontend uses:

- React 19
- Vite
- React Router
- Tailwind CSS 4
- JavaScript and JSX
- Context API for authentication state
- Fetch API for backend requests

There is no fake frontend database. The customer, agent, and admin pages use the backend API for their important data.

## Frontend structure

```text
frontend/
├── public/
├── src/
│   ├── api.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   ├── main.jsx
│   ├── assets/
│   ├── components/
│   │   ├── ChatAssistant.jsx
│   │   ├── Navbar.jsx
│   │   └── footer.jsx
│   ├── context/
│   │   ├── AuthContext.js
│   │   ├── AuthContext.jsx
│   │   └── useAuth.js
│   ├── layouts/
│   └── pages/
│       ├── About.jsx
│       ├── Admin.jsx
│       ├── Agent.jsx
│       ├── Customer.jsx
│       ├── Home.jsx
│       ├── Login.jsx
│       └── Register.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Important frontend files

### `src/main.jsx`

This is the frontend entry point. It imports the global CSS and places the React app inside `AuthProvider`.

The authentication provider makes the logged-in user available to all pages.

### `src/App.jsx`

This file defines the main routes:

```text
/          Public home page
/about     About page
/login     Login page
/register  Customer registration page
/customer  Customer workspace
/agent     Agent workspace
/admin     Admin workspace
```

The customer, agent, and admin routes are protected. A user without a valid token is sent to the login page. A logged-in customer cannot open the agent or admin route by typing the URL.

### `src/api.js`

This file contains the shared API request helper.

It does three important things:

1. Builds the backend URL from `VITE_API_URL`.
2. Reads the JWT token from local storage.
3. Adds the token to the `Authorization` header.

Example request:

```js
apiRequest("/tickets?limit=50")
```

The helper also reads backend error messages and throws them so the pages can show useful feedback to the user.

### `src/context/AuthContext.jsx`

This context stores the current user and provides:

- `login()`
- `register()`
- `logout()`
- `user`
- `loading`

After login, the token is stored in local storage and the user is redirected based on the role returned by the backend:

```text
customer -> /customer
agent    -> /agent
admin    -> /admin
```

The frontend does not trust a role typed by the user. The backend creates the token and the protected API checks the role again.

## How the frontend connects to the backend

The normal data flow is:

```text
User clicks a button
        |
        v
React page calls apiRequest()
        |
        v
Express API checks JWT and role
        |
        v
Mongoose reads or writes MongoDB
        |
        v
Express returns JSON
        |
        v
React updates the page state
```

For example, when a customer creates a ticket:

```text
Customer form
    -> POST /api/tickets
    -> Express validates the request
    -> Mongoose creates a Ticket document
    -> MongoDB Atlas stores the ticket
    -> API returns the saved ticket
    -> Customer page reloads the ticket list
```

When an agent opens the queue:

```text
Agent page
    -> GET /api/tickets
    -> Backend checks the agent JWT
    -> Backend finds assigned and unassigned tickets
    -> MongoDB returns ticket documents
    -> Frontend displays the real queue
```

## Authentication flow

### Registration

The registration page sends:

```json
{
  "name": "Customer Name",
  "username": "customer_username",
  "email": "customer@example.com",
  "password": "private-password"
}
```

The backend always creates this public account with the role `customer`.

### Login

The login page sends the email or username and password to:

```text
POST /api/auth/login
```

The backend:

1. Finds the user in MongoDB.
2. Compares the password with the bcrypt hash.
3. Creates a JWT token.
4. Returns the user role.

The frontend then redirects the user to the correct protected workspace.

### Logout

Logout removes the token and saved user information from local storage. The user is then returned to the public home page.

## Ticket and AI flow

The main AI feature is not a random chatbot. It is connected to a real ticket.

The flow is:

```text
Customer creates a ticket
        |
        v
Agent opens the ticket
        |
        v
Agent clicks Analyze with AI
        |
        v
POST /api/tickets/:id/ai-analysis
        |
        v
Backend loads the ticket from MongoDB
        |
        v
Backend sends ticket context to OpenAI
        |
        v
Backend returns structured analysis
        |
        v
Agent sees the summary and recommendations
```

The ticket context includes:

- Subject
- Description
- Category
- Current priority
- Current status
- Recent visible conversation

The result contains:

- Summary
- Suggested category
- Suggested priority
- Sentiment
- Suggested response
- Recommended next action

The OpenAI key is never used in the browser. It stays in the backend environment file.

If there is no OpenAI key, the backend returns a local fallback response. This is useful for local development and prevents unexpected API charges.

## Customer assistant

The customer dashboard has a separate support assistant. It is for general questions such as:

- Login help
- Billing guidance
- Ticket status questions
- Account support guidance

The customer assistant calls:

```text
POST /api/ai/chat
```

The backend allows this endpoint for customers only. Agents do not use this general chat. Agents use the ticket analysis feature instead.

## Environment variables

For local development, create:

```text
backend/.env
```

The frontend can use an optional `frontend/.env.local` file:

```env
VITE_API_URL=http://localhost:5000/api
```

If `VITE_API_URL` is not set, the frontend uses:

```text
http://localhost:5000/api
```

Never put these values in the frontend:

- MongoDB password
- JWT secret
- OpenAI API key
- Staff password

These belong only in the backend environment.

## Install and run locally

From the project root, open two terminals.

### Backend terminal

```powershell
cd backend
npm install
npm run dev
```

The backend should print:

```text
MongoDB connected
SyncBot API listening on http://localhost:5000
```

### Frontend terminal

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Frontend commands

Install packages:

```powershell
npm install
```

Start the Vite development server:

```powershell
npm run dev
```

Create a production build:

```powershell
npm run build
```

Run ESLint:

```powershell
npm run lint
```

Preview the production build:

```powershell
npm run preview
```

Run the frontend automated tests:

```powershell
npm test
```

The frontend test file is `src/pages/Login.test.jsx`. It checks that:

- Login sends the entered username and password to the auth context.
- An authentication error is shown to the user when login fails.

The frontend tests use Vitest, Testing Library, and jsdom. These are small component tests focused on an important user flow.

## Backend API used by the frontend

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/users/me
```

### Customer tickets

```text
POST /api/tickets
GET  /api/tickets
GET  /api/tickets/:id
POST /api/tickets/:id/messages
```

### Agent actions

```text
GET   /api/tickets
PATCH /api/tickets/:id
POST  /api/tickets/:id/messages
POST  /api/tickets/:id/notes
POST  /api/tickets/:id/ai-analysis
```

### Admin actions

```text
GET   /api/admin/users
PATCH /api/admin/users/:id
GET   /api/tickets
GET   /api/categories
```

### AI

```text
POST /api/ai/chat
POST /api/tickets/:id/ai-analysis
```

## Styling and layout

The project uses Tailwind CSS 4 with the Vite plugin.

The global styles are in:

```text
src/index.css
```

The main layout rules include:

- A shared centered page container
- Responsive spacing on mobile and desktop
- Protected dashboard layouts
- Text wrapping for long ticket and AI content
- Reduced motion support
- Responsive mobile navigation
- Dark action buttons and clear status colors

The public pages use broader sections and stronger borders. Dashboard pages use denser layouts because agents and admins need to scan information quickly.

## Database connection

The frontend never connects directly to MongoDB. This is important for security.

The correct connection path is:

```text
React frontend
    -> Express backend
    -> Mongoose
    -> MongoDB Atlas
```

MongoDB credentials are only read by the backend through `MONGO_URI`.

The main collections are:

### `users`

Contains:

- Name
- Username
- Email
- Hashed password
- Role
- Active status
- Created date

### `tickets`

Contains:

- Ticket number
- Subject
- Description
- Contact information
- Category
- Priority
- Status
- Customer reference
- Agent reference
- Conversation messages
- Created and updated dates

Internal messages use `kind: "note"` and are filtered from customer responses.

## Security notes

- Passwords are hashed with bcrypt.
- JWT tokens are checked by the backend.
- Customer registration can only create customers.
- Agent and admin routes are protected.
- Internal notes are not shown to customers.
- MongoDB credentials stay on the backend.
- OpenAI credentials stay on the backend.
- Environment files are ignored by Git.
- Input is checked before creating or updating tickets.

## Deployment

### Deploy the backend

The backend can be deployed to Render, Railway, or another Node hosting service.

For Render:

1. Push the complete repository to GitHub.
2. Create a new Web Service.
3. Select the repository.
4. Set the root directory to `backend`.
5. Use `npm install` as the build command.
6. Use `npm start` as the start command.
7. Add the backend environment variables in the hosting dashboard.

Important variables:

```env
PORT=5000
CLIENT_URL=https://your-frontend-domain.vercel.app
JWT_SECRET=your-production-secret
MONGO_URI=your-atlas-connection-string
OPENAI_API_KEY=your-openai-key-if-used
OPENAI_MODEL=gpt-4o-mini
```

Do not upload the real `.env` file to GitHub. Add the values directly in Render's environment settings.

### Deploy the frontend

The frontend can be deployed to Vercel or Netlify.

For Vercel:

1. Create a project from the GitHub repository.
2. Set the root directory to `frontend`.
3. Add this environment variable:

```env
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

4. Deploy the project.
5. Copy the final frontend URL.
6. Set that URL as `CLIENT_URL` in the backend hosting settings.
7. Restart or redeploy the backend.

The frontend must point to the deployed backend, not `localhost`.

## Private staff accounts

Agent and admin accounts are created privately. They are not displayed on the login page and they are not available through public registration.

From the backend folder, use the staff creation command with temporary environment variables:

```powershell
npm run create-staff
```

After creating the account, remove the staff password variables. The stored password is a bcrypt hash.

## Known limitations

- The current automated tests cover the main login flow and important backend ticket permissions. More component and end-to-end tests can be added later.
- File attachments are not fully connected to cloud storage.
- Full admin category creation and deletion should be moved to persistent API endpoints.
- Email notifications are not included yet.
- AI output should be checked by an agent before being sent to a customer.

## AI build log

GitHub Copilot was used as a development assistant.

It helped with:

- Planning the React and Express structure
- Creating authentication and role middleware
- Connecting frontend pages to API routes
- Creating MongoDB schemas
- Building the ticket analysis endpoint
- Improving responsive layout and text wrapping
- Writing setup and deployment documentation

The generated code was reviewed and changed manually. During development, I fixed:

- Dummy ticket data in customer and agent workflows
- Missing role-based route protection
- MongoDB environment file location problems
- Text overflow inside ticket and AI cards
- Agent and customer AI behavior being mixed together
- Admin data not loading from MongoDB
- Public display of staff credentials

The project was checked with frontend build and lint commands, backend syntax checks, MongoDB connection checks, and manual customer-to-agent ticket tests.
