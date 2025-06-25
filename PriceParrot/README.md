# PriceParrot App

A full-stack application for price comparison and product reviews.

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+ recommended)
- [MySQL](https://www.mysql.com/) 


### 2. Set Up Environment Variables
- Copy `.env.example` to `.env` and fill in your values:
  ```
  cp .env.example .env
  ```
- Edit `.env` with your database credentials and a strong JWT secret.

### 3. Set Up the Database
- Open a terminal and run:
  ```
  mysql -u root -p < priceparrot_backup.sql
  ```
  - This will create the `priceparrot` database and all tables/data.


### 4 Install Dependencies
- In the project root (and in `/Backend`):
  ```
  npm install

  ```

### 5. Start the Backend
- In the `/Backend` folder:
  ```
  npm start
  ```

### 7. Start the Frontend
- In the frontend folder (often `/src` or project root):
  ```

  npm run dev
  ```

### 8. Access the App
- Open your browser and go to the URL shown in the terminal (e.g., `http://localhost:3000` or `http://localhost:3002`).

---

## 🛠 Troubleshooting
- **Database connection errors:** Check your `.env` values and that MySQL is running.
- **Port in use:** Change the `PORT` value in `.env`.
- **Network errors:** Make sure backend and frontend are both running and using the correct URLs.

