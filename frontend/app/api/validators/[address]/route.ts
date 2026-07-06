import { NextResponse } from "next/server"
import { validators } from "@/lib/data/store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params
  const validator = validators.find(v => v.address === address)

  if (!validator) {
    return NextResponse.json({ error: "Validator not found" }, { status: 404 })
  }

  return NextResponse.json(validator)
}
