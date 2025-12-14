# 🌍 NGO Impact Reporting System

A full-stack web application that enables NGOs to submit monthly impact reports (individually or in bulk) and allows administrators to track and analyze aggregated impact metrics through a dashboard.

This system is built with scalability in mind and supports **asynchronous CSV processing**, **partial failure handling**, and **idempotent data writes**.

---

## 🚀 Live Demo

🔹 **Frontend (Vercel)**  
👉 https://ngo-impact-reporting.vercel.app/

🔹 **Backend (Render)**  
👉 https://ngo-impact-backend-fqeg.onrender.com/

🔹 **Health Check**  
👉 https://ngo-impact-backend-fqeg.onrender.com/health

---

## 🧩 Features

### ✅ NGO Report Submission
- Submit monthly reports via a simple form
- Fields include:
  - NGO ID
  - Month (YYYY-MM)
  - People Helped
  - Events Conducted
  - Funds Utilized

### ✅ Bulk CSV Upload (Asynchronous)
- Upload CSV files containing multiple reports
- Backend processes data in the background
- Returns a **Job ID** immediately
- Track progress via job status endpoint

### ✅ Job Tracking
- Total rows
- Processed rows
- Successful rows
- Failed rows
- Error logs for invalid rows

### ✅ Admin Dashboard
- View aggregated data by month:
  - Total NGOs reporting
  - Total people helped
  - Total events conducted
  - Total funds utilized

### ✅ Production-Ready Design
- Idempotency (no duplicate reports)
- Partial failure handling
- Proper error responses
- Cloud deployment

---


## 🏗️ System Architecture

![System Architecture](docs/architecture.png)

---

## 🛠 Tech Stack

### Frontend
- React (Vite)
- JavaScript
- Fetch API
- Component-based architecture

### Backend
- Node.js
- Express.js
- PostgreSQL
- Multer (file uploads)
- csv-parser (CSV ingestion)

### Infrastructure
- **Vercel** – Frontend hosting
- **Render** – Backend hosting
- **Supabase** – PostgreSQL database (connection pooler)

---

## 🔗 API Endpoints

### ➕ Submit Single Report

### 📂 Upload CSV (Async)

### ⏱️ Check Job Status

### 📊 Dashboard Aggregation

---

## 🗄️ Database Design (Key Tables)

### `reports`
- `ngo_id`
- `month`
- `people_helped`
- `events_conducted`
- `funds_utilized`
- **Unique constraint:** `(ngo_id, month)`

### `jobs`
- `id`
- `total_rows`
- `processed_rows`
- `success_rows`
- `failed_rows`
- `status`
- `error_log`

---

## ⚙️ Local Setup

### Clone Repository
```bash
git clone https://github.com/Moheed07/ngo-impact-reporting.git
cd ngo-impact-reporting

### Backend Setup
cd backend
npm install
npm start

### Frontend Setup
cd frontend
npm install
npm run dev

### 🔐 Environment Variables (Backend)
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require
NODE_TLS_REJECT_UNAUTHORIZED=0

---

###🧠 Key Engineering Decisions

- Asynchronous CSV processing to avoid blocking requests
- Idempotent database writes using unique constraints
- Job-based progress tracking for long-running tasks
- Separation of concerns between frontend, backend, and database
- Production debugging of TLS, IPv6, and cloud networking issues

###🔮 Future Improvements

- Authentication & role-based access control
- Retry logic for failed CSV rows
- Pagination & filters in dashboard
- Background job queues (Redis + BullMQ)
- Structured logging & monitoring
- Dockerized deployment

###🤖 AI Assistance

- AI tools were used to:
- Debug deployment and networking issues
- Validate architectural decisions
- Improve error handling and robustness

### 📌 Author

Moheed Nawaaz
Computer Science Graduate | Aspiring SDE

### 🏁 Final Notes

- This project demonstrates:
- Real-world CRUD operations
- Asynchronous backend processing
- Production deployment & debugging
- Cloud networking and database integration