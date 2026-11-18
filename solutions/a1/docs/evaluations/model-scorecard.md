# Model scorecard — rule R1 (pensionableSalary)

> 🧪 **EXAMPLE — filled in by the workshop team for illustration.** Your own scorecard will differ: other models, other edge cases, other verdict.
> One run is a sample, not a benchmark. Synthetic data only — never paste secrets or real member data.

| | Model A | Model B |
|---|---|---|
| Model (name as shown in the picker) | *a fast, lightweight model* (example) | *a deep-reasoning model* (example) |
| Harness · Mode · Permissions | Copilot · Interactive · Manual | Copilot · Interactive · Manual |
| Reasoning effort | | |
| Date | 2026-11-18 | 2026-11-18 |

## What each model proposed (example)

| # | Input (salary, factor) | Model A expected | Model B expected | Real output (`node -e`) | A | B |
|---|---|---|---|---|---|---|
| 1 | 17545, 1 (exactly the franchise) | 0 | 0 | `0` | ✅ | ✅ |
| 2 | 137801, 1 (just above the cap) | 120256 | 120255 | `120255` | ❌ | ✅ |
| 3 | 46000, 0.6 (part-time) | 17073 | 17073 | `17073` | ✅ | ✅ |
| 4 | 16000, 0.9 (below franchise) | -1390.5 | 0 | `0` | ❌ | ✅ |
| 5 (A) | 100000, 0.5 | 41227.5 | — | `41227.5` | ✅ | |
| 5 (B) | 50000, 0 (invalid factor) | — | throws RangeError | `RangeError: partTimeFactor must be greater than 0 and at most 1` | | ✅ |

## Scores

| Criterion | How to score | Model A | Model B |
|---|---|---|---|
| Correctness verified | Expected values that match the `node -e` output (x / 5) | 3/5 | 5/5 |
| Edge cases found | Which did it cover? franchise boundary · salary cap · part-time · below franchise → 0 · invalid factor (0 or > 1) · negative salary | franchise, cap, part-time, below franchise (missed: invalid factor, negative salary) | franchise, cap, part-time, below franchise, invalid factor (missed: negative salary) |
| Hallucinations | Invented functions, parameters, files or rules? List them (none = 👍) | Ignored the "never below 0" clamp (-1390.5); used the uncapped salary for #2 | none 👍 |
| Latency feel | fast / ok / slow | fast | slow |
| Cost / credits | Relative cost of the model (supported-models doc) — heavier model = more AI credits | low | high |

## Verification output

```text
$ node -e "import('./api/src/domain/pension.ts').then(m=>{for (const [s,f] of [[17545,1],[137801,1],[46000,0.6],[16000,0.9],[100000,0.5],[50000,0]]) {try{console.log(s,f,m.pensionableSalary(s,f))}catch(e){console.log(s,f,e.name+': '+e.message)}}})"
17545 1 0
137801 1 120255
46000 0.6 17073
16000 0.9 0
100000 0.5 41227.5
50000 0 RangeError: partTimeFactor must be greater than 0 and at most 1
```

## Verdict

- For **this kind of task** (finding edge cases in a business rule) I would use: **Model B** (deep reasoning).
- Because: all 5 values were correct and it found the invalid-input case; Model A was faster and cheaper but got 2 of 5 wrong.
- Would I trust it **without** the `node -e` check? **No** — even Model B missed the negative-salary case; only running the real code proves the values.
- To make this a real benchmark I would need: 10+ tasks, 3+ runs per model, the same scoring rule, and the credit usage per run.
