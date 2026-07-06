import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json()
  const { violationId, agent, amount, blockReason, policyLimit, totalTx, violations, daysActive } = body

  if (!violationId || !agent || !amount || !blockReason) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const prompt = `You are a security auditor for FlawSeeking on Casper Network. Review blocked transactions.

## Violation
- ID: ${violationId}
- Agent: ${agent}
- Amount: ${amount} CSPR
- Block Reason: ${blockReason}
- Policy Limit: ${policyLimit || "50"} CSPR/tx

## Agent History
- Total Txs: ${totalTx || "N/A"}
- Prior Violations: ${violations || "N/A"}
- Days Active: ${daysActive || "N/A"}

Respond with ONLY a JSON object, no other text:
{"verdict":"CONFIRMED"|"OVERTURNED"|"INCONCLUSIVE","confidence":0-100,"reasoning":"...","suggestedAction":"..."}`

  const apiKey = process.env.GROQ_API_KEY
  let result

  if (apiKey) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a blockchain security auditor. Respond ONLY with valid JSON. No markdown, no extra text." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (res.ok) {
        const data = await res.json()
        const content = data.choices?.[0]?.message?.content || ""
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return NextResponse.json({ success: true, model: "llama-3.3-70b", review: { verdict: parsed.verdict || "CONFIRMED", confidence: parsed.confidence || 85, reasoning: parsed.reasoning || content.trim(), suggestedAction: parsed.suggestedAction || "" } })
        }
      }
    } catch (e) {
      console.warn("Groq fallback:", String(e).slice(0, 80))
    }
  }

  const amountNum = parseFloat(amount)
  const limitNum = parseFloat(policyLimit || "50")
  const ratio = amountNum / limitNum
  const violationCount = parseInt(violations || "0")

  if (ratio > 5 && violationCount >= 3) {
    result = { verdict: "CONFIRMED", confidence: 95, reasoning: `${amount} CSPR is ${ratio.toFixed(0)}x over the ${limitNum} CSPR cap with ${violationCount} prior violations. High-confidence true positive.`, suggestedAction: "Keep block. Review agent for compromise." }
  } else if (ratio < 2 && violationCount === 0) {
    result = { verdict: "OVERTURNED", confidence: 70, reasoning: `${amount} CSPR is only ${ratio.toFixed(1)}x over ${limitNum} CSPR cap with zero prior violations. Possible legitimate operation.`, suggestedAction: "Overturn block. Increase per-tx limit." }
  } else {
    result = { verdict: "CONFIRMED", confidence: 85, reasoning: `${amount} CSPR (${ratio.toFixed(1)}x over ${limitNum} CSPR limit). Block is correct.`, suggestedAction: "Block stands." }
  }

  return NextResponse.json({ success: true, review: result, model: apiKey ? "llama-3.3-70b (timeout/failover)" : "heuristic" })
}
