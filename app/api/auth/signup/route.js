import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

export async function POST(request) {
    try {
        const { name, email, password } = await request.json()

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
        }

        const client = await clientPromise
        const db = client.db('mood_tracker')

        // Check if user exists
        const existing = await db.collection('users').findOne({ email })
        if (existing) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 })
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const result = await db.collection('users').insertOne({
            name,
            email,
            password: hashedPassword,
            createdAt: new Date(),
            level: 1,
            xp: 0,
            streak: 0
        })

        return NextResponse.json({ status: 'success', userId: result.insertedId }, { status: 201 })
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
