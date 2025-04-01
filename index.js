import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import userRoute from './api/routes/user.js'

dotenv.config()

const app = express()

// Add environment logging
console.log('Current environment:', process.env.NODE_ENV);
console.log('Server starting...');

// Middleware - Must be before routes
app.use(cors({
  origin: ['https://crypto-tracker-cis-d64ce5805b03.herokuapp.com', 'http://localhost:5000', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`)
  next()
});

// Add OPTIONS handling for preflight requests
app.options('*', cors());

// Add health check route before other routes
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Routes
app.use('/api/user', userRoute)

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

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Crypto Tracker API is running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
