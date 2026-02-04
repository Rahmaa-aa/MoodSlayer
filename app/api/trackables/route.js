import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ObjectId } from 'mongodb'
export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const clientPromise = (await import('@/lib/mongodb')).default
        const client = await clientPromise
        const db = client.db('mood_tracker')
        const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })

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

        const body = await request.json()
        const trackables = Array.isArray(body) ? body : body.trackables

        if (!trackables) return NextResponse.json({ error: 'Missing trackables' }, { status: 400 })

        const clientPromise = (await import('@/lib/mongodb')).default
        const client = await clientPromise
        const db = client.db('mood_tracker')

        await db.collection('users').updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: { trackables } }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
