
// backend/src/app.js (or server.js) - Updated to include new routes
// Assuming you have a main app file; add these lines

const express = require('express');
const cors = require('cors'); // npm i cors if not installed
const errorHandler = require('./middleware/errorHandler');
const midiRoutes = require('./routes/midiRoutes');
const chatRoutes = require('./routes/chatRoutes'); // New import

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Enable CORS for frontend
app.use(express.json({ limit: '10mb' })); // For base64 payloads
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', midiRoutes); // Existing manual converter routes
app.use('/api', chatRoutes); // New chat and upload routes

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});