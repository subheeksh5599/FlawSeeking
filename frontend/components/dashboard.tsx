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
} from "lucide-react";

interface Agent {
  address: string;
  agent: string;
  registered: boolean;
  policyHash: string;
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
  switch (level) {
    case "LOW":
      return "text-green-400 bg-green-500/10";
    case "MEDIUM":
      return "text-amber-400 bg-amber-500/10";
    case "HIGH":
      return "text-orange-400 bg-orange-500/10";
    case "CRITICAL":
      return "text-red-400 bg-red-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

function healthBar(score: number) {
  const c =
    score >= 90
      ? "bg-green-400"
      : score >= 70
        ? "bg-amber-400"
        : "bg-red-400";
  return (
    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={`h-full rounded-full ${c}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function Dashboard(): ReactNode {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [stats, setStats] = useState<EcosystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

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
        console.error("Failed to load ecosystem data:", e);
        setError("Failed to load data. Check your connection and try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    Promise.all([
      fetch(
        "/api/agents/01a3b5c7d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5/health",
      ).then((r) => r.json()).catch(() => null),
      fetch(
        "/api/agents/01f4a2b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8/health",
      ).then((r) => r.json()).catch(() => null),
      fetch(
        "/api/agents/01b000d000e000f000a000d0000000000dead/health",
      ).then((r) => r.json()).catch(() => null),
      fetch(
        "/api/validators/01val00000000000000000000000000000001",
      ).then((r) => r.json()).catch(() => null),
      fetch(
        "/api/validators/01val00000000000000000000000000000002",
      ).then((r) => r.json()).catch(() => null),
      fetch(
        "/api/validators/01val00000000000000000000000000000003",
      ).then((r) => r.json()).catch(() => null),
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
      console.error("Review failed:", e);
    }
    setReviewing(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 sticky top-0 z-40 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                <Shield className="h-4 w-4 text-green-400" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                FlawSeeking
              </span>
              <span className="inline-block rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                Dashboard
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={loadData}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <a
                href="https://github.com/subheeksh5599/FlawSeeking"
                target="_blank"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                rel="noreferrer"
              >
                Docs &rarr;
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading agent data...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
            <button onClick={loadData} className="text-sm text-green-400 hover:underline">Retry</button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Ecosystem Stats */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {[
                  {
                    label: "Agents Protected",
                    value: stats?.totalAgents ?? 0,
                    icon: Bot,
                  },
                  {
                    label: "Validators",
                    value: stats?.totalValidators ?? 0,
                    icon: Server,
                  },
                  {
                    label: "Txs Guarded",
                    value: (stats?.totalTransactions ?? 0).toLocaleString(),
                    icon: Shield,
                  },
                  {
                    label: "Violations Blocked",
                    value: stats?.totalViolations ?? 0,
                    icon: AlertTriangle,
                  },
                  {
                    label: "Active Alerts",
                    value: stats?.activeViolations ?? 0,
                    icon: Zap,
                  },
                  {
                    label: "Uptime",
                    value: stats?.networkUptime ?? "--",
                    icon: Activity,
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl bg-muted/50 p-4 text-center"
                  >
                    <s.icon className="w-5 h-5 text-green-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-foreground">
                      {s.value}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

            {/* Agent List */}
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Bot className="w-5 h-5 text-green-400" />
                Protected Agents
              </h2>
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Agent
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Health
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Txs
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                        Violations
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                        Policy
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {agents.map((agent) => (
                      <tr
                        key={agent.address}
                        className="border-b border-border/30 last:border-0 hover:bg-muted/20 cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedAgent(
                            expandedAgent === agent.address
                              ? null
                              : agent.address,
                          )
                        }
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${agent.paused ? "bg-red-400" : agent.healthScore >= 90 ? "bg-green-400" : "bg-amber-400"}`}
                            />
                            <span className="font-mono text-foreground">
                              {shortAddr(agent.address)}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedAgent === agent.address ? "rotate-180" : ""}`}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${agent.healthScore >= 90 ? "text-green-400" : agent.healthScore >= 70 ? "text-amber-400" : "text-red-400"}`}
                            >
                              {agent.healthScore.toFixed(1)}%
                            </span>
                            {healthBar(agent.healthScore)}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                          {agent.totalTransactions.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                          {agent.violations}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${riskColor(agent.riskLevel)}`}
                          >
                            {agent.riskLevel}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground hidden sm:table-cell">
                          {agent.activePolicy.maxCsprPerTx} CSPR/tx
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Agent Expanded Detail */}
            {expandedAgent && (() => {
              const agent = agents.find(a => a.address === expandedAgent);
              if (!agent) return null;
              return (
                <section className="rounded-xl border border-border/50 bg-muted/20 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-foreground font-mono">
                      {agent.address}
                    </h3>
                    <button
                      onClick={() => setExpandedAgent(null)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
                    <div>
                      <span className="text-xs text-muted-foreground">Policy Hash</span>
                      <p className="text-sm font-mono text-foreground">{agent.activePolicyHash}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Total Volume</span>
                      <p className="text-sm text-foreground">{agent.totalVolumeCspr} CSPR</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Health Score</span>
                      <p className="text-sm text-foreground">{agent.healthScore}%</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <p className={`text-sm ${agent.paused ? "text-red-400" : "text-green-400"}`}>
                        {agent.paused ? "Paused" : "Active"}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 text-xs">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-muted-foreground">Per-Tx Cap</span>
                      <p className="text-foreground font-semibold">{agent.activePolicy.maxCsprPerTx} CSPR</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-muted-foreground">Hourly Cap</span>
                      <p className="text-foreground font-semibold">{agent.activePolicy.maxCsprPerHour} CSPR</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-muted-foreground">Daily Cap</span>
                      <p className="text-foreground font-semibold">{agent.activePolicy.maxCsprPerDay} CSPR</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-muted-foreground">Cooldown</span>
                      <p className="text-foreground font-semibold">{agent.activePolicy.cooldownSeconds}s</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-muted-foreground">Allowlist</span>
                      <p className="text-foreground font-semibold">{agent.activePolicy.allowlist.length} addresses</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <span className="text-muted-foreground">Blocklist</span>
                      <p className="text-foreground font-semibold">{agent.activePolicy.blocklist.length} addresses</p>
                    </div>
                  </div>
                </section>
              );
            })()}

            {/* Two-column: Violations + Validators */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Violation Feed */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Violation Feed
                </h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {violations.map((v) => (
                    <div
                      key={v.id}
                      className={`rounded-xl p-4 ${v.resolved ? "bg-muted/30" : "bg-red-500/5 border border-red-500/10"}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs text-muted-foreground">
                            #{v.id}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {shortAddr(v.agent)}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {timeAgo(v.timestamp)}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${v.resolved ? (v.validatorVerdict === "OVERTURNED" ? "bg-amber-500/10 text-amber-400" : "bg-green-500/10 text-green-400") : "bg-red-500/10 text-red-400"}`}
                        >
                          {v.resolved
                            ? v.validatorVerdict || "RESOLVED"
                            : "PENDING"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mb-2">
                        {v.blockReason}
                      </p>
                      {v.reviewReasoning && (
                        <p className="text-xs text-muted-foreground mb-2 italic">
                          &ldquo;{v.reviewReasoning}&rdquo;
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {v.attemptedAmount} CSPR &rarr;{" "}
                          {shortAddr(v.attemptedRecipient)}
                        </span>
                        {!v.resolved && (
                          <button
                            onClick={() => handleReview(v)}
                            disabled={reviewing === v.id}
                            className="text-xs px-3 py-1 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                          >
                            {reviewing === v.id
                              ? "Running AI review..."
                              : "AI Review"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {violations.length === 0 && (
                    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      All clear — no violations
                    </div>
                  )}
                </div>
              </section>

              {/* Validator Network */}
              <section>
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5 text-green-400" />
                  Validator Network
                </h2>
                <div className="space-y-3">
                  {validators.map((v) => (
                    <div key={v.address} className="rounded-xl bg-muted/50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${v.active ? "bg-green-400" : "bg-red-400"}`}
                          />
                          <span className="text-sm font-medium font-mono text-foreground">
                            {shortAddr(v.address)}
                          </span>
                        </div>
                        <span
                          className={`text-sm font-bold ${v.reputationScore >= 90 ? "text-green-400" : v.reputationScore >= 70 ? "text-amber-400" : "text-red-400"}`}
                        >
                          {v.reputationScore}%
                        </span>
                      </div>
                      {healthBar(v.reputationScore)}
                      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                        <span>{v.totalReviews} reviews</span>
                        <span>{v.correctVerdicts} correct</span>
                        <span>{v.stakedAmount} CSPR</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-xl border border-border/50 p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-2">
                    How it works
                  </h3>
                  <ol className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                    <li>
                      1. AI agents register their policy (rate limits,
                      allowlists, cooldowns) with the FlawSeeking proxy contract
                      on Casper Testnet.
                    </li>
                    <li>
                      2. Every agent transaction passes through the policy
                      engine before reaching the blockchain.
                    </li>
                    <li>
                      3. Blocked transactions are logged on-chain as violations,
                      creating an immutable audit trail.
                    </li>
                    <li>
                      4. Independent validators (AI models + humans) review
                      blocked transactions and submit verdicts.
                    </li>
                  </ol>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
