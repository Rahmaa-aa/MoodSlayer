/**
 * GET /api/ml/health
 *
 * Checks the Python ML service status.
 * Used by frontend to show ML service badge.
 */

import { NextResponse } from "next/server"
import type { MLHealthResponse } from "@/types"

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000"

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const mlResponse = await fetch(`${ML_SERVICE_URL}/health`, {
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (mlResponse.ok) {
      const data: MLHealthResponse = await mlResponse.json()
      return NextResponse.json(data)
    }

    return NextResponse.json({ status: "degraded", database: "unreachable" })
  } catch {
    return NextResponse.json({ status: "offline", database: "unreachable" })
  }
}
