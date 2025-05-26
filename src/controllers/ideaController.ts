import { Request, Response } from 'express'
import Idea from '../models/Idea'
import { AuthenticatedRequest } from '../middleware/firebaseAuth'
import admin from '../config/firebase'
import { isValidCategorySync } from '../config/categories'

// Public - No auth required
export const getIdeas = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('=== GET IDEAS DEBUG ===')
        console.log('Query parameters:', req.query)

        const {
            mine,
            category,
            type,
            priceMin,
            priceMax,
            requireNDA,
            search,
            page = '1',
            limit = '50',
        } = req.query

        let query: any = {}

        // If "mine" filter is requested, check if user is authenticated
        if (mine === 'true') {
            const authReq = req as AuthenticatedRequest
            if (!authReq.user) {
                res.status(401).json({
                    message: 'Authentication required to view your ideas',
                })
                return
            }
            query.creator = authReq.user.uid
        }

        // Category filter
        if (category && category !== 'All Categories') {
            query.category = category
        }

        // Type filter
        if (type && type !== 'All Types') {
            query.type = type
        }

        // Price range filters
        if (priceMin || priceMax) {
            query.desiredPrice = {}
            if (priceMin) {
                const minPrice = parseInt(priceMin as string)
                if (!isNaN(minPrice)) {
                    query.desiredPrice.$gte = minPrice
                }
            }
            if (priceMax) {
                const maxPrice = parseInt(priceMax as string)
                if (!isNaN(maxPrice)) {
                    query.desiredPrice.$lte = maxPrice
                }
            }
        }

        // NDA filter
        if (requireNDA && requireNDA !== 'All') {
            query.requireNDA = requireNDA === 'Yes'
        }

        // Search filter (text search across multiple fields)
        const searchTerm = typeof search === 'string' ? search.trim() : ''
        if (searchTerm) {
            const searchRegex = new RegExp(searchTerm, 'i')
            query.$or = [
                { title: searchRegex },
                { problemDescription: searchRegex },
                { solutionDescription: searchRegex },
            ]
        }

        console.log('MongoDB query:', JSON.stringify(query, null, 2))

        // Pagination
        const pageNum = parseInt(page as string) || 1
        const limitNum = parseInt(limit as string) || 50
        const skip = (pageNum - 1) * limitNum

        // Execute query with pagination
        const ideas = await Idea.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)

        // Get total count for pagination info
        const totalCount = await Idea.countDocuments(query)
        const totalPages = Math.ceil(totalCount / limitNum)

        // Fetch creator information for each idea
        const ideasWithCreators = await Promise.all(
            ideas.map(async (idea) => {
                try {
                    const userRecord = await admin.auth().getUser(idea.creator)
                    return {
                        ...idea.toObject(),
                        creatorInfo: {
                            displayName: userRecord.displayName || 'Anonymous',
                            email: userRecord.email || '',
                            photoURL: userRecord.photoURL || null,
                        },
                    }
                } catch (error) {
                    console.warn(
                        `Failed to fetch user info for creator ${idea.creator}:`,
                        error
                    )
                    return {
                        ...idea.toObject(),
                        creatorInfo: {
                            displayName: 'Anonymous',
                            email: '',
                            photoURL: null,
                        },
                    }
                }
            })
        )

        console.log(`✅ Found ${ideas.length} ideas (${totalCount} total)`)

        res.json({
            ideas: ideasWithCreators,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalCount,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        })
    } catch (error) {
        console.error('❌ Error fetching ideas:', error)

        // Handle specific error types
        if (error instanceof Error) {
            // MongoDB connection errors
            if (
                error.message.includes('ECONNREFUSED') ||
                error.message.includes('MongoNetworkError')
            ) {
                res.status(503).json({
                    message:
                        'Database temporarily unavailable. Please try again in a moment.',
                    error: { type: 'DATABASE_ERROR' },
                })
                return
            }

            // MongoDB timeout errors
            if (
                error.message.includes('timeout') ||
                error.message.includes('ETIMEDOUT')
            ) {
                res.status(504).json({
                    message: 'Request timed out. Please try again.',
                    error: { type: 'TIMEOUT_ERROR' },
                })
                return
            }

            // Firebase Auth errors
            if (
                error.message.includes('Firebase') ||
                error.message.includes('auth')
            ) {
                console.warn('Firebase auth error during idea fetch:', error)
                // Continue without creator info rather than failing completely
            }
        }

        // Generic server error
        res.status(500).json({
            message: 'Unable to fetch ideas at this time. Please try again.',
            error: { type: 'SERVER_ERROR' },
        })
    }
}

