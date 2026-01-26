import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
    try {
        const client = await clientPromise
        const db = client.db('mood_tracker')
        const entries = await db.collection('entries').find({}).sort({ date: -1 }).limit(30).toArray()
        return NextResponse.json(entries)
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const body = await request.json()
        const client = await clientPromise
        const db = client.db('mood_tracker')

        // Normalize date to YYYY-MM-DD to check for today's entry
        const dateStr = new Date(body.date || new Date()).toISOString().split('T')[0]
        const todayStart = new Date(dateStr)
        const todayEnd = new Date(dateStr)
        todayEnd.setHours(23, 59, 59, 999)

        // UPSERT LOGIC: Check if entry exists for this date range
        const existing = await db.collection('entries').findOne({
            date: {
                $gte: todayStart,
                $lte: todayEnd
            }
        })

        if (existing) {
            // MERGE new data with existing data
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
            // INSERT new entry
            const entry = {
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
