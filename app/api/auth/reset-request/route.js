import { NextResponse } from 'next/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(request) {
    try {
        const { email } = await request.json()
        if (!email) return NextResponse.json({ error: 'EMAIL_REQUIRED' }, { status: 400 })

        const clientPromise = (await import('@/lib/mongodb')).default
        const client = await clientPromise
        const db = client.db('mood_tracker')
        const user = await db.collection('users').findOne({ email })

        if (!user) {
            // Anti-enumeration: Don't reveal if user doesn't exist
            return NextResponse.json({ status: 'success', message: 'If this email exists, a reset link has been generated.' })
        }

        const token = crypto.randomBytes(32).toString('hex')
        const expires = new Date(Date.now() + 3600000) // 1 hour

        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: {
                    resetToken: token,
                    resetTokenExpires: expires
                }
            }
        )

        // SIMULATOR ACTION: Log the reset link to console
        console.log('\n' + '='.repeat(50))
        console.log('📬 [SYSTEM_MAILER] PASSWORD_RESET_SIMULATOR')
        console.log(`TO: ${email}`)
        console.log(`LINK: http://localhost:3000/auth/reset-password?token=${token}`)
        console.log('='.repeat(50) + '\n')

        return NextResponse.json({ status: 'success', message: 'If this email exists, a reset link has been generated.' })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
