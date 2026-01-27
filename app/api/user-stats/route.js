import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'
import { ObjectId } from 'mongodb'
import { calculateStreak, calculateXP, getLevel } from '@/lib/services/gamificationService'

export async function GET(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const client = await clientPromise
        const db = client.db('mood_tracker')

        // 1. Get user and entries
        const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })
        const entries = await db.collection('entries').find({
            userId: session.user.id
        }).toArray()

        // 2. Calculate current real-time stats
        const currentStreak = calculateStreak(entries)
        const currentXP = calculateXP(entries)
        const currentLevel = getLevel(currentXP)

        // 3. Update DB if inconsistent (Passive Sync)
        if (user.streak !== currentStreak || user.xp !== currentXP || user.level !== currentLevel) {
            await db.collection('users').updateOne(
                { _id: new ObjectId(session.user.id) },
                { $set: { streak: currentStreak, xp: currentXP, level: currentLevel } }
            )
        }

        const stats = {
            level: currentLevel,
            xp: currentXP,
            streak: currentStreak
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
            { _id: new ObjectId(session.user.id) },
            { $set: { level, xp, streak } }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
