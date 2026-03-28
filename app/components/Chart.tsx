"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScheduleRow } from "@finprecise/loans";
import { formatJPY } from "@/lib/calculate";
import { useMemo } from "react";

interface Props {
  rows: ScheduleRow[];
}

interface ChartData {
  year: number;
  残高: number;
  元金累計: number;
  利息累計: number;
}

export default function Chart({ rows }: Props) {
  const data = useMemo(() => {
    const result: ChartData[] = [];
    let cumPrincipal = 0;
    let cumInterest = 0;

    // Group by year
    const yearMap = new Map<
      number,
      { principal: number; interest: number; endBalance: number }
    >();
    for (const row of rows) {
      const year = Math.ceil(row.period / 12);
      const existing = yearMap.get(year);
      if (existing) {
        existing.principal += row.principal.toNumber();
        existing.interest += row.interest.toNumber();
        existing.endBalance = row.endBalance.toNumber();
      } else {
        yearMap.set(year, {
          principal: row.principal.toNumber(),
          interest: row.interest.toNumber(),
          endBalance: row.endBalance.toNumber(),
        });
      }
    }

    // Initial point
    if (rows.length > 0) {
      result.push({
        year: 0,
        残高: rows[0].beginBalance.toNumber(),
        元金累計: 0,
        利息累計: 0,
      });
    }

    for (const [year, data] of yearMap) {
      cumPrincipal += data.principal;
      cumInterest += data.interest;
      result.push({
        year,
        残高: data.endBalance,
        元金累計: cumPrincipal,
        利息累計: cumInterest,
      });
    }

    return result;
  }, [rows]);

  const formatAxisYen = (value: number) => {
    if (value >= 100000000) return `${(value / 100000000).toFixed(1)}億`;
    if (value >= 10000) return `${Math.round(value / 10000)}万`;
    return String(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>残高推移</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="year"
                tickFormatter={(v) => `${v}年`}
                fontSize={12}
              />
              <YAxis tickFormatter={formatAxisYen} fontSize={12} width={50} />
              <Tooltip
                formatter={(value) => [
                  `${formatJPY(Number(value))}円`,
                ]}
                labelFormatter={(v) => `${v}年目`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="残高"
                stroke="hsl(220, 70%, 50%)"
                fill="hsl(220, 70%, 50%)"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="元金累計"
                stroke="hsl(150, 60%, 40%)"
                fill="hsl(150, 60%, 40%)"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="利息累計"
                stroke="hsl(0, 70%, 55%)"
                fill="hsl(0, 70%, 55%)"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
