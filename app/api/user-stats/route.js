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

        const stats = {
            level: user?.level || 1,
            xp: user?.xp || 0,
            streak: user?.streak || 0
        }

        return NextResponse.json(stats)
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { level, xp, streak } = await request.json()
        const client = await clientPromise
        const db = client.db('mood_tracker')

        await db.collection('users').updateOne(
            { _id: session.user.id },
            { $set: { level, xp, streak } }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
