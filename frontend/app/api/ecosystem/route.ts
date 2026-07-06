import { NextResponse } from "next/server"
import { getEcosystemStats } from "@/lib/data/store"

export async function GET() {
  return NextResponse.json(getEcosystemStats())
}
