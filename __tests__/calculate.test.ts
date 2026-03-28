import { describe, it, expect } from "vitest";
import {
  simulate,
  validate,
  formatJPY,
  formatYenMan,
  serializeInput,
  deserializeInput,
  type LoanInput,
} from "../lib/calculate";

const baseInput: LoanInput = {
  principal: 35000000,
  years: 35,
  annualRate: 0.5,
  method: "level-payment",
  rateChanges: [],
  prepayments: [],
};

// ─── simulate() ───

describe("simulate", () => {
  it("35年 3500万 0.5% 元利均等の基本計算", () => {
    const result = simulate(baseInput);
    expect(result.rows.length).toBe(420);
    expect(result.effectivePeriods).toBe(420);
    expect(result.monthlyPaymentFirst).toBeGreaterThan(0);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalPayment).toBeGreaterThan(baseInput.principal);
  });

  it("元金均等では初回返済額 > 最終回返済額", () => {
    const result = simulate({ ...baseInput, method: "level-principal" });
    const first = result.rows[0].payment.toNumber();
    const last = result.rows[result.rows.length - 1].payment.toNumber();
    expect(first).toBeGreaterThan(last);
  });

  it("返済期間1年 = 12回", () => {
    const result = simulate({ ...baseInput, years: 1, annualRate: 1 });
    expect(result.effectivePeriods).toBe(12);
  });

  it("繰上返済(期間短縮)で返済回数が減る", () => {
    const withoutPrepay = simulate(baseInput);
    const withPrepay = simulate({
      ...baseInput,
      prepayments: [{ atYear: 3, amount: 5000000, strategy: "shorten-term" }],
    });
    expect(withPrepay.effectivePeriods).toBeLessThan(
      withoutPrepay.effectivePeriods
    );
  });

  it("繰上返済(返済額軽減)で月額が減る", () => {
    const withPrepay = simulate({
      ...baseInput,
      prepayments: [{ atYear: 3, amount: 5000000, strategy: "reduce-payment" }],
    });
    // 繰上返済後の返済額は初回より安い
    const afterPrepayPeriod = (3 - 1) * 12 + 2; // period after prepayment
    const afterRow = withPrepay.rows.find((r) => r.period === afterPrepayPeriod);
    expect(afterRow).toBeDefined();
    expect(afterRow!.payment.toNumber()).toBeLessThan(
      withPrepay.monthlyPaymentFirst
    );
  });

  it("変動金利で金利変更が反映される", () => {
    const result = simulate({
      ...baseInput,
      years: 10,
      rateChanges: [{ fromYear: 6, annualRate: 2.0 }],
    });
    const period60 = result.rows.find((r) => r.period === 60)!;
    const period61 = result.rows.find((r) => r.period === 61)!;
    expect(period60.annualRate.toNumber()).toBeCloseTo(0.005, 5);
    expect(period61.annualRate.toNumber()).toBeCloseTo(0.02, 5);
  });

  it("総元金 = 借入金額", () => {
    const result = simulate(baseInput);
    const totalPrincipal = result.rows.reduce(
      (sum, r) => sum + r.principal.toNumber(),
      0
    );
    expect(Math.round(totalPrincipal)).toBe(baseInput.principal);
  });
});

// ─── validate() ───

describe("validate", () => {
  it("正常入力でエラーなし", () => {
    expect(validate(baseInput)).toEqual([]);
  });

  it("金利0% + 元利均等でエラー", () => {
    const errors = validate({ ...baseInput, annualRate: 0 });
    expect(errors.some((e) => e.field === "annualRate")).toBe(true);
  });

  it("金利0% + 元金均等はOK", () => {
    const errors = validate({
      ...baseInput,
      annualRate: 0,
      method: "level-principal",
    });
    expect(errors.some((e) => e.field === "annualRate")).toBe(false);
  });

  it("繰上返済額 >= 借入金額でエラー", () => {
    const errors = validate({
      ...baseInput,
      prepayments: [{ atYear: 3, amount: 35000000, strategy: "shorten-term" }],
    });
    expect(errors.some((e) => e.field === "prepayments")).toBe(true);
  });

  it("金利変更年が返済期間外でエラー", () => {
    const errors = validate({
      ...baseInput,
      years: 10,
      rateChanges: [{ fromYear: 11, annualRate: 2 }],
    });
    expect(errors.some((e) => e.field === "rateChanges")).toBe(true);
  });

  it("繰上返済年が返済期間外でエラー", () => {
    const errors = validate({
      ...baseInput,
      years: 10,
      prepayments: [{ atYear: 11, amount: 1000000, strategy: "shorten-term" }],
    });
    expect(errors.some((e) => e.field === "prepayments")).toBe(true);
  });

  it("借入金額0以下でエラー", () => {
    const errors = validate({ ...baseInput, principal: 0 });
    expect(errors.some((e) => e.field === "principal")).toBe(true);
  });
});

// ─── formatJPY / formatYenMan ───

describe("formatJPY", () => {
  it("カンマ区切りで円表示", () => {
    expect(formatJPY(1234567)).toBe("1,234,567");
  });

  it("小数は四捨五入", () => {
    expect(formatJPY(1234.6)).toBe("1,235");
  });

  it("0は0", () => {
    expect(formatJPY(0)).toBe("0");
  });
});

describe("formatYenMan", () => {
  it("1万以上は万円表示", () => {
    expect(formatYenMan(35000000)).toBe("3,500万円");
  });

  it("1万未満は円表示", () => {
    expect(formatYenMan(5000)).toBe("5,000円");
  });
});

// ─── serialize / deserialize ───

describe("serializeInput / deserializeInput", () => {
  it("基本パラメータのラウンドトリップ", () => {
    const params = serializeInput(baseInput);
    const restored = deserializeInput(params, baseInput);
    expect(restored.principal).toBe(baseInput.principal);
    expect(restored.years).toBe(baseInput.years);
    expect(restored.annualRate).toBe(baseInput.annualRate);
    expect(restored.method).toBe(baseInput.method);
  });

  it("金利変更を含むラウンドトリップ", () => {
    const input: LoanInput = {
      ...baseInput,
      rateChanges: [{ fromYear: 6, annualRate: 1.5 }],
    };
    const params = serializeInput(input);
    const restored = deserializeInput(params, baseInput);
    expect(restored.rateChanges).toEqual([{ fromYear: 6, annualRate: 1.5 }]);
  });

  it("繰上返済を含むラウンドトリップ", () => {
    const input: LoanInput = {
      ...baseInput,
      prepayments: [
        { atYear: 5, amount: 1000000, strategy: "shorten-term" },
        { atYear: 10, amount: 2000000, strategy: "reduce-payment" },
      ],
    };
    const params = serializeInput(input);
    const restored = deserializeInput(params, baseInput);
    expect(restored.prepayments).toEqual(input.prepayments);
  });

  it("空のURLSearchParamsからはデフォルト値", () => {
    const restored = deserializeInput(new URLSearchParams(), baseInput);
    expect(restored).toEqual(baseInput);
  });
});
