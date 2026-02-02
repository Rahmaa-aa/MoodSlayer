import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'
import { ObjectId } from 'mongodb'

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { name } = await request.json()
        if (!name || name.trim().length < 2) {
            return NextResponse.json({ error: 'INVALID_NAME_LENGTH' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db('mood_tracker')

        await db.collection('users').updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: { name: name.trim() } }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
