export interface Category {
    id: string
    name: string
    description?: string
    isActive: boolean
    sortOrder?: number
    icon?: string
    color?: string
}

export const DEFAULT_CATEGORIES: Category[] = [
    {
        id: 'health',
        name: 'Health',
        description: 'Health and wellness related ideas',
        isActive: true,
        sortOrder: 1,
        icon: '🏥',
        color: '#10B981'
    },
    {
        id: 'baby',
        name: 'Baby',
        description: 'Baby and childcare products/services',
        isActive: true,
        sortOrder: 2,
        icon: '👶',
        color: '#F59E0B'
    },
    {
        id: 'home',
        name: 'Home',
        description: 'Home improvement and household ideas',
        isActive: true,
        sortOrder: 3,
        icon: '🏠',
        color: '#8B5CF6'
    },
    {
        id: 'tech',
        name: 'Tech',
        description: 'Technology and software solutions',
        isActive: true,
        sortOrder: 4,
        icon: '💻',
        color: '#3B82F6'
    },
    {
        id: 'business',
        name: 'Business',
        description: 'Business and entrepreneurship ideas',
        isActive: true,
        sortOrder: 5,
        icon: '💼',
        color: '#EF4444'
    },
    {
        id: 'education',
        name: 'Education',
        description: 'Educational tools and services',
        isActive: true,
        sortOrder: 6,
        icon: '📚',
        color: '#06B6D4'
    },
    {
        id: 'finance',
        name: 'Finance',
        description: 'Financial services and fintech',
        isActive: true,
        sortOrder: 7,
        icon: '💰',
        color: '#84CC16'
    }
]

// Configuration: Set to true to use database, false to use config file
export const USE_DATABASE_CATEGORIES = process.env.USE_DATABASE_CATEGORIES === 'true'

// Helper function to get active categories (works with both approaches)
export const getActiveCategories = async (): Promise<Category[]> => {
    if (USE_DATABASE_CATEGORIES) {
        // TODO: Implement database fetch when ready
        // const categories = await CategoryModel.find({ isActive: true }).sort({ sortOrder: 1 })
        // return categories
        console.log('Database categories not implemented yet, falling back to config')
    }
    
    return DEFAULT_CATEGORIES
        .filter(category => category.isActive)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
}

// Helper function to get category names only
export const getActiveCategoryNames = async (): Promise<string[]> => {
    const categories = await getActiveCategories()
    return categories.map(category => category.name)
}

// Helper function to validate if a category exists
export const isValidCategory = async (categoryName: string): Promise<boolean> => {
    const categoryNames = await getActiveCategoryNames()
    return categoryNames.includes(categoryName)
}

// Synchronous versions for backward compatibility (config file only)
export const getActiveCategoriesSync = (): Category[] => {
    return DEFAULT_CATEGORIES
        .filter(category => category.isActive)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
}

export const getActiveCategoryNamesSync = (): string[] => {
    return getActiveCategoriesSync().map(category => category.name)
}

export const isValidCategorySync = (categoryName: string): boolean => {
    return getActiveCategoryNamesSync().includes(categoryName)
} 