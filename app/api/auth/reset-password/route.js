import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const { token, newPassword } = await request.json()

        if (!token || !newPassword || newPassword.length < 8) {
            return NextResponse.json({ error: 'INVALID_DATA' }, { status: 400 })
        }

        const clientPromise = (await import('@/lib/mongodb')).default
        const client = await clientPromise
        const db = client.db('mood_tracker')

        const user = await db.collection('users').findOne({
            resetToken: token,
            resetTokenExpires: { $gt: new Date() }
        })

        if (!user) {
            return NextResponse.json({ error: 'INVALID_OR_EXPIRED_TOKEN' }, { status: 400 })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: { password: hashedPassword },
                $unset: { resetToken: "", resetTokenExpires: "" }
            }
        )

        return NextResponse.json({ status: 'success' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
