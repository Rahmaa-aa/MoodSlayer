import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const session = await auth()
        if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword || newPassword.length < 8) {
            return NextResponse.json({ error: 'INVALID_INPUT_DATA' }, { status: 400 })
        }

        const clientPromise = (await import('@/lib/mongodb')).default
        const client = await clientPromise
        const db = client.db('mood_tracker')

        const user = await db.collection('users').findOne({ _id: new ObjectId(session.user.id) })

        // If user signed in with Google and has no password
        if (!user.password) {
            return NextResponse.json({ error: 'OAUTH_USER_NO_PASSWORD' }, { status: 400 })
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password)
        if (!isMatch) {
            return NextResponse.json({ error: 'INCORRECT_CURRENT_PASSWORD' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await db.collection('users').updateOne(
            { _id: new ObjectId(session.user.id) },
            { $set: { password: hashedPassword } }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
