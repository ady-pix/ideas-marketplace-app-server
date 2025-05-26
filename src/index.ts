import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import './config/firebase' // Initialize Firebase Admin
import ideaRoutes from './routes/ideaRoutes'
import categoryRoutes from './routes/categoryRoutes'
import languageRoutes from './routes/languageRoutes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

console.log('=== SERVER STARTUP DEBUG ===')
console.log('Environment variables:')
console.log('- PORT:', process.env.PORT || '5000 (default)')
console.log('- MONGO_URI:', process.env.MONGO_URI ? 'Set' : '❌ NOT SET')
console.log('- CORS_ORIGINS:', process.env.CORS_ORIGINS || 'Using defaults')
console.log(
    '- FIREBASE_SERVICE_ACCOUNT_PATH:',
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? 'Set' : 'Not set'
)
console.log(
    '- FIREBASE_PROJECT_ID:',
    process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Not set'
)

// Configure CORS origins
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
    : [
          'http://localhost:5173', // Local development
          'https://www.ideady.com', // Production domain
          'https://ideady.com', // Production domain without www
          'ideas-marketplace-app-client.vercel.app', // Vercel app
      ]

console.log('🌐 CORS allowed origins:', allowedOrigins)

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    })
)
app.use(express.json())

// Add request timeout middleware
app.use((req, res, next) => {
    // Set timeout for all requests (30 seconds)
    res.setTimeout(30000, () => {
        console.log('Request timeout for:', req.method, req.path)
        if (!res.headersSent) {
            res.status(408).json({
                message: 'Request timeout. Please try again.',
                error: { type: 'TIMEOUT_ERROR' },
            })
        }
    })
    next()
})

// Add request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    if (req.method === 'POST' && req.path === '/api/ideas') {
        console.log('POST /api/ideas - Body keys:', Object.keys(req.body))
    }
    next()
})

// Routes
app.use('/api/ideas', ideaRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/languages', languageRoutes)

// Health check endpoint
app.get('/api/health', async (_, res) => {
    try {
        // Check database connection
        const dbState = mongoose.connection.readyState
        const dbStatus =
            dbState === 1
                ? 'connected'
                : dbState === 2
                ? 'connecting'
                : 'disconnected'

        res.json({
            status: 'OK',
            message: 'Ideady API is running',
            database: dbStatus,
            timestamp: new Date().toISOString(),
        })
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
})

app.get('/', (_, res) => {
    res.send('Ideady API is running')
})

// Error handling middleware
app.use(
    (
        err: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
    ) => {
        console.error('❌ Global error handler:', err.stack)
        res.status(500).json({ message: 'Something went wrong!' })
    }
)

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ideady'
console.log('🔗 Attempting to connect to MongoDB:', mongoUri)

mongoose
    .connect(mongoUri)
    .then(() => {
        console.log('✅ MongoDB connected successfully')
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`)
            console.log(`📡 API available at http://localhost:${PORT}/api`)
            console.log('=== SERVER READY ===')
        })
    })
    .catch((error) => {
        console.error('❌ MongoDB connection error:', error)
        process.exit(1)
    })
