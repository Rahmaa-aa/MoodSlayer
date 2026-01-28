import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'
import { ObjectId } from 'mongodb'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const client = await clientPromise
        const db = client.db('mood_tracker')

        // Query by string since that's what we store mostly, but fallback to ObjectId if needed
        const entries = await db.collection('entries')
            .find({
                $or: [
                    { userId: session.user.id },
                    { userId: new ObjectId(session.user.id) }
                ]
            })
            .sort({ date: -1 })
            .limit(30)
            .toArray()

        return NextResponse.json(entries)
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const client = await clientPromise
        const db = client.db('mood_tracker')

        // Normalize date to local YYYY-MM-DD to prevent UTC rollover
        const localDate = new Date(body.date || new Date())
        const dateStr = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`

        const todayStart = new Date(dateStr)
        todayStart.setHours(0, 0, 0, 0)
        const todayEnd = new Date(dateStr)
        todayEnd.setHours(23, 59, 59, 999)
        todayEnd.setHours(23, 59, 59, 999)

        // UPSERT LOGIC per User
        const existing = await db.collection('entries').findOne({
            $or: [
                { userId: session.user.id },
                { userId: new ObjectId(session.user.id) }
            ],
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        })

        if (existing) {
            const updatedData = { ...existing.data, ...body.data }
            await db.collection('entries').updateOne(
                { _id: existing._id },
                {
                    $set: {
                        data: updatedData,
                        lastModified: new Date()
                    }
                }
            )
            return NextResponse.json({ status: 'updated', _id: existing._id })
        } else {
            const entry = {
                userId: session.user.id,
                date: new Date(body.date || new Date()),
                data: body.data,
                createdAt: new Date()
            }
            const result = await db.collection('entries').insertOne(entry)
            return NextResponse.json({ status: 'created', _id: result.insertedId })
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
