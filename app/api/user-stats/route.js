import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'
import { ObjectId } from 'mongodb'
import { calculateStreak, calculateBestStreak, calculateXP, getLevel, calculateRPGStats } from '@/lib/services/gamificationService'

export async function GET(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Safety check for valid ObjectId-like strings
        const isValidId = /^[0-9a-fA-F]{24}$/.test(session.user.id);

        const client = await clientPromise
        const db = client.db('mood_tracker')

        // 1. Get user (handle both ObjectId and string ID)
        let user = null;
        if (isValidId) {
            user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) });
        }
        if (!user) {
            user = await db.collection('users').findOne({ _id: session.user.id });
        }

        if (!user) {
            console.warn(`[STATS_API] User not found for ID: ${session.user.id}. Creating fallback.`);
            user = { streak: 0, xp: 0, level: 1 };
        }

        // 2. Get entries (handle both ObjectId and string ID)
        const entryQuery = {
            $or: [{ userId: session.user.id }]
        };
        if (isValidId) {
            entryQuery.$or.push({ userId: new ObjectId(session.user.id) });
        }

        const entries = await db.collection('entries').find(entryQuery).toArray();

        // 2. Calculate current real-time stats


        const currentStreak = calculateStreak(entries)
        const bestStreak = calculateBestStreak(entries)
        const currentXP = calculateXP(entries)
        const currentLevel = getLevel(currentXP)

        // 3. FETCH GOALS & CALC RPG STATS
        const goals = await db.collection('goals').find({ userId: session.user.id }).toArray();
        const { stats: rpgStats, goals: processedGoals } = calculateRPGStats(entries, goals);


        // 4. Update DB if stats have INCREASED (High-Water Mark Protection)
        const updates = {};
        if (currentStreak > (user.streak || 0)) updates.streak = currentStreak;
        if (bestStreak > (user.bestStreak || 0)) updates.bestStreak = bestStreak;
        if (currentXP > (user.xp || 0)) updates.xp = currentXP;
        if (currentLevel > (user.level || 1)) updates.level = currentLevel;
        if (currentLevel > (user.bestLevel || 1)) updates.bestLevel = currentLevel;

        if (Object.keys(updates).length > 0) {
            await db.collection('users').updateOne(
                { _id: new ObjectId(session.user.id) },
                { $set: updates }
            )
        }

        // 5. Return the HIGHER of calculated or stored stats
        const stats = {
            level: Math.max(currentLevel, user.level || 1),
            xp: Math.max(currentXP, user.xp || 0),
            streak: Math.max(currentStreak, user.streak || 0),
            bestStreak: Math.max(bestStreak, user.bestStreak || 0),
            bestLevel: Math.max(currentLevel, user.bestLevel || user.level || 1),
            rpgStats,
            goals: processedGoals
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
