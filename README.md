# 🏨 StayVista — Hyper-Personalised Hospitality OS

<div align="center">

![StayVista Logo](./client/public/Icon.ico)

**Craft ultra-luxury guest journeys, orchestrate multi-property operations, and unlock revenue intelligence from a single platform.**

[![React](https://img.shields.io/badge/React-18%20→%2019-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-success.svg)](https://www.mongodb.com/atlas)
[![Express.js](https://img.shields.io/badge/Express.js-4.18-lightgrey.svg)](https://expressjs.com/)
[![Material UI](https://img.shields.io/badge/MUI-7.x-purple.svg)](https://mui.com/)

[Project Story](#-vision--brand) • [Feature Map](#-platform-capabilities) • [Quick Start](#-quick-start) • [Architecture](#-solution-architecture)

</div>

---

## 📌 TL;DR

- **Luxury guest web app (`client/`)** with curated collections, concierge storytelling, and seamless bookings.
- **Next-gen admin workspace (`admin_v2.0/`)** delivering live revenue telemetry, transaction intelligence, and portfolio management.
- **Legacy dashboard (`admin_v1.0/`)** retained for teams migrating gradually.
- **Modular Express API (`api/`)** with hardened middleware, analytics aggregations, and Cloudinary-powered media ops.

---

## 🧭 Table of Contents

- **[Vision & Brand](#-vision--brand)**
- **[Platform Capabilities](#-platform-capabilities)**
- **[Solution Architecture](#-solution-architecture)**
- **[Technology Stack](#-technology-stack)**
- **[Quick Start](#-quick-start)**
- **[Environment Setup](#-environment-setup)**
- **[Module Deep Dive](#-module-deep-dive)**
- **[API Surface](#-api-surface)**
- **[Security & Reliability](#-security--reliability)**
- **[Performance Toolkit](#-performance-toolkit)**
- **[Contributing](#-contributing)**
- **[License & Credits](#-license--credits)**

---

## 🎨 Vision & Brand

StayVista is built for hospitality teams who obsess over ritual-driven guest experiences. Every screen adheres to a **calm, editorial aesthetic** with:

- **Signature storytelling** in landing flows (`client/src/pages/home/Home.jsx`).
- **Premium typographic rhythm** and cinematic photography to set a luxury tone.
- **Human-led concierge prompts** that echo the brand’s “always-on” service philosophy.

---

## 🚀 Platform Capabilities

- **Guest Experience OS**
  - Editorial discovery galleries, lifestyle collections, and dynamic availability (`client/`).
  - Secure booking pipeline backed by real-time room statuses and transaction history.
- **Operations Control Tower**
  - `admin_v2.0/` surfaces instant KPIs, booking funnels, and transaction health (`admin_v2.0/src/pages/stats/Stats.jsx`).
  - Role-aware workflows for hotel admins, super admins, and concierge teams.
- **Revenue Intelligence**
  - Aggregated analytics via `/api/analytics/summary` combine bookings, transactions, and performance baselines (`api/controllers/analytics.controller.js`).
  - Automated classification of booking and payment states for accurate dashboards (`admin_v2.0/src/pages/stats/Stats.jsx`).
- **Media & Content Engine**
  - Cloudinary-backed uploads for hotels and rooms with curated asset guidelines (`api/routes/uploads.routes.js`).

---

## 🏗️ Solution Architecture

```mermaid
flowchart LR
  Guest((Guest Web App)) -- HTTPS --> API[Express REST API]
  Admin((Admin v2 Workforce)) -- Secure Sessions --> API
  LegacyAdmin((Admin v1)) -- Authenticated APIs --> API
  API -- Mongo ODM --> DB[(MongoDB Atlas)]
  API -- Media Uploads --> Cloudinary[(Cloudinary)]
  API -- JWT & Cookies --> Auth[(Auth Middleware)]
  subgraph Frontend
    Guest
    Admin
    LegacyAdmin
  end
  subgraph Backend
    API
  end
```

Project layout:

```
StayVista/
├── client/          # Guest-facing React 18 SPA
├── admin_v1.0/      # Legacy admin experience (React 17)
├── admin_v2.0/      # Modern admin workspace (React 19 + Vite + Tailwind)
└── api/             # Express API with analytics, bookings, media, RBAC
```

---

## 🧰 Technology Stack

- **Frontend**
  - `client/`: React 18, React Router 6, custom design system, Axios.
  - `admin_v2.0/`: React 19 + Vite, MUI 7, Tailwind utility layer, Recharts 3, resilient API hooks.
  - `admin_v1.0/`: React 17 + CRA, MUI 5, Recharts 2 (maintained for backwards compatibility).
- **Backend (`api/`)**
  - Node.js (ESM), Express 4.18, Mongoose ODM, modular controllers.
  - System middleware: JWT auth, CORS with credentials, cookie parsing, Multer uploads, Cloudinary SDK.
- **Data & Ops**
  - MongoDB Atlas clusters, Cloudinary CDN, environment-driven configuration, nodemon for DX.

---

## ⚡ Quick Start

```bash
git clone https://github.com/yourusername/stayvista.git
cd StayVista
```

### 1. API Service (`api/`)

```bash
cd api
npm install
cp .env.example .env
# set Mongo, JWT, Cloudinary credentials
npm run start
```

### 2. Guest App (`client/`)

```bash
cd ../client
npm install
cp .env.example .env
npm start            # launches on http://localhost:3000
```

### 3. Admin v2 Workspace (`admin_v2.0/`)

```bash
cd ../admin_v2.0
npm install
cp .env.example .env
npm run dev          # vite server on http://localhost:5173 (default)
```

### 4. (Optional) Legacy Admin v1 (`admin_v1.0/`)

```bash
cd ../admin_v1.0
npm install
cp .env.example .env
npm run dev          # CRA dev server on http://localhost:3001
```

> **Tip:** Run each module in its own terminal. All UIs target the API base URL defined in their respective `.env` files.

---

## 🔐 Environment Setup

- Copy `api/.env.example`, `client/.env.example`, `admin_v2.0/.env.example`, and `admin_v1.0/.env.example` before booting services.
- Required keys:
  - `MONGO`, `JWT`, `JWT_SECRET`, `PORT`, `CLIENT_URL`, `ADMIN_URL` (`api/.env`).
  - `VITE_API_BASE_URL` for `admin_v2.0/` (fallbacks to `/api`).
  - `REACT_APP_API_URL` for `client/` and `admin_v1.0/`.
- Recommended extras: enable Cloudinary credentials for media uploads and configure `NODE_ENV` for production logging control.

---

## 🔍 Module Deep Dive

- **Guest Web Application (`client/`)**
  - Immersive hero experiences, lifestyle-based property curation, property grids, editorial storytelling, and responsive design.
  - Booking flow integrates real-time availability, rate filters, and transaction history views.
- **Admin Workspace v2 (`admin_v2.0/`)**
  - Protected routes via `AuthContext` (`admin_v2.0/src/App.jsx`).
  - Advanced stats: daily revenue, booking mix, transaction health, and 6-month revenue trends.
  - Data toolbelt with logs, bookings, transactions, hotels, rooms, and user management panels.
- **Admin Dashboard v1 (`admin_v1.0/`)**
  - Original Material UI + SASS dashboard; preserved for teams that still rely on legacy workflows.
- **API Service (`api/`)**
  - Route map: `/api/auth`, `/api/users`, `/api/hotels`, `/api/rooms`, `/api/upload`, `/api/bookings`, `/api/transactions`, `/api/analytics`.
  - `api/index.js` enforces environment validation, proxy trust, and centralized error handling.
  - Analytics controller computes aggregate metrics and same-day revenue lifts.

---

## 📚 API Surface

- **Authentication**
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- **Hotels & Rooms**
  - CRUD endpoints with admin guardrails (`verifyAdmin`).
  - Media upload endpoints: `POST /api/upload/hotels` and `POST /api/upload/rooms`.
- **Bookings & Transactions**
  - `GET /api/bookings` with filter support, booking status transitions, and transaction audit trails.
  - `GET /api/transactions` with sorting, status normalization, and revenue aggregation.
- **Analytics**
  - `GET /api/analytics/summary` consolidates user, hotel, booking, transaction, and revenue streams.

---

## 🛡️ Security & Reliability

- Stateless JWT authentication + signed cookies.
- Role-based guards for admin-only surfaces and critical mutations.
- Input validation, safe file handling, and defensive error responses.
- CORS configuration tuned per client/admin domain via `CLIENT_URL` and `ADMIN_URL` env keys.
- Graceful MongoDB connection handling with disconnect resilience.

---

## ⚙️ Performance Toolkit

- Code-splitting and lazy routing for guest & admin apps.
- Cloudinary transformations for responsive image delivery.
- Indexed MongoDB collections with aggregation pipelines for analytics.
- Vite-driven HMR (admin v2) and minimal bundles for runtime efficiency.

---

## 🤝 Contributing

We’re excited to collaborate with engineers, designers, and revenue strategists.

1. **Fork** and clone the repo.
2. **Create** a feature branch: `git checkout -b feature/improve-analytics`.
3. **Commit** with clear narratives: `git commit -m "feat: surface booking funnel"`.
4. **Push** `git push origin feature/improve-analytics`.
5. **Open** a pull request describing context, screenshots, and validations.

Refer to `CONTRIBUTING.md` for coding standards and review tips.

---

## 📄 License & Credits

- Licensed under **MIT** — see [`LICENSE`](./LICENSE).
- Crafted by [Utkarsh V](https://github.com/uvongit) with contributions from the StayVista engineering guild.
- Thanks to React, Material UI, MongoDB, Cloudinary, and the wider open-source community powering modern hospitality tech.

<div align="center">

**Built with ❤️ to elevate every stay.**

[Back to Top](#-stayvista--hyper-personalised-hospitality-os)

</div>
