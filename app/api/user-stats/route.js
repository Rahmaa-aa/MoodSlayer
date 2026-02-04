import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import { auth } from '@/auth'
import { ObjectId } from 'mongodb'
import { calculateStreak, calculateBestStreak, calculateXP, getLevel, calculateRPGStats } from '@/lib/services/gamificationService'

export async function GET(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Safety check for valid ObjectId-like strings
        const isValidId = /^[0-9a-fA-F]{24}$/.test(session.user.id);

        const clientPromise = (await import('@/lib/mongodb')).default
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
            user = { streak: 0, xp: 0, level: 1, survivalMode: false, volitionShield: false };
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
        const currentStreak = calculateStreak(entries, user.volitionShield)
        const bestStreak = calculateBestStreak(entries)
        const currentXP = calculateXP(entries)
        const currentLevel = getLevel(currentXP)

        // 3. FETCH GOALS & CALC RPG STATS
        const goals = await db.collection('goals').find({ userId: session.user.id }).toArray();
        const { stats: rpgStats, goals: processedGoals } = calculateRPGStats(entries, goals, user.survivalMode);


        // 4. Update DB (Current streak reflects reality, others are protected)
        const updates = {};
        if (currentStreak !== (user.streak || 0)) updates.streak = currentStreak;
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

        // 5. Return stats (Current streak is raw, others are maximums)
        const stats = {
            level: Math.max(currentLevel, user.level || 1),
            xp: Math.max(currentXP, user.xp || 0),
            streak: currentStreak,
            bestStreak: Math.max(bestStreak, user.bestStreak || 0),
            bestLevel: Math.max(currentLevel, user.bestLevel || user.level || 1),
            survivalMode: user.survivalMode || false,
            volitionShield: user.volitionShield || false,
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

        const { level, xp, streak, survivalMode, volitionShield } = await request.json()
        const clientPromise = (await import('@/lib/mongodb')).default
        const client = await clientPromise
        const db = client.db('mood_tracker')

        const updateData = { level, xp, streak, survivalMode, volitionShield }
        // Clean undefined values
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key])

        await db.collection('users').updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: updateData }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
