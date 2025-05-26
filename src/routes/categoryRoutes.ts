import express from 'express'
import { getCategories } from '../controllers/categoryController'

const router = express.Router()

// GET /api/categories - Get all active categories
router.get('/', getCategories)

export default router 