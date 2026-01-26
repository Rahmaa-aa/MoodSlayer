import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const client = await clientPromise
        const db = client.db('mood_tracker')
        const user = await db.collection('users').findOne({ _id: session.user.id })

        // If user has trackables, return them, otherwise return empty array
        return NextResponse.json(user?.trackables || [])
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const trackables = await request.json()
        const client = await clientPromise
        const db = client.db('mood_tracker')

        await db.collection('users').updateOne(
            { _id: session.user.id },
            { $set: { trackables } }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