// Public - No auth required, but NDA check applies
export const getIdeaById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const idea = await Idea.findById(req.params.id)
        if (!idea) {
            res.status(404).json({ message: 'Idea not found' })
            return
        }

        // Fetch creator information
        let ideaWithCreator
        try {
            const userRecord = await admin.auth().getUser(idea.creator)
            ideaWithCreator = {
                ...idea.toObject(),
                creatorInfo: {
                    displayName: userRecord.displayName || 'Anonymous',
                    email: userRecord.email || '',
                    photoURL: userRecord.photoURL || null,
                },
            }
        } catch (error) {
            console.warn(
                `Failed to fetch user info for creator ${idea.creator}:`,
                error
            )
            ideaWithCreator = {
                ...idea.toObject(),
                creatorInfo: {
                    displayName: 'Anonymous',
                    email: '',
                    photoURL: null,
                },
            }
        }

        // If idea requires NDA and user is not authenticated or not the creator
        if (idea.requireNDA) {
            const authReq = req as AuthenticatedRequest
            const isCreator = authReq.user?.uid === idea.creator

            if (!isCreator) {
                // Return limited info for NDA-protected ideas but include creator info
                res.json({
                    _id: idea._id,
                    title: idea.title,
                    category: idea.category,
                    type: idea.type,
                    requireNDA: true,
                    desiredPrice: idea.desiredPrice,
                    createdAt: idea.createdAt,
                    creatorInfo: ideaWithCreator.creatorInfo,
                    contactPreference: idea.contactPreference, // Include for NDA contact
                    message: 'This idea requires an NDA to view full details',
                })
                return
            }
        }

        res.json(ideaWithCreator)
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving idea', error })
    }
}

// Protected - Auth required
export const createIdea = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        console.log('=== CREATE IDEA DEBUG ===')
        console.log('Request body:', JSON.stringify(req.body, null, 2))
        console.log(
            'User:',
            req.user ? { uid: req.user.uid, email: req.user.email } : 'No user'
        )

        if (!req.user) {
            console.log('❌ User not authenticated')
            res.status(401).json({ message: 'User not authenticated' })
            return
        }

        // Validate required fields
        const requiredFields = [
            'title',
            'category',
            'type',
            'problemDescription',
            'solutionDescription',
            'desiredPrice',
            'contactPreference',
        ]
        const missingFields = requiredFields.filter((field) => !req.body[field])

        if (missingFields.length > 0) {
            console.log('❌ Missing required fields:', missingFields)
            res.status(400).json({
                message: 'Missing required fields',
                missingFields,
            })
            return
        }

        // Validate enum values
        if (!['Service', 'Product'].includes(req.body.type)) {
            console.log('❌ Invalid type:', req.body.type)
            res.status(400).json({
                message: 'Invalid type. Must be "Service" or "Product"',
            })
            return
        }

        // Validate category
        if (!isValidCategorySync(req.body.category)) {
            console.log('❌ Invalid category:', req.body.category)
            res.status(400).json({
                message: 'Invalid category. Please select a valid category.',
            })
            return
        }

        const ideaData = {
            ...req.body,
            creator: req.user.uid,
        }

        console.log(
            '💾 Attempting to save idea:',
            JSON.stringify(ideaData, null, 2)
        )

        const idea = await Idea.create(ideaData)

        console.log('✅ Idea created successfully:', idea._id)
        res.status(201).json(idea)
    } catch (error) {
        console.error('❌ Create idea error:', error)

        // Handle Mongoose validation errors specifically
        if (error instanceof Error && error.name === 'ValidationError') {
            console.log('❌ Mongoose validation error details:', error.message)
            res.status(400).json({
                message: 'Validation error',
                details: error.message,
                error,
            })
            return
        }

        // Handle duplicate key errors
        if (
            error instanceof Error &&
            'code' in error &&
            (error as any).code === 11000
        ) {
            console.log('❌ Duplicate key error:', error)
            res.status(409).json({
                message: 'Duplicate entry',
                error,
            })
            return
        }

        res.status(500).json({
            message: 'Error creating idea',
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    }
}

// Protected - Auth required, only creator can update
export const updateIdea = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' })
            return
        }

        const idea = await Idea.findById(req.params.id)

        if (!idea) {
            res.status(404).json({ message: 'Idea not found' })
            return
        }

        // Check if user is the creator
        if (idea.creator !== req.user.uid) {
            res.status(403).json({
                message: 'Not authorized to update this idea',
            })
            return
        }

        const updatedIdea = await Idea.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        )

        res.json(updatedIdea)
    } catch (error) {
        res.status(500).json({ message: 'Error updating idea', error })
    }
}

