import { Request, Response } from 'express'
import { getActiveLanguages } from '../config/languages'

export const getLanguages = async (req: Request, res: Response) => {
    try {
        const languages = await getActiveLanguages()

        res.status(200).json({
            success: true,
            languages,
        })
    } catch (error) {
        console.error('Error fetching languages:', error)
        res.status(500).json({
            success: false,
            message: 'Failed to fetch languages',
        })
    }
}
