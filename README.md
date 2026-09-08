# Professional Portfolio & CMS

This project is a fully-featured, dynamically-driven professional portfolio website bundled with a custom-built Content Management System (CMS) Admin Dashboard. 

## 🌟 Features
- **Dynamic Frontend**: Modern, beautiful portfolio with sleek animations and a smooth glassmorphic design.
- **Project CMS**: Fully functioning admin portal to add, edit, delete, publish, and order projects directly from a database without ever editing HTML again.
- **REST API**: Built with Node.js and Express to handle CRUD operations safely.
- **Secure Authentication**: JWT-based secure login for the admin portal.
- **Dockerized Architecture**: Runs effortlessly using `docker-compose`, proxying backend API routes through an Nginx reverse proxy.

## 📂 Project Structure

```
portfolio/
├── frontend/
│   ├── public/       # Static assets like images and animation frames
│   ├── pages/        # Public HTML pages (index, about, projects, etc.)
│   ├── css/          # Stylesheets
│   └── js/           # Frontend javascript logic
│
├── admin/
│   ├── pages/        # Admin portal HTML (login, dashboard)
│   ├── css/          # Admin-specific styling
│   └── js/           # Admin-specific logic (API calls, forms)
│
├── backend/
│   ├── src/
│   │   ├── config/   # Database initialization and config
│   │   ├── routes/   # Express API routes
│   │   ├── controllers/# API logic handlers
│   │   ├── middleware/# JWT Auth and Multer Upload middleware
│   │   └── app.js    # Entry point for backend
│   └── package.json
│
├── docker/           # Configuration files for Docker (Nginx and Dockerfiles)
└── docker-compose.yml
```

## 🚀 Setup & Local Development

This project uses Docker to make startup incredibly simple. 

### Prerequisites
- Docker & Docker Compose must be installed on your machine.

### Running the Application
To build and start the database, backend API, and frontend server, run the following from the root directory:

```bash
docker-compose up --build -d
```

### 🔗 Localhost URLs
Once the containers are running, you can access the application at:

- **Public Portfolio:** [http://localhost:8080/](http://localhost:8080/)


## ⚙️ Environment Variables
An `.env.example` file is included in the root directory. You can create an `.env` file to customize:
- `PORT` (default: 8000)
- `SECRET_KEY` (JWT signature key)
- `DATABASE_URL` (PostgreSQL connection string)

## 📦 API Overview
All API requests are prefixed with `/api`.
- `POST /api/admin/login` - Authenticate admin
- `GET /api/projects` - Get all published projects (Public)
- `GET /api/admin/projects` - Get all projects (Admin)
- `POST /api/admin/projects` - Create a project
- `PUT /api/admin/projects/:id` - Edit a project
- `DELETE /api/admin/projects/:id` - Delete a project
