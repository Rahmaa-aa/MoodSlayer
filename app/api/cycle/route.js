import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
    try {
        const client = await clientPromise
        const db = client.db('mood_tracker')
        const cycle = await db.collection('configs').findOne({ type: 'cycle' })
        return NextResponse.json(cycle || { lastStart: null, avgLength: 28 })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const client = await clientPromise
        const db = client.db('mood_tracker')

        const result = await db.collection('configs').updateOne(
            { type: 'cycle' },
            { $set: { lastStart: body.lastStart, avgLength: body.avgLength, updatedAt: new Date() } },
            { upsert: true }
        )

        return NextResponse.json(result)
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
