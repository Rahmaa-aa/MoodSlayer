/**
 * POST /api/ml/predict
 *
 * Proxies mood prediction requests to the Python ML service.
 * Graceful degradation: Python service → cached prediction → fallback message.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import clientPromise from "@/lib/mongodb"
import type { MLPredictResponse } from "@/types"

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000"
const ML_TIMEOUT_MS = 5000

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get userId from MongoDB (session has email, we need _id)
    const client = await clientPromise
    const db = client.db()
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const userId = user._id.toString()

    // ── Try Python ML Service ──
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), ML_TIMEOUT_MS)

      const mlResponse = await fetch(`${ML_SERVICE_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (mlResponse.ok) {
        const data: MLPredictResponse = await mlResponse.json()

        // Cache the prediction for fallback
        await db.collection("ml_cache").updateOne(
          { userId },
          {
            $set: {
              ...data,
              userId,
              cachedAt: new Date(),
            },
          },
          { upsert: true }
        )

        return NextResponse.json(data)
      }
    } catch {
      // ML service unreachable — fall through to fallback
    }

    // ── Fallback 1: Return cached prediction ──
    const cached = await db.collection("ml_cache").findOne({ userId })
    if (cached) {
      const cacheAge = Date.now() - new Date(cached.cachedAt).getTime()
      const MAX_CACHE_AGE = 24 * 60 * 60 * 1000 // 24 hours

      if (cacheAge < MAX_CACHE_AGE) {
        const { _id, cachedAt, ...prediction } = cached
        return NextResponse.json({
          ...prediction,
          _cached: true,
          _cacheAge: Math.round(cacheAge / 60000),
        })
      }
    }

    // ── Fallback 2: Generic response ──
    return NextResponse.json({
      prediction: null,
      confidence: null,
      tier: "COLD_START",
      message: "Oracle is recharging 🔮",
      tip: "The ML service is temporarily unavailable. Your data is safe.",
      _fallback: true,
    } satisfies Partial<MLPredictResponse> & { _fallback: boolean })
  } catch (error) {
    console.error("[ML Predict] Error:", error)
    return NextResponse.json(
      { error: "Prediction failed" },
      { status: 500 }
    )
  }
}
