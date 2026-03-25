/**
 * POST /api/ml/train
 *
 * Triggers model retraining for the current user.
 * Fire-and-forget from the frontend — non-blocking.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import clientPromise from "@/lib/mongodb"
import type { MLTrainResponse } from "@/types"

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000"
const ML_TIMEOUT_MS = 30000 // Training can take longer

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user._id.toString()

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS)

      const mlResponse = await fetch(`${ML_SERVICE_URL}/train`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (mlResponse.ok) {
        const data: MLTrainResponse = await mlResponse.json()
        return NextResponse.json(data)
      }

      const errorText = await mlResponse.text()
      return NextResponse.json(
        { status: "ml_error", warnings: [errorText] },
        { status: mlResponse.status }
      )
    } catch {
      return NextResponse.json({
        status: "service_unavailable",
        warnings: ["ML service is offline. Training will resume when it's back."],
      })
    }
  } catch (error) {
    console.error("[ML Train] Error:", error)
    return NextResponse.json(
      { error: "Training failed" },
      { status: 500 }
    )
  }
}
