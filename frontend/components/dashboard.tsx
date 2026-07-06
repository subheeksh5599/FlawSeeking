"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  Shield,
  Activity,
  Zap,
  AlertTriangle,
  CheckCircle,
  Bot,
  Server,
  RefreshCw,
  ChevronDown,
  X,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Agent {
  address: string;
  agent: string;
  activePolicyHash: string;
  totalTransactions: number;
  violations: number;
  totalVolumeCspr: string;
  paused: boolean;
  createdAt: number;
  activePolicy: {
    maxCsprPerTx: string;
    maxCsprPerHour: string;
    maxCsprPerDay: string;
    cooldownSeconds: number;
    allowlist: string[];
    blocklist: string[];
  };
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  healthScore: number;
  registered: boolean;
}

interface Violation {
  id: number;
  agent: string;
  attemptedRecipient: string;
  attemptedAmount: string;
  blockReason: string;
  timestamp: number;
  resolved: boolean;
  validatorVerdict: string | null;
  reviewReasoning?: string;
}

interface Validator {
  address: string;
  reputationScore: number;
  totalReviews: number;
  correctVerdicts: number;
  active: boolean;
  stakedAmount: string;
}

interface EcosystemStats {
  totalAgents: number;
  totalValidators: number;
  totalTransactions: number;
  totalViolations: number;
  activeViolations: number;
  networkUptime: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shortAddr(addr: string) {
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function riskColor(level: string) {
  const map: Record<string, string> = {
    LOW: "text-emerald-400 bg-emerald-500/10",
    MEDIUM: "text-amber-400 bg-amber-500/10",
    HIGH: "text-orange-400 bg-orange-500/10",
    CRITICAL: "text-red-400 bg-red-500/10",
  };
  return map[level] ?? "text-zinc-400 bg-zinc-500/10";
}

function healthBar(score: number) {
  const c =
    score >= 90 ? "bg-emerald-400" : score >= 70 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
      <div className={`h-full rounded-full ${c}`} style={{ width: `${score}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard                                                          */
/* ------------------------------------------------------------------ */

export function Dashboard(): ReactNode {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [stats, setStats] = useState<EcosystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/violations").then((r) => r.json()),
      fetch("/api/ecosystem").then((r) => r.json()),
    ])
      .then(([vData, eData]) => {
        setViolations(vData.violations || []);
        setStats(eData);
      })
      .catch((e) => {
        console.error(e);
        setError("Could not load data. Try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    Promise.all([
      fetch("/api/agents/01a3b5c7d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5/health").then((r) => r.json()).catch(() => null),
      fetch("/api/agents/01f4a2b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8/health").then((r) => r.json()).catch(() => null),
      fetch("/api/agents/01b000d000e000f000a000d0000000000dead/health").then((r) => r.json()).catch(() => null),
      fetch("/api/validators/01val00000000000000000000000000000001").then((r) => r.json()).catch(() => null),
      fetch("/api/validators/01val00000000000000000000000000000002").then((r) => r.json()).catch(() => null),
      fetch("/api/validators/01val00000000000000000000000000000003").then((r) => r.json()).catch(() => null),
    ]).then(([a1, a2, a3, v1, v2, v3]) => {
      setAgents([a1, a2, a3].filter((a) => a && !a.error));
      setValidators([v1, v2, v3].filter((v) => v && !v.error));
    });
  }, []);

  const handleReview = async (violation: Violation) => {
    setReviewing(violation.id);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          violationId: violation.id,
          agent: violation.agent,
          amount: violation.attemptedAmount,
          blockReason: violation.blockReason,
          policyLimit: "50",
          totalTx: "847",
          violations: "3",
          daysActive: "14",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setViolations((prev) =>
          prev.map((v) =>
            v.id === violation.id
              ? {
                  ...v,
                  resolved: true,
                  validatorVerdict: data.review.verdict,
                  reviewReasoning: data.review.reasoning,
                }
              : v,
          ),
        );
      }
    } catch (e) {
      console.error(e);
    }
    setReviewing(null);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Navigation */}
      <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <Shield className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold tracking-tight">FlawSeeking</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <a
              href="https://github.com/subheeksh5599/FlawSeeking"
              target="_blank"
              className="rounded-lg px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
              rel="noreferrer"
            >
              GitHub &rarr;
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 pb-16 pt-40 md:pb-24 md:pt-52">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-400">
            Casper Network
          </p>
          <h1 className="mb-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Security middleware
            <br />
            for autonomous agents
          </h1>
          <p className="mx-auto mb-10 max-w-lg text-balance text-base leading-relaxed text-zinc-400">
            Every transaction from your AI agent passes through FlawSeeking's policy engine before
            hitting the chain. Violations are logged on-chain and reviewed by independent validators.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a
              href="#live"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              View live data
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
            <a
              href="https://github.com/subheeksh5599/FlawSeeking"
              target="_blank"
              className="rounded-xl px-5 py-2.5 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
              rel="noreferrer"
            >
              Read the docs
            </a>
          </div>
        </div>
      </section>

      {/* Live stats strip */}
      {stats && (
        <section className="border-y border-zinc-800 px-6 py-10">
          <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-zinc-800 md:grid-cols-6">
            {[
              { label: "Agents", value: stats.totalAgents },
              { label: "Validators", value: stats.totalValidators },
              { label: "Txs guarded", value: stats.totalTransactions.toLocaleString() },
              { label: "Violations blocked", value: stats.totalViolations },
              { label: "Active alerts", value: stats.activeViolations },
              { label: "Uptime", value: stats.networkUptime },
            ].map((s) => (
              <div key={s.label} className="px-4 text-center first:pl-0 last:pr-0">
                <div className="text-lg font-semibold tracking-tight md:text-xl">{s.value}</div>
                <div className="mt-1 text-[11px] text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="px-6 py-24 md:py-32">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight md:text-3xl">
            How it works
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                step: "01",
                title: "Register",
                desc: "AI agents register with a programmable security policy — rate limits, allowlists, cooldowns.",
              },
              {
                step: "02",
                title: "Guard",
                desc: "Every transaction passes through the policy engine before reaching the Casper chain.",
              },
              {
                step: "03",
                title: "Log",
                desc: "Blocked transactions are recorded on-chain as violations — immutable audit trail.",
              },
              {
                step: "04",
                title: "Verify",
                desc: "Independent validators review blocked transactions and submit verdicts for finality.",
              },
            ].map((item) => (
              <div key={item.step}>
                <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.15em] text-emerald-400">
                  {item.step}
                </p>
                <h3 className="mb-2 text-sm font-semibold">{item.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Dashboard */}
      <section id="live" className="border-t border-zinc-800 px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight md:text-3xl">
            Live dashboard
          </h2>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <RefreshCw className="h-5 w-5 animate-spin text-zinc-500" />
              <span className="text-sm text-zinc-500">Loading live data...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-24">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={loadData} className="text-sm text-emerald-400 hover:underline">
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Agent table */}
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                  <Bot className="h-4 w-4" />
                  Protected agents
                </h3>
                <div className="overflow-hidden rounded-xl border border-zinc-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/50">
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                          Agent
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                          Health
                        </th>
                        <th className="hidden px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500 md:table-cell">
                          Txs
                        </th>
                        <th className="hidden px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500 md:table-cell">
                          Violations
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                          Risk
                        </th>
                        <th className="hidden px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500 sm:table-cell">
                          Cap
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {agents.map((agent) => (
                        <tr
                          key={agent.address}
                          className="cursor-pointer border-b border-zinc-800/50 last:border-0 transition-colors hover:bg-zinc-900/30"
                          onClick={() =>
                            setExpandedAgent(
                              expandedAgent === agent.address ? null : agent.address,
                            )
                          }
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${agent.paused ? "bg-red-400" : agent.healthScore >= 90 ? "bg-emerald-400" : "bg-amber-400"}`}
                              />
                              <span className="font-mono text-xs">{shortAddr(agent.address)}</span>
                              <ChevronDown
                                className={`h-3 w-3 text-zinc-600 transition-transform ${expandedAgent === agent.address ? "rotate-180" : ""}`}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-medium ${agent.healthScore >= 90 ? "text-emerald-400" : agent.healthScore >= 70 ? "text-amber-400" : "text-red-400"}`}
                            >
                              {agent.healthScore.toFixed(1)}%
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-zinc-400 md:table-cell">
                            {agent.totalTransactions.toLocaleString()}
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-zinc-400 md:table-cell">
                            {agent.violations}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${riskColor(agent.riskLevel)}`}
                            >
                              {agent.riskLevel}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-xs text-zinc-400 sm:table-cell">
                            {agent.activePolicy.maxCsprPerTx} CSPR
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Expanded agent detail */}
                {expandedAgent &&
                  (() => {
                    const a = agents.find((x) => x.address === expandedAgent);
                    if (!a) return null;
                    return (
                      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="font-mono text-xs text-zinc-300">{a.address}</span>
                          <button
                            onClick={() => setExpandedAgent(null)}
                            className="text-zinc-600 hover:text-zinc-300"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="mb-4 grid gap-3 sm:grid-cols-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                              Policy hash
                            </span>
                            <p className="font-mono text-xs text-zinc-300">{a.activePolicyHash}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                              Volume
                            </span>
                            <p className="text-xs text-zinc-300">{a.totalVolumeCspr} CSPR</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                              Health
                            </span>
                            <p className="text-xs text-zinc-300">{a.healthScore}%</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-500">
                              Status
                            </span>
                            <p className={`text-xs ${a.paused ? "text-red-400" : "text-emerald-400"}`}>
                              {a.paused ? "Paused" : "Active"}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {[
                            ["Per-tx cap", `${a.activePolicy.maxCsprPerTx} CSPR`],
                            ["Hourly cap", `${a.activePolicy.maxCsprPerHour} CSPR`],
                            ["Daily cap", `${a.activePolicy.maxCsprPerDay} CSPR`],
                            ["Cooldown", `${a.activePolicy.cooldownSeconds}s`],
                            ["Allowlist", `${a.activePolicy.allowlist.length} addresses`],
                            ["Blocklist", `${a.activePolicy.blocklist.length} addresses`],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-lg bg-zinc-900 p-3">
                              <span className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</span>
                              <p className="mt-0.5 text-xs font-medium text-zinc-200">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
              </div>

              {/* Violations + Validators */}
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Violation feed */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Violation feed
                  </h3>
                  <div className="max-h-[500px] space-y-3 overflow-y-auto pr-1">
                    {violations.map((v) => (
                      <div
                        key={v.id}
                        className={`rounded-xl border p-4 ${v.resolved ? "border-zinc-800 bg-transparent" : "border-red-500/10 bg-red-500/5"}`}
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">#{v.id}</span>
                            <span className="font-mono text-[10px] text-zinc-500">
                              {shortAddr(v.agent)}
                            </span>
                            <span className="text-[10px] text-zinc-600">{timeAgo(v.timestamp)}</span>
                          </div>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${v.resolved ? (v.validatorVerdict === "OVERTURNED" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400") : "bg-red-500/10 text-red-400"}`}
                          >
                            {v.resolved ? v.validatorVerdict || "RESOLVED" : "PENDING"}
                          </span>
                        </div>
                        <p className="mb-2 text-sm">{v.blockReason}</p>
                        {v.reviewReasoning && (
                          <p className="mb-2 text-xs italic text-zinc-500">
                            &ldquo;{v.reviewReasoning}&rdquo;
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-zinc-500">
                            {v.attemptedAmount} CSPR &rarr; {shortAddr(v.attemptedRecipient)}
                          </span>
                          {!v.resolved && (
                            <button
                              onClick={() => handleReview(v)}
                              disabled={reviewing === v.id}
                              className="rounded-lg bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                            >
                              {reviewing === v.id ? "Reviewing..." : "AI Review"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {violations.length === 0 && (
                      <div className="flex items-center gap-2 py-12 text-center text-zinc-500">
                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm">All clear — no pending violations</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validator network */}
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
                    <Server className="h-4 w-4" />
                    Validator network
                  </h3>
                  <div className="space-y-3">
                    {validators.map((v) => (
                      <div key={v.address} className="rounded-xl border border-zinc-800 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${v.active ? "bg-emerald-400" : "bg-red-400"}`}
                            />
                            <span className="font-mono text-xs">{shortAddr(v.address)}</span>
                          </div>
                          <span
                            className={`text-sm font-semibold ${v.reputationScore >= 90 ? "text-emerald-400" : v.reputationScore >= 70 ? "text-amber-400" : "text-red-400"}`}
                          >
                            {v.reputationScore}%
                          </span>
                        </div>
                        {healthBar(v.reputationScore)}
                        <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
                          <span>{v.totalReviews} reviews</span>
                          <span>{v.correctVerdicts} correct</span>
                          <span>{v.stakedAmount} CSPR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between text-xs text-zinc-500">
          <span>FlawSeeking — Built for Casper Agentic Buildathon 2026</span>
          <a
            href="https://github.com/subheeksh5599/FlawSeeking"
            target="_blank"
            className="transition-colors hover:text-zinc-300"
            rel="noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
