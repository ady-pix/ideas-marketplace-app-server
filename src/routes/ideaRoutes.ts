import express from 'express'
import {
    authenticateToken,
    optionalAuthenticateToken,
} from '../middleware/firebaseAuth'

import {
    createIdea,
    getIdeas,
    getIdeaById,
    updateIdea,
    deleteIdea,
    getUserInfo,
} from '../controllers/ideaController'

const ideaRoutes = express.Router()

// Public routes (optional authentication for mine=true filter and NDA checks)
ideaRoutes.get('/', optionalAuthenticateToken, getIdeas)
ideaRoutes.get('/user/:userId', getUserInfo)
ideaRoutes.get('/:id', optionalAuthenticateToken, getIdeaById)

// Protected routes (authentication required)
ideaRoutes.post('/', authenticateToken, createIdea)
ideaRoutes.put('/:id', authenticateToken, updateIdea)
ideaRoutes.delete('/:id', authenticateToken, deleteIdea)

export default ideaRoutes
