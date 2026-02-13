import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { displayName, primaryGoal, tracksCycle, cycleLength, lastPeriodStart, timezone } = body

        const clientPromise = (await import('@/lib/mongodb')).default
        const client = await clientPromise
        const db = client.db('mood_tracker')

        const updateFields = {
            onboardingComplete: true,
            primaryGoal: primaryGoal || 'mood',
            tracksCycle: tracksCycle || false,
            cycleLength: tracksCycle ? (cycleLength || 28) : 28,
            lastPeriodStart: tracksCycle && lastPeriodStart ? new Date(lastPeriodStart) : null,
            timezone: timezone || null,
            onboardedAt: new Date()
        }

        // Update display name if provided and different
        if (displayName && displayName.trim()) {
            updateFields.name = displayName.trim()
        }

        await db.collection('users').updateOne(
            { email: session.user.email },
            { $set: updateFields }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        console.error('Onboarding error:', e)
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
