"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import LoanForm from "./LoanForm";
import Schedule from "./Schedule";
import Chart from "./Chart";
import Comparison from "./Comparison";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import type { LoanInput } from "@/lib/calculate";
import {
  simulate,
  validate,
  formatJPY,
  formatYenMan,
  serializeInput,
  deserializeInput,
} from "@/lib/calculate";

const defaultInput: LoanInput = {
  principal: 35000000,
  years: 35,
  annualRate: 0.5,
  method: "level-payment",
  rateChanges: [],
  prepayments: [],
};

function getInitialInput(): LoanInput {
  if (typeof window === "undefined") return defaultInput;
  const params = new URLSearchParams(window.location.search);
  if (params.toString() === "") return defaultInput;
  return deserializeInput(params, defaultInput);
}

export default function Simulator() {
  const [input, setInput] = useState<LoanInput>(getInitialInput);

  // Sync state → URL
  useEffect(() => {
    const params = serializeInput(input);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
  }, [input]);

  const errors = useMemo(() => validate(input), [input]);

  const result = useMemo(() => {
    if (errors.length > 0) return null;
    try {
      return simulate(input);
    } catch {
      return null;
    }
  }, [input, errors]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Left: Form */}
        <div>
          <LoanForm value={input} onChange={setInput} errors={errors} />
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {/* Summary */}
          {result && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xs text-muted-foreground">毎月の返済額</p>
                  <p className="text-lg font-bold tabular-nums">
                    {formatJPY(result.monthlyPaymentFirst)}
                    <span className="text-xs font-normal text-muted-foreground">
                      円
                    </span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xs text-muted-foreground">総返済額</p>
                  <p className="text-lg font-bold tabular-nums">
                    {formatYenMan(result.totalPayment)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xs text-muted-foreground">総利息</p>
                  <p className="text-lg font-bold tabular-nums text-red-600">
                    {formatYenMan(result.totalInterest)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 text-center">
                  <p className="text-xs text-muted-foreground">返済期間</p>
                  <p className="text-lg font-bold tabular-nums">
                    {Math.floor(result.effectivePeriods / 12)}年
                    {result.effectivePeriods % 12 > 0
                      ? `${result.effectivePeriods % 12}ヶ月`
                      : ""}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tabs */}
          {result && (
            <Tabs defaultValue="chart">
              <TabsList>
                <TabsTrigger value="chart">グラフ</TabsTrigger>
                <TabsTrigger value="schedule">返済表</TabsTrigger>
                <TabsTrigger value="comparison">繰上比較</TabsTrigger>
              </TabsList>
              <TabsContent value="chart" className="mt-4">
                <Chart rows={result.rows} />
              </TabsContent>
              <TabsContent value="schedule" className="mt-4">
                <Schedule rows={result.rows} />
              </TabsContent>
              <TabsContent value="comparison" className="mt-4">
                <Comparison input={input} result={result} />
              </TabsContent>
            </Tabs>
          )}

          {!result && errors.length > 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-destructive">
                  {errors[0].message}
                </p>
              </CardContent>
            </Card>
          )}

          {!result && errors.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                入力条件にエラーがあります。値を確認してください。
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
