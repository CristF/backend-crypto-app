import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import userRoute from './api/routes/user.js'
import cryptoRoute from './api/routes/crypto.js'
import axios from 'axios'

dotenv.config()

const app = express()

// Add environment logging
console.log('Current environment:', process.env.NODE_ENV);
console.log('Server starting...');

// Middleware - Must be before routes


app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

const allowedOrigins = [
  //'https://crypto-tracker-cis-fcf43f67a29f.herokuapp.com',
  'https://crypto-app-frontend-ouiis.ondigitalocean.app/',
  'https://crypto-app-backend-izkoy.ondigitalocean.app/',
  'http://localhost:5173', // vite default port
  /^http:\/\/localhost:\d+$/, // Allows localhost for development
];

app.use(helmet())
app.use(express.json())
app.use(cors({
  origin: allowedOrigins,
  //methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  //optionsSuccessStatus: 200
}));
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
// app.use((req, res, next) => {
//   console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`)
//   next()
// });

// Add OPTIONS handling for preflight requests
// app.options('*', cors());



// Routes
app.use('/api/user', userRoute)
app.use('/api/crypto', cryptoRoute)

app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    message: 'Crypto Tracker API is running',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// MongoDB Connection
mongoose.connect(process.env.URI)
  .then(() => {
    console.log('MongoDB Connected Successfully')
    console.log('Database Name:', process.env.DB_NAME)
  })
  .catch(err => console.error('MongoDB connection error:', err))


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
      message: err.message || 'Internal server error'
  })
})



const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