// Protected - Auth required, only creator can delete
export const deleteIdea = async (
    req: AuthenticatedRequest,
    res: Response
): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'User not authenticated' })
            return
        }

        const idea = await Idea.findById(req.params.id)

        if (!idea) {
            res.status(404).json({ message: 'Idea not found' })
            return
        }

        // Check if user is the creator
        if (idea.creator !== req.user.uid) {
            res.status(403).json({
                message: 'Not authorized to delete this idea',
            })
            return
        }

        await Idea.findByIdAndDelete(req.params.id)
        res.json({ message: 'Idea deleted successfully' })
    } catch (error) {
        res.status(500).json({ message: 'Error deleting idea', error })
    }
}

// Public - Get public user information from Firestore
export const getUserInfo = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { userId } = req.params

        if (!userId) {
            res.status(400).json({ message: 'User ID is required' })
            return
        }

        try {
            // Get user data from Firestore
            const userDoc = await admin
                .firestore()
                .collection('users')
                .doc(userId)
                .get()

            if (!userDoc.exists) {
                // Fallback to Firebase Auth if Firestore document doesn't exist
                try {
                    const userRecord = await admin.auth().getUser(userId)

                    res.json({
                        displayName: userRecord.displayName || 'Anonymous',
                        photoURL: userRecord.photoURL || null,
                        bio: '',
                        location: '',
                        website: '',
                        preferredCategories: [],
                        languagePreferences: [],
                        isOnline: false,
                    })
                    return
                } catch (authError) {
                    console.error(
                        'User not found in Firebase Auth either:',
                        authError
                    )
                    res.status(404).json({ message: 'User not found' })
                    return
                }
            }

            const userData = userDoc.data()
            console.log('Firestore user data:', userData)

            // Return only public information (exclude private fields like email)
            res.json({
                displayName: userData?.displayName || 'Anonymous',
                photoURL: userData?.photoURL || null,
                bio: userData?.bio || '',
                location: userData?.location || '',
                website: userData?.website || '',
                preferredCategories: userData?.preferredCategories || [],
                languagePreferences: userData?.languagePreferences || [],
                isOnline: userData?.isOnline || false,
                // Don't include email, cvUrl, or other private information
            })
        } catch (error) {
            console.warn(`Failed to fetch user info for ${userId}:`, error)
            res.status(404).json({ message: 'User not found' })
        }
    } catch (error) {
        console.error('Error fetching user info:', error)
        res.status(500).json({ message: 'Error retrieving user information' })
    }
}
