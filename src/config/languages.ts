export interface Language {
    id: string
    name: string
    nativeName?: string
    code: string // ISO 639-1 language code
    isActive: boolean
    sortOrder?: number
    flag?: string
}

export const DEFAULT_LANGUAGES: Language[] = [
    {
        id: 'en',
        name: 'English',
        nativeName: 'English',
        code: 'en',
        isActive: true,
        sortOrder: 1,
        flag: '🇺🇸',
    },
    {
        id: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        code: 'es',
        isActive: true,
        sortOrder: 2,
        flag: '🇪🇸',
    },
    {
        id: 'fr',
        name: 'French',
        nativeName: 'Français',
        code: 'fr',
        isActive: true,
        sortOrder: 3,
        flag: '🇫🇷',
    },
    {
        id: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        code: 'de',
        isActive: true,
        sortOrder: 4,
        flag: '🇩🇪',
    },
    {
        id: 'it',
        name: 'Italian',
        nativeName: 'Italiano',
        code: 'it',
        isActive: true,
        sortOrder: 5,
        flag: '🇮🇹',
    },
    {
        id: 'pt',
        name: 'Portuguese',
        nativeName: 'Português',
        code: 'pt',
        isActive: true,
        sortOrder: 6,
        flag: '🇵🇹',
    },
    {
        id: 'zh',
        name: 'Chinese',
        nativeName: '中文',
        code: 'zh',
        isActive: true,
        sortOrder: 7,
        flag: '🇨🇳',
    },
    {
        id: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        code: 'ja',
        isActive: true,
        sortOrder: 8,
        flag: '🇯🇵',
    },
    {
        id: 'ko',
        name: 'Korean',
        nativeName: '한국어',
        code: 'ko',
        isActive: true,
        sortOrder: 9,
        flag: '🇰🇷',
    },
    {
        id: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        code: 'ar',
        isActive: true,
        sortOrder: 10,
        flag: '🇸🇦',
    },
    {
        id: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
        code: 'ru',
        isActive: true,
        sortOrder: 11,
        flag: '🇷🇺',
    },
    {
        id: 'nl',
        name: 'Dutch',
        nativeName: 'Nederlands',
        code: 'nl',
        isActive: true,
        sortOrder: 12,
        flag: '🇳🇱',
    },
]

// Configuration: Set to true to use database, false to use config file
export const USE_DATABASE_LANGUAGES =
    process.env.USE_DATABASE_LANGUAGES === 'true'

// Helper function to get active languages (works with both approaches)
export const getActiveLanguages = async (): Promise<Language[]> => {
    if (USE_DATABASE_LANGUAGES) {
        // TODO: Implement database fetch when ready
        // const languages = await LanguageModel.find({ isActive: true }).sort({ sortOrder: 1 })
        // return languages
        console.log(
            'Database languages not implemented yet, falling back to config'
        )
    }

    return DEFAULT_LANGUAGES.filter((language) => language.isActive).sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    )
}

// Helper function to get language names only
export const getActiveLanguageNames = async (): Promise<string[]> => {
    const languages = await getActiveLanguages()
    return languages.map((language) => language.name)
}

// Helper function to validate if a language exists
export const isValidLanguage = async (
    languageName: string
): Promise<boolean> => {
    const languageNames = await getActiveLanguageNames()
    return languageNames.includes(languageName)
}

// Synchronous versions for backward compatibility (config file only)
export const getActiveLanguagesSync = (): Language[] => {
    return DEFAULT_LANGUAGES.filter((language) => language.isActive).sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    )
}

export const getActiveLanguageNamesSync = (): string[] => {
    return getActiveLanguagesSync().map((language) => language.name)
}

export const isValidLanguageSync = (languageName: string): boolean => {
    return getActiveLanguageNamesSync().includes(languageName)
}
