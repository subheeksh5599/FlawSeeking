"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Shield, Activity, Lock, Zap, AlertTriangle, CheckCircle } from "lucide-react"

interface Violation {
  id: number
  agent: string
  attemptedRecipient: string
  attemptedAmount: string
  blockReason: string
  timestamp: number
  resolved: boolean
  validatorVerdict: string | null
}

interface Validator {
  address: string
  reputationScore: number
  totalReviews: number
  correctVerdicts: number
  active: boolean
  stakedAmount: string
}

interface EcosystemStats {
  totalAgents: number
  totalValidators: number
  totalTransactions: number
  totalViolations: number
  activeViolations: number
}

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4)
}

export function Dashboard(): ReactNode {
  const [violations, setViolations] = useState<Violation[]>([])
  const [validators, setValidators] = useState<Validator[]>([])
  const [stats, setStats] = useState<EcosystemStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewing, setReviewing] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/violations").then(r => r.json()),
      fetch("/api/ecosystem").then(r => r.json()),
    ]).then(([vData, eData]) => {
      setViolations(vData.violations)
      setStats(eData)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    Promise.all([
      fetch("/api/validators/01val00000000000000000000000000000001").then(r => r.json()),
      fetch("/api/validators/01val00000000000000000000000000000002").then(r => r.json()),
      fetch("/api/validators/01val00000000000000000000000000000003").then(r => r.json()),
    ]).then(data => setValidators(data.filter(d => !d.error)))
  }, [])

  const handleReview = async (violation: Violation) => {
    setReviewing(violation.id)
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ violationId: violation.id, agent: violation.agent, amount: violation.attemptedAmount, blockReason: violation.blockReason, policyLimit: "50", totalTx: "847", violations: "3", daysActive: "14" }),
      })
      const data = await res.json()
      if (data.success) {
        setViolations(prev => prev.map(v => v.id === violation.id ? { ...v, resolved: true, validatorVerdict: data.review.verdict } : v))
      }
    } catch (e) {
      console.error("Review failed:", e)
    }
    setReviewing(null)
  }

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-medium tracking-tight text-foreground md:text-4xl mb-4">
            Agent Security Dashboard
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Live data from the FlawSeeking policy engine on Casper Testnet
          </p>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-20">Loading...</div>
        ) : (
          <>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
                {[
                  { label: "Agents Protected", value: stats.totalAgents, icon: Shield },
                  { label: "Validators", value: stats.totalValidators, icon: Activity },
                  { label: "Txs Guarded", value: stats.totalTransactions, icon: Lock },
                  { label: "Violations Blocked", value: stats.totalViolations, icon: AlertTriangle },
                  { label: "Active Alerts", value: stats.activeViolations, icon: Zap },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl bg-muted/50 p-5 text-center">
                    <s.icon className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">{s.value.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-2 mb-16">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Violation Feed
                </h3>
                <div className="space-y-3">
                  {violations.map(v => (
                    <div key={v.id} className={`rounded-xl p-4 ${v.resolved ? "bg-muted/30" : "bg-red-500/5 border border-red-500/10"}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs text-muted-foreground">#{v.id}</span>
                          <span className="text-xs text-muted-foreground ml-2">{shortAddr(v.agent)}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${v.resolved ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                          {v.resolved ? (v.validatorVerdict || "RESOLVED") : "PENDING"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2">{v.blockReason}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{v.attemptedAmount} CSPR → {shortAddr(v.attemptedRecipient)}</span>
                        {!v.resolved && (
                          <button
                            onClick={() => handleReview(v)}
                            disabled={reviewing === v.id}
                            className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                          >
                            {reviewing === v.id ? "Reviewing..." : "Review with AI"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {violations.length === 0 && (
                    <div className="text-center text-muted-foreground py-10 flex items-center justify-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      All clear — no pending violations
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  Validator Network
                </h3>
                <div className="space-y-3">
                  {validators.map(v => (
                    <div key={v.address} className="rounded-xl bg-muted/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${v.active ? "bg-green-400" : "bg-red-400"}`} />
                          <span className="text-sm font-medium text-foreground">{shortAddr(v.address)}</span>
                        </div>
                        <span className={`text-sm font-bold ${v.reputationScore >= 90 ? "text-green-400" : v.reputationScore >= 70 ? "text-amber-400" : "text-red-400"}`}>
                          {v.reputationScore}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full ${v.reputationScore >= 90 ? "bg-green-400" : v.reputationScore >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${v.reputationScore}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{v.totalReviews} reviews</span>
                        <span>{v.correctVerdicts} correct</span>
                        <span>{v.stakedAmount} CSPR staked</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="https://github.com/subheeksh5599/FlawSeeking"
                target="_blank"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors text-sm font-medium"
                rel="noreferrer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                View on GitHub
              </a>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
