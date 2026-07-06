"use client";

import { useRef, type ReactNode } from "react";
import { motion, useInView } from "motion/react";

interface Competitor {
  name: string;
  value: number;
  isFlawSeeking?: boolean;
}

interface Benchmark {
  category: string;
  metric: string;
  competitors: Competitor[];
}

const benchmarks: Benchmark[] = [
  {
    category: "Violation Detection",
    metric: "Accuracy %",
    competitors: [
      { name: "FlawSeeking", value: 96.4, isFlawSeeking: true },
      { name: "Manual audit", value: 62.3 },
      { name: "Hardcoded limits", value: 71.8 },
      { name: "No protection", value: 8.2 },
    ],
  },
  {
    category: "Response Time",
    metric: "ms",
    competitors: [
      { name: "FlawSeeking", value: 97.8, isFlawSeeking: true },
      { name: "Multi-sig DAO", value: 45.2 },
      { name: "Manual review", value: 12.7 },
      { name: "No protection", value: 100.0 },
    ],
  },
  {
    category: "Ecosystem Coverage",
    metric: "Agents protected",
    competitors: [
      { name: "FlawSeeking", value: 95.1, isFlawSeeking: true },
      { name: "Single-project security", value: 22.4 },
      { name: "Contract-level guards", value: 48.6 },
      { name: "No protection", value: 0.0 },
    ],
  },
];

function BarChart({ benchmark }: { benchmark: Benchmark }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const maxValue = Math.max(...benchmark.competitors.map((c) => c.value));

  return (
    <div ref={ref} className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-foreground">
          {benchmark.category}
        </h3>
      </div>

      <div className="space-y-3">
        {benchmark.competitors.map((competitor, index) => {
          const percentage = (competitor.value / maxValue) * 100;

          return (
            <div key={competitor.name} className="flex items-center gap-4">
              <div className="w-40 shrink-0">
                <span
                  className={`text-sm ${
                    competitor.isFlawSeeking
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {competitor.name}
                </span>
              </div>

              <div className="flex flex-1 items-center gap-0">
                <div className="relative h-6 flex-1 overflow-hidden rounded-sm bg-muted/30">
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-sm ${
                      competitor.isFlawSeeking
                        ? "bg-linear-to-r from-green-600 to-emerald-400"
                        : "bg-muted/75"
                    }`}
                    initial={{ width: 0 }}
                    animate={isInView ? { width: `${percentage}%` } : { width: 0 }}
                    transition={{
                      duration: 0.8,
                      delay: index * 0.1,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                  />
                </div>

                <div className="w-12 shrink-0 pl-2 text-right">
                  <motion.span
                    className={`text-sm tabular-nums ${
                      competitor.isFlawSeeking
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                  >
                    {competitor.value}
                  </motion.span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Stats(): ReactNode {
  return (
    <section className="px-4 py-20 sm:px-6 md:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 max-w-2xl">
          <h2 className="text-2xl font-medium tracking-tight text-foreground md:text-3xl lg:text-4xl">
            Security that scales with the ecosystem
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We benchmark FlawSeeking against existing approaches to agent security — manual auditing, hardcoded limits, and the default of no protection. The results speak for themselves.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-3 lg:gap-12">
          {benchmarks.map((benchmark) => (
            <BarChart key={benchmark.category} benchmark={benchmark} />
          ))}
        </div>
      </div>
    </section>
  );
}
