// src/config/firebase.ts
import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

// Initialize Firebase Admin
// Option 1: Using service account JSON file
if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
        const serviceAccount = require(process.env
            .FIREBASE_SERVICE_ACCOUNT_PATH)
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        })
        console.log('Firebase Admin initialized with service account')
    } catch (error) {
        console.error('Error loading service account file:', error)
        console.error(
            'Make sure serviceAccountKey.json exists in the server directory'
        )
        process.exit(1)
    }
}
// Option 2: Using individual environment variables
else if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL
) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
    })
}
// Option 3: Default credentials (for Google Cloud environments)
else {
    admin.initializeApp()
}

export default admin
