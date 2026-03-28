import { loanSchedule } from "@finprecise/loans";
import type { LoanSchedule, ScheduleRow } from "@finprecise/loans";

export type RepaymentMethod = "level-payment" | "level-principal";
export type PrepaymentStrategy = "shorten-term" | "reduce-payment";

export interface LoanInput {
  principal: number;
  years: number;
  annualRate: number;
  method: RepaymentMethod;
  rateChanges?: { fromYear: number; annualRate: number }[];
  prepayments?: {
    atYear: number;
    amount: number;
    strategy: PrepaymentStrategy;
  }[];
}

export interface SimulationResult {
  schedule: LoanSchedule;
  rows: ScheduleRow[];
  monthlyPaymentFirst: number;
  totalPayment: number;
  totalInterest: number;
  effectivePeriods: number;
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validate(input: LoanInput): ValidationError[] {
  const errors: ValidationError[] = [];
  if (input.principal <= 0) {
    errors.push({ field: "principal", message: "借入金額は1円以上にしてください" });
  }
  if (input.years < 1 || input.years > 50) {
    errors.push({ field: "years", message: "返済期間は1〜50年で指定してください" });
  }
  if (input.annualRate < 0) {
    errors.push({ field: "annualRate", message: "金利は0%以上にしてください" });
  }
  if (input.annualRate === 0 && input.method === "level-payment") {
    errors.push({ field: "annualRate", message: "元利均等返済では金利0%は使用できません" });
  }
  for (const rc of input.rateChanges ?? []) {
    if (rc.fromYear < 2 || rc.fromYear > input.years) {
      errors.push({ field: "rateChanges", message: `金利変更の${rc.fromYear}年目は返済期間外です` });
    }
  }
  for (const p of input.prepayments ?? []) {
    if (p.atYear < 1 || p.atYear > input.years) {
      errors.push({ field: "prepayments", message: `繰上返済の${p.atYear}年目は返済期間外です` });
    }
    if (p.amount <= 0) {
      errors.push({ field: "prepayments", message: "繰上返済額は1円以上にしてください" });
    }
    if (p.amount >= input.principal) {
      errors.push({ field: "prepayments", message: "繰上返済額が借入金額以上です" });
    }
  }
  return errors;
}

export function simulate(input: LoanInput): SimulationResult {
  const errors = validate(input);
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }

  const periods = input.years * 12;

  const rateSteps = [
    { from: 1, annualRate: String(input.annualRate / 100) },
    ...(input.rateChanges ?? []).map((rc) => ({
      from: (rc.fromYear - 1) * 12 + 1,
      annualRate: String(rc.annualRate / 100),
    })),
  ];

  const prepayments = (input.prepayments ?? []).map((p) => ({
    period: (p.atYear - 1) * 12 + 1,
    amount: String(p.amount),
    strategy: p.strategy,
  }));

  const schedule = loanSchedule({
    principal: String(input.principal),
    periods,
    repayment: { kind: input.method },
    rateSteps,
    accrual: { dayCount: "30/360", compounding: "monthly" },
    rounding: {
      interest: "half-up",
      payment: "half-up",
      balance: "half-up",
      scale: 0,
    },
    prepayments,
  });

  return {
    schedule,
    rows: schedule.rows,
    monthlyPaymentFirst: schedule.rows[0]?.payment.toNumber() ?? 0,
    totalPayment: schedule.summary.totalPayment.toNumber(),
    totalInterest: schedule.summary.totalInterest.toNumber(),
    effectivePeriods: schedule.summary.effectivePeriods,
  };
}

export function serializeInput(input: LoanInput): URLSearchParams {
  const params = new URLSearchParams();
  params.set("p", String(input.principal));
  params.set("y", String(input.years));
  params.set("r", String(input.annualRate));
  params.set("m", input.method);
  if (input.rateChanges && input.rateChanges.length > 0) {
    params.set(
      "rc",
      input.rateChanges.map((rc) => `${rc.fromYear}:${rc.annualRate}`).join(",")
    );
  }
  if (input.prepayments && input.prepayments.length > 0) {
    params.set(
      "pp",
      input.prepayments
        .map((p) => `${p.atYear}:${p.amount}:${p.strategy === "shorten-term" ? "s" : "r"}`)
        .join(",")
    );
  }
  return params;
}

export function deserializeInput(
  params: URLSearchParams,
  defaults: LoanInput
): LoanInput {
  const p = params.get("p");
  const y = params.get("y");
  const r = params.get("r");
  const m = params.get("m");
  const rc = params.get("rc");
  const pp = params.get("pp");

  const input: LoanInput = {
    principal: p ? Number(p) : defaults.principal,
    years: y ? Number(y) : defaults.years,
    annualRate: r ? Number(r) : defaults.annualRate,
    method:
      m === "level-payment" || m === "level-principal"
        ? m
        : defaults.method,
    rateChanges: [],
    prepayments: [],
  };

  if (rc) {
    input.rateChanges = rc.split(",").map((s) => {
      const [fromYear, annualRate] = s.split(":");
      return { fromYear: Number(fromYear), annualRate: Number(annualRate) };
    });
  }

  if (pp) {
    input.prepayments = pp.split(",").map((s) => {
      const [atYear, amount, strategy] = s.split(":");
      return {
        atYear: Number(atYear),
        amount: Number(amount),
        strategy: (strategy === "r" ? "reduce-payment" : "shorten-term") as PrepaymentStrategy,
      };
    });
  }

  return input;
}

export function formatJPY(value: number): string {
  return new Intl.NumberFormat("ja-JP").format(Math.round(value));
}

export function formatYenMan(value: number): string {
  const man = value / 10000;
  if (man >= 1) {
    return `${new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 1 }).format(man)}万円`;
  }
  return `${formatJPY(value)}円`;
}
