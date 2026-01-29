import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'
import { ObjectId } from 'mongodb'

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const client = await clientPromise
        const db = client.db('mood_tracker')
        const goals = await db.collection('goals').find({ userId: session.user.id }).toArray()

        return NextResponse.json(goals)
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, category, targetLevel, linkedHabits, conditions } = body

        if (!name || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db('mood_tracker')

        const goal = {
            userId: session.user.id,
            name,
            category,
            targetLevel: targetLevel || 20,
            linkedHabits: linkedHabits || [],
            conditions: conditions || {},
            xp: 0,
            currentLevel: 1,
            createdAt: new Date()
        }

        const result = await db.collection('goals').insertOne(goal)
        return NextResponse.json({ ...goal, _id: result.insertedId })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function PATCH(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id, ...updates } = await request.json()
        if (!id) return NextResponse.json({ error: 'Missing goal id' }, { status: 400 })

        const client = await clientPromise
        const db = client.db('mood_tracker')

        await db.collection('goals').updateOne(
            { _id: new ObjectId(id), userId: session.user.id },
            { $set: updates }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function DELETE(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await request.json()
        if (!id) return NextResponse.json({ error: 'Missing goal id' }, { status: 400 })

        const client = await clientPromise
        const db = client.db('mood_tracker')

        await db.collection('goals').deleteOne({ _id: new ObjectId(id), userId: session.user.id })

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
