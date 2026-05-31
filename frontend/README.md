# CodeAlpha_EcommerceStore

## Project Overview
A full-stack e-commerce application built for the CodeAlpha Internship Task 1. This application demonstrates end-to-end web development, featuring secure user authentication, product management, and a dynamic shopping cart.

## Tech Stack
- **Frontend**: React, Vite
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Security**: JWT (JSON Web Tokens) for authentication and authorization.

## Features
- **User Authentication**: Secure Login/Registration system.
- **Role-Based Access**: Specialized views and permissions for standard users and administrators.
- **Product Management**: Admins can perform CRUD operations on the product inventory.
- **Shopping Cart**: Real-time cart state management and order processing logic.

## Installation & Setup
1. Clone the repository: 
   `git clone <your-repo-link>`
2. Install dependencies:
   - Run `npm install` inside the `/backend` folder.
   - Run `npm install` inside the `/frontend` folder.
3. Environment Variables:
   - Create a `.env` file in the `/backend` folder.
   - Add your `MONGO_URI` and `JWT_SECRET`.
4. Start the application:
   - Start the backend: `npm run dev` (or `npm start`)
   - Start the frontend: `npm run dev`