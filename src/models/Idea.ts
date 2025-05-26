import mongoose, { Schema, Document } from 'mongoose'

export interface IIdea extends Document {
    title: string
    category: string
    type: 'Service' | 'Product'
    problemDescription: string
    solutionDescription: string
    photos: string[] // URLs or file paths
    protectionStatus: string
    requireNDA: boolean
    desiredPrice: number
    contactPreference: string
    additionalNotes?: string
    creator: string
    createdAt: Date
    updatedAt: Date
}

const IdeaSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        category: { type: String, required: true },
        type: { type: String, enum: ['Service', 'Product'], required: true },
        problemDescription: { type: String, required: true },
        solutionDescription: { type: String, required: true },
        photos: [{ type: String }],
        protectionStatus: { type: String, default: 'None' },
        requireNDA: { type: Boolean, default: false },
        desiredPrice: { type: Number, required: true },
        contactPreference: { type: String, required: true },
        additionalNotes: { type: String },
        creator: { type: String, required: true },
    },
    { timestamps: true }
)

export default mongoose.model<IIdea>('Idea', IdeaSchema)
