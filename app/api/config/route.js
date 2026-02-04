import { NextResponse } from 'next/server'
import { auth } from '@/auth'
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const clientPromise = (await import('@/lib/mongodb')).default
        const client = await clientPromise
        const db = client.db('mood_tracker')
        const config = await db.collection('configs').findOne({ type: 'trackables' })

        // Default config if none exists
        if (!config) {
            const defaultConfig = {
                type: 'trackables',
                items: [
                    { id: 'mood', name: 'Mood', type: 'enum', options: ['Happy', 'Sad', 'Quiet', 'Energetic'], icon: 'Smile', color: '#ff477e' },
                    { id: 'gym', name: 'Gym', type: 'boolean', icon: 'Dumbbell', color: '#00f5d4' },
                    { id: 'study', name: 'Study Hours', type: 'number', icon: 'Book', color: '#9b5de5' },
                    { id: 'steps', name: 'Steps Today', type: 'number', icon: 'Footprints', color: '#fee440' },
                    { id: 'school', name: 'Had School', type: 'boolean', icon: 'School', color: '#ff85a1' },
                    { id: 'cooked', name: 'Cooked', type: 'boolean', icon: 'Utensils', color: '#ff477e' },
                ]
            }
            return NextResponse.json(defaultConfig)
        }

        return NextResponse.json(config)
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const clientPromise = (await import('@/lib/mongodb')).default
        const client = await clientPromise
        const db = client.db('mood_tracker')

        const result = await db.collection('configs').updateOne(
            { type: 'trackables' },
            { $set: { items: body.items, updatedAt: new Date() } },
            { upsert: true }
        )

        return NextResponse.json(result)
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
