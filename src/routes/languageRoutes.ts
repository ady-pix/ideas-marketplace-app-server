import express from 'express'
import { getLanguages } from '../controllers/languageController'

const router = express.Router()

// GET /api/languages - Get all active languages
router.get('/', getLanguages)

export default router
