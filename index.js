import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import userRoute from './api/routes/user.js'

dotenv.config()

const app = express()

// Middleware - Must be before routes
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/user', userRoute)

// MongoDB Connection
mongoose.connect(process.env.URI)
  .then(() => {
    console.log('MongoDB Connected Successfully')
    console.log('Database Name:', process.env.DB_NAME)
  })
  .catch(err => console.error('MongoDB connection error:', err))

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Crypto Tracker API is running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
