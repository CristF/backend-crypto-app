import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()

// Middleware
app.use(cors())
app.use(helmet())
app.use(express.json())

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'Crypto Tracker API is running' })
})

const PORT = 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})