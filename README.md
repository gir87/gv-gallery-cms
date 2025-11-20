# GV Gallery CMS

A minimalist, high-performance photography portfolio with a built-in Content Management System (CMS). 

## Features

### Public Interface
*   **Masonry Grid Layout:** Responsive 3-column layout (desktop) utilizing CSS columns for true masonry flow.
*   **Lightbox:** Full-screen, immersive image viewer with keyboard navigation (Arrow Keys, Esc).
*   **Series Support:** Organize photos into specific collections/series (e.g., "Norway", "Portraits").
*   **Responsive Design:** Fully mobile-optimized with a collapsible sidebar.

### Admin Dashboard
*   **Secure Login:** PHP Session/Token-based authentication.
*   **Photo Management:**
    *   **Upload:** Client-side compression before upload to save bandwidth.
    *   **Edit:** Update titles, descriptions, tags, and series assignments.
    *   **Delete:** Removes entries from Database and files from Server.
*   **Series Management:** Create and delete photo series.
*   **Settings:** Change admin password directly from the dashboard.

---

## Installation Guide

This application is designed to run on standard shared web hosting (Apache/Nginx) with PHP and MySQL.

### Prerequisites
*   Node.js (for building the frontend locally)
*   Web Hosting with PHP 7.4+ and MySQL/MariaDB

### Step 1: Database Setup
1.  Log in to your hosting control panel (e.g., cPanel, phpMyAdmin).
2.  Create a new MySQL Database and User.
3.  Open the file `init/create_tables.sql` located in this project.
4.  Run the SQL content in phpMyAdmin to create the required tables (`users`, `photos`, `series`) and the default admin user.

### Step 2: Backend Setup
1.  Open `init/api.php` in a text editor.
2.  Edit the **Database Connection** section at the top with your actual database credentials:
    ```php
    $host = 'localhost';
    $db   = 'your_database_name';
    $user = 'your_database_user';
    $pass = 'your_database_password';
    ```
3.  Connect to your web server via FTP or File Manager.
4.  Upload `api.php` to your `public_html` (root) folder.
5.  Create a folder named `uploads` in `public_html`.
6.  **Important:** Set permissions for the `uploads` folder to `755` or `777` to ensure PHP can save images there.

### Step 3: Frontend Build & Deploy
1.  Open your terminal in this project folder.
2.  Run `npm install` to install dependencies.
3.  Run `npm run build` to compile the React application.
4.  Open the newly created `dist` folder.
5.  Upload **all files** inside `dist` (index.html, .js files, .css files) to your server's `public_html` folder.

### Directory Structure on Server
After installation, your server should look like this:
```
/public_html
  ├── api.php
  ├── index.html
  ├── index-xxxxx.js
  ├── index-xxxxx.css
  └── /uploads
      ├── photo1.jpg
      └── photo2.jpg
```

---

## Usage

1.  Navigate to your website: `https://your-domain.com`
2.  Click **Admin Area** in the sidebar.
3.  **Default Credentials:**
    *   Username: `admin`
    *   Password: `gvgallery123`
4.  **Security Warning:** Immediately go to the **Settings** tab in the dashboard and change your password.
