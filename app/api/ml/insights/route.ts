/**
 * GET /api/ml/insights?userId=...
 *
 * Proxies insight requests (correlations, mood distribution) to Python ML service.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import clientPromise from "@/lib/mongodb"
import type { MLInsightsResponse } from "@/types"

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000"
const ML_TIMEOUT_MS = 5000

export async function GET(req: NextRequest) {
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

      const mlResponse = await fetch(
        `${ML_SERVICE_URL}/insights?userId=${userId}`,
        { signal: controller.signal }
      )

      clearTimeout(timeout)

      if (mlResponse.ok) {
        const data: MLInsightsResponse = await mlResponse.json()
        return NextResponse.json(data)
      }
    } catch {
      // ML service unreachable
    }

    // Fallback
    return NextResponse.json({
      correlations: [],
      message: "Insights temporarily unavailable. Check back soon!",
    } satisfies Partial<MLInsightsResponse>)
  } catch (error) {
    console.error("[ML Insights] Error:", error)
    return NextResponse.json(
      { error: "Insights failed" },
      { status: 500 }
    )
  }
}
