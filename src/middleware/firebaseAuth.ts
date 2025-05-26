import { Request, Response, NextFunction } from 'express'
import admin from '../config/firebase'

export interface AuthenticatedRequest extends Request {
    user?: admin.auth.DecodedIdToken
}

export const authenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        console.log('=== AUTH MIDDLEWARE DEBUG ===')
        console.log(
            'Headers:',
            req.headers.authorization
                ? 'Authorization header present'
                : 'No authorization header'
        )

        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('❌ No valid authorization header')
            res.status(401).json({ message: 'No token provided' })
            return
        }

        const token = authHeader.split(' ')[1]
        console.log('🔑 Token received, length:', token.length)

        const decodedToken = await admin.auth().verifyIdToken(token)
        console.log(
            '✅ Token verified successfully for user:',
            decodedToken.uid
        )

        req.user = decodedToken
        next()
    } catch (error) {
        console.error('❌ Token verification error:', error)
        res.status(401).json({ message: 'Invalid token' })
    }
}

// Optional authentication middleware - tries to authenticate if token is provided
// but continues without authentication if no token is present
export const optionalAuthenticateToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        console.log('=== OPTIONAL AUTH MIDDLEWARE DEBUG ===')
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log(
                'ℹ️ No authorization header, continuing without authentication'
            )
            next()
            return
        }

        const token = authHeader.split(' ')[1]
        console.log(
            '🔑 Token received, attempting verification, length:',
            token.length
        )

        try {
            const decodedToken = await admin.auth().verifyIdToken(token)
            console.log(
                '✅ Token verified successfully for user:',
                decodedToken.uid
            )
            req.user = decodedToken
        } catch (tokenError) {
            console.log(
                '⚠️ Token verification failed, continuing without authentication:',
                tokenError
            )
            // Don't set req.user, but continue processing
        }

        next()
    } catch (error) {
        console.error('❌ Unexpected error in optional auth middleware:', error)
        // Continue without authentication on unexpected errors
        next()
    }
}
