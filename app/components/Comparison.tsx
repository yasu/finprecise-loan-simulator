"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import type { LoanInput, SimulationResult } from "@/lib/calculate";
import { simulate, formatJPY, formatYenMan } from "@/lib/calculate";
import { useMemo } from "react";

interface Props {
  input: LoanInput;
  result: SimulationResult;
}

export default function Comparison({ input, result }: Props) {
  const hasPrepayments =
    input.prepayments && input.prepayments.length > 0;

  const noPrepayResult = useMemo(() => {
    if (!hasPrepayments) return null;
    try {
      return simulate({ ...input, prepayments: [] });
    } catch {
      return null;
    }
  }, [input, hasPrepayments]);

  if (!hasPrepayments || !noPrepayResult) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>繰上返済 比較</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            繰上返済を追加すると、あり/なしの比較が表示されます。
          </p>
        </CardContent>
      </Card>
    );
  }

  const interestSaved =
    noPrepayResult.totalInterest - result.totalInterest;
  const periodsSaved =
    noPrepayResult.effectivePeriods - result.effectivePeriods;
  const yearsSaved = Math.floor(periodsSaved / 12);
  const monthsSaved = periodsSaved % 12;

  const barData = [
    {
      name: "総返済額",
      繰上なし: noPrepayResult.totalPayment,
      繰上あり: result.totalPayment,
    },
    {
      name: "総利息",
      繰上なし: noPrepayResult.totalInterest,
      繰上あり: result.totalInterest,
    },
  ];

  const COLORS = {
    without: "hsl(0, 0%, 65%)",
    with: "hsl(220, 70%, 50%)",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>繰上返済 比較</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">利息削減額</p>
            <p className="text-xl font-bold text-green-600">
              -{formatYenMan(interestSaved)}
            </p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <p className="text-xs text-muted-foreground">短縮期間</p>
            <p className="text-xl font-bold text-blue-600">
              {periodsSaved > 0
                ? yearsSaved > 0
                  ? `${yearsSaved}年${monthsSaved > 0 ? `${monthsSaved}ヶ月` : ""}`
                  : `${monthsSaved}ヶ月`
                : "-"}
            </p>
          </div>
        </div>

        {/* Detail table */}
        <div className="text-sm space-y-1">
          <div className="flex justify-between border-b py-1">
            <span className="text-muted-foreground">項目</span>
            <span className="text-muted-foreground w-28 text-right">
              繰上なし
            </span>
            <span className="text-muted-foreground w-28 text-right">
              繰上あり
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>総返済額</span>
            <span className="w-28 text-right tabular-nums">
              {formatJPY(noPrepayResult.totalPayment)}円
            </span>
            <span className="w-28 text-right tabular-nums font-medium">
              {formatJPY(result.totalPayment)}円
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>総利息</span>
            <span className="w-28 text-right tabular-nums">
              {formatJPY(noPrepayResult.totalInterest)}円
            </span>
            <span className="w-28 text-right tabular-nums font-medium">
              {formatJPY(result.totalInterest)}円
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span>返済期間</span>
            <span className="w-28 text-right tabular-nums">
              {Math.ceil(noPrepayResult.effectivePeriods / 12)}年
            </span>
            <span className="w-28 text-right tabular-nums font-medium">
              {Math.ceil(result.effectivePeriods / 12)}年
              {monthsSaved > 0 ? ` (${result.effectivePeriods % 12}ヶ月)` : ""}
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis
                tickFormatter={(v) => `${Math.round(v / 10000)}万`}
                fontSize={12}
                width={50}
              />
              <Tooltip
                formatter={(value) => [
                  `${formatJPY(Number(value))}円`,
                ]}
              />
              <Legend />
              <Bar dataKey="繰上なし" fill={COLORS.without} radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={COLORS.without} />
                ))}
              </Bar>
              <Bar dataKey="繰上あり" fill={COLORS.with} radius={[4, 4, 0, 0]}>
                {barData.map((_, i) => (
                  <Cell key={i} fill={COLORS.with} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
