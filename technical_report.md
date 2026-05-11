# EMSI PORTAL - Technical Report

## Overview
The EMSI PORTAL is a comprehensive, modern web application designed to integrate and streamline the student ecosystem at EMSI. It provides dedicated interfaces for Students, Teachers, and Administrators, facilitating efficient management of academic records, schedules, notifications, and administrative document requests.

## Architecture & Technology Stack
The application is built using a modern, decoupled architecture:

### Frontend
- **Framework**: React 19 with Vite for lightning-fast bundling and Hot Module Replacement (HMR).
- **Routing**: React Router DOM for seamless Single Page Application (SPA) navigation.
- **Styling**: Vanilla CSS utilizing modern variables and a "Glassmorphism" aesthetic, updated to a clean, light-mode green theme.
- **Icons**: Lucide React for consistent, crisp SVG iconography.
- **Data Fetching**: Axios for robust API communication.
- **Avatars**: Integration with DiceBear API to generate dynamic, consistent profile avatars.

### Backend (Integrated Context)
- **Framework**: Django REST Framework (DRF) serving JSON APIs.
- **Database**: SQLite (Development).
- **Authentication**: Session/Token management (handled via API endpoints, with a role-switcher for local demo purposes).

## Key Technical Capabilities

### 1. Multi-Role Dashboard System
The portal dynamically renders distinct views based on the user's role:
- **Student Dashboard**: Access to weekly schedules, report cards with dynamic year/semester filtering, absence justifications, and document requests.
- **Teacher Dashboard**: Calendar event creation, notification broadcasting, and student grade overview.
- **Admin Dashboard**: Global announcements, student directory management, and centralized validation for absence justifications and document requests.

### 2. Dynamic Data Filtering
The application implements client-side data processing to handle complex academic structures. The Report Card module intelligently maps available academic years to their corresponding semesters, dynamically updating dropdowns and preventing users from accessing unavailable future data.

### 3. Asynchronous Operations
All interactions (fetching schedules, sending notifications, deleting alerts, submitting absence justifications) are handled asynchronously using Axios, ensuring the UI remains responsive. The notification system includes optimistic UI updates for seamless deletion.

### 4. Responsive & Accessible UI
The CSS architecture relies on Flexbox and CSS Grid to ensure the application scales gracefully. The design overhaul to a green-themed light mode significantly improves accessibility, contrast, and visual comfort.

## Future Scalability
The frontend architecture (`api.js` client) allows for easy environment swapping between development and production backends. The modular component structure (`RoleSwitcher`, `Sidebar`, `*Dashboard`) ensures that new roles or features can be integrated predictably without affecting existing modules.
