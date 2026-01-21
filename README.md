# Chitfunds Management System

A comprehensive web application designed to manage chit fund operations, including member management, scheme tracking, automated payment processing, and document generation.

## 🚀 Project Overview

This project consists of two main components:
1. **Backend**: A robust API built with Node.js, Express, and MongoDB.
2. **Frontend**: A modern, responsive user interface built with Next.js 15, Material UI, and Tailwind CSS.

---

## 🛠️ Backend (Express & MongoDB)

The backend provides the core logic and data management for the system.

### Key Features
- **Authentication**: JWT-based secure authentication with multiple roles.
- **Member Management**: Track member details, profiles, and associated chits.
- **Chit Management**: Create and manage different chit schemes.
- **Payment Processing**: Handle online and cash payments with automated due date and status tracking.
- **Document Generation**: Automated generation of Welcome Letters and Invoices using PDFKit.
- **Reporting**: Export payment data to Excel using ExcelJS.
- **Notifications**: Automated email notifications with PDF attachments via NodeMailer.

### Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JsonWebToken (JWT), Bcrypt
- **PDF Generation**: PDFKit
- **Excel Handling**: ExcelJS
- **Validation**: Zod
- **Logging/Monitoring**: Morgan, Helmet

### Getting Started (Backend)
1. Navigate to the `backend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   SMTP_HOST=your_smtp_host
   SMTP_PORT=your_smtp_port
   SMTP_USER=your_email
   SMTP_PASS=your_password
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 💻 Frontend (Next.js & MUI)

The frontend provides an intuitive dashboard for admins and employees to manage funds.

### Key Features
- **Responsive Dashboard**: At-a-glance view of transaction summaries and monthly collections.
- **Member Directory**: Detailed member views with profile management and chit summaries.
- **Chit Cards**: Visual representation of chit details including scheme images.
- **Payment Portal**: Interface for processing and tracking payments.
- **PDF Previews**: Direct links to view and download generated invoices and letters.
- **Image Uploads**: Integration with Supabase Storage for transaction proofs and chit images.

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **UI Library**: Material UI (MUI), Lucide Icons
- **Styling**: Tailwind CSS
- **State/Data**: React 19 Hooks, Axios
- **Storage**: Supabase Client
- **Animations**: Framer Motion / React CountUp

### Getting Started (Frontend)
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with the following variables:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 📂 Project Structure

```
chitfunds/
├── backend/            # Express.js API
│   ├── controllers/    # API controllers
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routes
│   └── utils/          # PDF/Excel/Email utilities
├── frontend/           # Next.js Application
│   ├── src/app/        # App router pages
│   ├── src/components/ # Shared UI components
│   └── src/config/     # External service configurations
└── README.md           # Main documentation
```

---

## 📄 License
This project is licensed under the ISC License.
