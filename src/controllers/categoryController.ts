import { Request, Response } from 'express'
import { getActiveCategories } from '../config/categories'

export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await getActiveCategories()
        
        res.status(200).json({
            success: true,
            categories
        })
    } catch (error) {
        console.error('Error fetching categories:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        })
    }
} 