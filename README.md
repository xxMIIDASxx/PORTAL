# EMSI PORTAL Student Portal

A modern, integrated student ecosystem built with React, Vite, and Django.

## Prerequisites
- Node.js (v18 or higher)
- Python 3.10+ (for backend)

## Running the Project Locally

### 1. Setup the Backend
Navigate to the project root and set up the virtual environment, then start the Django server:
```powershell
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies and run migrations
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
cd backend
python manage.py migrate
python manage.py runserver
```
The backend should now be running at `http://127.0.0.1:8000`.

### 2. Setup the Frontend
Open a new terminal window, navigate to the `frontend` directory, install dependencies, and start the Vite development server:
```powershell
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## Features
- Role-based access (Student, Teacher, Admin).
- Interactive weekly schedule.
- Grade tracking with Year/Semester filtering.
- Absence justification workflow.
- Notification broadcasting and management.
- Administrative document requests.

## Technologies Used
- React 19
- Vite
- Axios
- Lucide React
- Django REST Framework

<div align="center">
  <p>EMSI PORTAL</p>
  <p>Made by: Owais BAKKALI, Amjad AHRRAR, Amine HABZ, Bachar DOUKHANA, Bilal MESBAHI.</p>
</div>"# EMSI-PORTAL" 
