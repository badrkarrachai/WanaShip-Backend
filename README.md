# WanaShip-Backend

![github-icon](https://github.com/user-attachments/assets/9e3ef174-0b83-4d34-9c0f-33477d8a298c)

WanaShip-Backend is the server-side component of the WanaShip application, a modern shipping and parcel management system. This Node.js backend provides robust APIs for user management, parcel tracking, and shipping operations.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.16.0-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18.2-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0-green.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Features

- **User Authentication**: Secure login and registration system with JWT
- **Parcel Management**: Create, update, and track parcels
- **Address Management**: Manage shipping and receiving addresses
- **Media Handling**: Upload and manage images for parcels and user profiles
- **OAuth Integration**: Sign in with Google and Discord
- **Role-Based Access Control**: Differentiate between user types (e.g., customers, admins)

## 🛠 Tech Stack

- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **MongoDB**: Database
- **Mongoose**: ODM for MongoDB
- **TypeScript**: Programming language
- **JWT**: Authentication
- **Multer**: File upload handling
- **Cloudinary**: Cloud storage for media files

## 🏗 Project Structure

src/
--- config/
--- controllers/
--- interfaces/
--- middleware/
--- models/
--- routes/
--- services/
--- utils/
--- app.ts

## 🚦 Getting Started

1. **Clone the repository**
git clone https://github.com/badrkarrachai/WanaShip-Backend.git
Copy
2. **Install dependencies**
cd WanaShip-Backend
npm install
Copy
3. **Set up environment variables**
Create a `.env` file in the root directory and add the following:
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

4. **Run the application**
npm run dev

## 📚 API Documentation

(Include links to your API documentation or describe key endpoints here)

## 🧪 Testing

Run the test suite with:
npm test

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/badrkarrachai/WanaShip-Backend/issues).

## 📝 License

This project is [MIT](LICENSE) licensed.

## 👨‍💻 Author

**Badr Karrachai**

- GitHub: [@badrkarrachai](https://github.com/badrkarrachai)
- LinkedIn: [Badr Karrachai](https://www.linkedin.com/in/badrkarrachai/)

---

Made with ❤️ for WanaShip
