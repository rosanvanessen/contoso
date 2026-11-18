# Contoso Basic Scheme 2026 — business rules (FICTIONAL)

> ⚠️ Training material. Inspired by Dutch career-average schemes but **simplified and invented**. Never use for advice.
> Franchise and salary cap echo the **public Dutch fiscal limits for 2024**; every other parameter is invented for the workshop. Contoso is fictional.
> Code: `api/src/domain/scheme.ts` (parameters) and `api/src/domain/pension.ts` (rules).

| Parameter | Value |
|---|---|
| Franchise (full-time) | € 17,545 |
| Salary cap (full-time) | € 137,800 |
| Accrual rate | 1.75 % of pensionable salary per year |
| Standard retirement age | 68 |
| Earliest early-retirement age | 60 |
| Early-retirement reduction | 6.5 % per year before 68 (simple, not compounding) |
| Contribution | 27 % of pensionable salary — 60 % employer / 40 % employee |

## Rules

| ID | Rule | Example |
|---|---|---|
| **R1** | **Pensionable salary** = (min(full-time salary, cap) − franchise) × part-time factor. Never below 0. Salaries are stored as **full-time** amounts. | € 46,000 at 60 % → (46,000 − 17,545) × 0.6 = **€ 17,073** |
| **R2** | **Yearly accrual** = 1.75 % × pensionable salary. Rounded to cents. | € 17,073 → **€ 298.78** per year |
| **R3** | **Accrued pension** = sum of the yearly accruals in the contribution history (career average). | 3 years × € 500.00 = € 1,500.00 per year |
| **R4** | **Projection** at 68 = accrued pension + accrual for every remaining whole year until 68 (same part-time factor; optional salary growth). | — |
| **R5** | **Early retirement** between 60 and 67: accrual stops at the early date; the total yearly pension is reduced by 6.5 % × (68 − retirement age). Ages below 60, above 68 or below the member's current age are rejected (HTTP 422). | retire at 63 → reduction 5 × 6.5 % = **32.5 %** |
| **R6** | **Contribution** = 27 % × pensionable salary; employer pays 60 %, employee 40 %. | € 10,000 → € 1,620 employer / € 1,080 employee |
| **R7** | The **annual statement** shows the CURRENT pensionable salary and this year's accrual using the member's **current** salary **and part-time factor** (R1). | M-1003: € 17,073 / € 298.78 |
