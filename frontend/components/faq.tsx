"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is FlawSeeking and how does it protect AI agents?",
    answer:
      "FlawSeeking is a programmable security middleware deployed as Odra smart contracts on Casper Network. It sits between any AI agent and the blockchain, checking every transaction against a configurable policy before it executes. Violations are blocked, logged immutably on-chain, and reviewed by independent AI validator agents.",
  },
  {
    question: "How do validators work and how are they paid?",
    answer:
      "Independent AI validators — running different models (Claude, GPT, Gemini) — subscribe to violation events via SSE. They review each blocked transaction, submit verdicts on-chain, and earn x402 micropayment fees per review. Validators stake CSPR to join the network and get slashed for bad verdicts. Truth is profitable.",
  },
  {
    question: "What policies can I set for my agent?",
    answer:
      "You can configure rate limits (max CSPR/hour, CSPR/day), per-transaction size caps, recipient allowlists and blocklists, cooldown periods between transactions, and multi-sig gates. Policies are upgradeable Odra contracts — change your rules anytime without migrating.",
  },
  {
    question: "Does FlawSeeking take custody of my agent's funds?",
    answer:
      "No. FlawSeeking is a non-custodial proxy. Your agent's private keys stay with you. FlawSeeking only checks transactions against policy before forwarding them — it never holds, controls, or has access to your funds. Your agent stays fully non-custodial.",
  },
  {
    question: "What chain does FlawSeeking run on?",
    answer:
      "FlawSeeking is built on Casper Network (Testnet) for the Casper Agentic Buildathon 2026. Smart contracts are written in Odra (Rust → WASM), the SDK wraps casper-js-sdk v5, and payments use the x402 HTTP-native micropayment protocol. Full mainnet launch planned post-hackathon.",
  },
];

function FAQItemComponent({
  item,
  isOpen,
  onToggle,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      className="rounded-2xl bg-muted/50"
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-base font-medium text-foreground">
          {item.question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="shrink-0"
        >
          <Plus className="h-5 w-5 text-foreground" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 text-muted-foreground">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ(): ReactNode {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="px-4 py-20 sm:px-6 md:py-28 lg:px-8 border-t border-foreground/10">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-6">
            <p className="text-4xl text-foreground font-medium tracking-tight">
              Securing the agent economy
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="flex flex-col gap-3">
              {faqs.map((faq, index) => (
                <FAQItemComponent
                  key={faq.question}
                  item={faq}
                  isOpen={openIndex === index}
                  onToggle={() => handleToggle(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
