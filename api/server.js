import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(helmet())
app.use(express.json())

// MongoDB Connection
mongoose.connect(process.env.URI)
  .then(() => {
    console.log('MongoDB Connected Successfully')
    console.log(`Mongoose Version: ${mongoose.version}`)
  })
  .catch(err => console.error('MongoDB connection error:', err))

sample_mflix.user.find()
// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Crypto Tracker API is running' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
