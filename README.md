# LNS CHITFUND Management System

A comprehensive Chit Fund management application built with Node.js, Express, MongoDB, and Next.js.

## Recent Refactoring & Optimizations

### Backend (Controllers & Utilities)

- **Consolidated Business Logic**: Business logic from the service layer has been moved directly into controllers for better maintainability and simpler structure.
- **Improved Error Handling**: Standardized error handling using `next(error)` and a global error middleware.
- **Centralized Constants**: Moved hardcoded values (JWT secrets, email credentials, company info) to `backend/config/constants.js`.
- **Refactored Controllers**:
  - `adminController.js`: Standardized response formats and error handling.
  - `chitController.js`: Fixed deletion logic and standardized error propagation.
  - `memberController.js`: Improved validation and error handling.
  - `paymentsController.js`: Consolidated payment creation logic and fixed PDF buffer generation.
  - `dashboardController.js`: Optimized aggregation pipeline and removed redundant logs.
  - `reportController.js`: Standardized Excel export logic.
  - `settingsController.js`: Simplified settings management.
- **Graceful Shutdown**: Implemented signal listeners (SIGINT, SIGTERM) in `server.js` for clean server and database disconnection.
- **Cleanup**: Removed unused scripts and debug logs.

### Frontend (UI & Components)

- **CSS Consolidation**: Consolidated `mobile.css` into `globals.css` for better performance and easier styling management.
- **Shared Components**: Created `src/components/shared/StatusPill.js` and `src/utils/statusUtils.js` to reduce code duplication across Chits, Members, and Payments pages.
- **Responsive Design**: Maintained 100% desktop fidelity while ensuring full mobile responsiveness via consolidated media queries.
- **API Optimization**: Standardized API request handling and removed redundant logs in `src/config/api.js`.

## Tech Stack

- **Backend**: Node.js, Express.js, MongoDB (Mongoose)
- **Frontend**: Next.js, React, Tailwind CSS, Material UI (MUI)
- **Utilities**: PDFKit (Invoices/Reports), ExcelJS (Data Export), Gmail API (OAuth2 Email)

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Gmail API Credentials (for email notifications)

### Installation

1. **Clone the repository**
2. **Setup Backend**:
   ```bash
   cd backend
   npm install
   cp .env.example .env # Fill in your environment variables
   npm run dev
   ```
3. **Setup Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Environment Variables (.env)

| Variable | Description |
|----------|-------------|
| `PORT` | Backend server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT authentication |
| `GOOGLE_CLIENT_ID` | Gmail API Client ID |
| `GOOGLE_CLIENT_SECRET` | Gmail API Client Secret |
| `GOOGLE_REFRESH_TOKEN` | Gmail API Refresh Token |
| `FROM_EMAIL` | Sender email address |

## License
MIT
