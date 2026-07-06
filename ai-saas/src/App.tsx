import { Shield, Zap, Activity, Lock, BarChart3, ChevronRight, Github } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <HowItWorks />
      <Stats />
      <Features />
      <CTASection />
      <Footer />
    </div>
  )
}

function Nav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-xl border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Shield className="w-7 h-7 text-brand-400" />
          <span className="text-xl font-bold tracking-tight">FlawSeeking</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
            Casper Testnet
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#how" className="hover:text-white transition-colors">How it Works</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="https://github.com/subheeksh5599/FlawSeeking" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-black font-semibold hover:bg-brand-400 transition-colors">
            <Zap className="w-4 h-4" />
            Launch App
          </a>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="relative pt-32 pb-24 px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand-500/5 rounded-full blur-[120px]" />
      </div>
      <div className="max-w-4xl mx-auto text-center relative">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm mb-8">
          <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          Live on Casper Testnet — Agentic Buildathon 2026
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          Every AI agent on Casper
          <br />
          <span className="gradient-text">needs a seatbelt.</span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          FlawSeeking is the programmable security middleware for autonomous AI agents.
          A smart contract proxy that blocks rogue transactions, logs violations on-chain,
          and pays an independent validator network to verify every decision.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="#" className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-500 text-black font-semibold hover:bg-brand-400 transition-all glow">
            <Zap className="w-5 h-5" />
            Integrate Your Agent
          </a>
          <a href="https://github.com/subheeksh5599/FlawSeeking" className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white transition-all">
            <Github className="w-5 h-5" />
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { icon: Shield, title: 'Agent Registers', desc: 'Your AI agent enrolls with FlawSeeking and sets its policy — rate limits, allowlists, caps, and cooldowns.', color: 'text-brand-400' },
    { icon: Activity, title: 'Tx Goes Through Proxy', desc: 'Every transaction passes through the FlawSeeking proxy contract. The policy engine checks it in under 200ms.', color: 'text-blue-400' },
    { icon: Lock, title: 'Violation Blocked', desc: 'If a tx breaks policy, it is blocked and logged immutably on-chain with full reasoning — an auditable trail forever.', color: 'text-red-400' },
    { icon: Zap, title: 'Validators Review', desc: 'Independent AI agents (Claude, GPT-4o, Gemini) review the violation, submit verdicts on-chain, and earn x402 fees.', color: 'text-amber-400' },
  ]

  return (
    <section id="how" className="py-24 px-6 bg-zinc-900/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
          Four steps from agent registration to verified on-chain security. No human in the loop. Everything auditable.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="gradient-border p-6 relative group hover:border-brand-500/40 transition-all">
              <div className="text-xs text-zinc-600 mb-3">{String(i + 1).padStart(2, '0')}</div>
              <step.icon className={`w-8 h-8 ${step.color} mb-4`} />
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Stats() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="gradient-border glow p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '47', label: 'Agents Protected', suffix: '' },
              { value: '2,841', label: 'Transactions Guarded', suffix: '' },
              { value: '156', label: 'Violations Blocked', suffix: '' },
              { value: '99.97%', label: 'Network Uptime', suffix: '' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-zinc-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Features() {
  const features = [
    { icon: Shield, title: 'Shared Security Layer', desc: 'One protocol, every agent. Stop reinventing security per-project. FlawSeeking is the single point of defense for the entire Casper agent economy.' },
    { icon: Activity, title: 'Pluggable Policies', desc: 'Rate limits, allowlists, size caps, cooldowns, multi-sig gates. Deploy your own policy as an Odra contract or use a community template.' },
    { icon: Lock, title: 'Immutable Audit Trail', desc: 'Every blocked transaction and every validator verdict is permanently logged on Casper. Audit any agent\'s history at any time.' },
    { icon: Zap, title: 'x402 Validator Payments', desc: 'Validators stake CSPR, earn fees per review via x402 micropayments, and get slashed for bad verdicts. Truth is profitable.' },
    { icon: BarChart3, title: 'Agent Health Dashboard', desc: 'Real-time compliance scores, violation feeds, risk levels, and validator reputation. Know the health of every agent in the ecosystem.' },
    { icon: Github, title: 'Open Source + MCP Native', desc: 'Full TypeScript SDK, MCP server for AI queries, and Odra contracts — all open source. Agents integrate in 5 lines of code.' },
  ]

  return (
    <section id="features" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why FlawSeeking</h2>
        <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
          Built from first principles for the agent economy. Not a bolt-on. Not an afterthought. The infrastructure layer.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-6 border border-zinc-800 rounded-xl hover:border-brand-500/30 transition-all group">
              <f.icon className="w-10 h-10 text-brand-400 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-semibold mb-3">{f.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <div className="gradient-border glow-strong p-12">
          <Shield className="w-12 h-12 text-brand-400 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to secure your agent?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
            Drop FlawSeeking in front of your agent today. 5 lines of SDK code.
            Your agent stays non-custodial. FlawSeeking stays the gatekeeper.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#" className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-500 text-black font-semibold hover:bg-brand-400 transition-all">
              Start Building <ChevronRight className="w-4 h-4" />
            </a>
            <a href="https://github.com/subheeksh5599/FlawSeeking" className="flex items-center gap-2 px-8 py-3.5 rounded-xl border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-all">
              <Github className="w-4 h-4" />
              Star on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-zinc-800/50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 text-zinc-500">
          <Shield className="w-5 h-5 text-brand-400" />
          <span className="font-semibold text-zinc-300">FlawSeeking</span>
          <span className="text-zinc-600">·</span>
          <span>Casper Agentic Buildathon 2026</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <a href="https://github.com/subheeksh5599/FlawSeeking" className="hover:text-white transition-colors">GitHub</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
          <a href="#" className="hover:text-white transition-colors">Discord</a>
        </div>
      </div>
    </footer>
  )
}
