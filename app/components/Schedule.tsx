"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScheduleRow } from "@finprecise/loans";
import { Button } from "@/components/ui/button";
import { formatJPY } from "@/lib/calculate";
import { useState, useMemo } from "react";

const MONTHLY_PAGE_SIZE = 60;

interface Props {
  rows: ScheduleRow[];
}

type ViewMode = "monthly" | "yearly";

interface YearlyRow {
  year: number;
  payment: number;
  principal: number;
  interest: number;
  prepayment: number;
  endBalance: number;
  annualRate: number;
}

export default function Schedule({ rows }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("yearly");
  const [monthlyPage, setMonthlyPage] = useState(0);

  const totalMonthlyPages = Math.ceil(rows.length / MONTHLY_PAGE_SIZE);
  const pagedRows = useMemo(
    () =>
      rows.slice(
        monthlyPage * MONTHLY_PAGE_SIZE,
        (monthlyPage + 1) * MONTHLY_PAGE_SIZE
      ),
    [rows, monthlyPage]
  );

  const yearlyRows = useMemo(() => {
    const map = new Map<number, YearlyRow>();
    for (const row of rows) {
      const year = Math.ceil(row.period / 12);
      const existing = map.get(year);
      if (existing) {
        existing.payment += row.payment.toNumber();
        existing.principal += row.principal.toNumber();
        existing.interest += row.interest.toNumber();
        existing.prepayment += row.prepayment.toNumber();
        existing.endBalance = row.endBalance.toNumber();
        existing.annualRate = row.annualRate.toNumber() * 100;
      } else {
        map.set(year, {
          year,
          payment: row.payment.toNumber(),
          principal: row.principal.toNumber(),
          interest: row.interest.toNumber(),
          prepayment: row.prepayment.toNumber(),
          endBalance: row.endBalance.toNumber(),
          annualRate: row.annualRate.toNumber() * 100,
        });
      }
    }
    return Array.from(map.values());
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>返済スケジュール</CardTitle>
          <Select
            value={viewMode}
            onValueChange={(v) => { setViewMode(v as ViewMode); setMonthlyPage(0); }}
          >
            <SelectTrigger className="w-32">
              <SelectValue>
                {viewMode === "yearly" ? "年次表示" : "月次表示"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yearly">年次表示</SelectItem>
              <SelectItem value="monthly">月次表示</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">
                  {viewMode === "yearly" ? "年" : "回"}
                </TableHead>
                <TableHead className="text-right">返済額</TableHead>
                <TableHead className="text-right">元金</TableHead>
                <TableHead className="text-right">利息</TableHead>
                <TableHead className="text-right">繰上返済</TableHead>
                <TableHead className="text-right">残高</TableHead>
                <TableHead className="text-right">金利</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewMode === "yearly"
                ? yearlyRows.map((yr) => (
                    <TableRow key={yr.year}>
                      <TableCell className="text-right tabular-nums">
                        {yr.year}年目
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatJPY(yr.payment)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatJPY(yr.principal)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatJPY(yr.interest)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {yr.prepayment > 0 ? formatJPY(yr.prepayment) : "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatJPY(yr.endBalance)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {yr.annualRate.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))
                : pagedRows.map((row) => (
                    <TableRow key={row.period}>
                      <TableCell className="text-right tabular-nums">
                        {row.period}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatJPY(row.payment.toNumber())}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatJPY(row.principal.toNumber())}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatJPY(row.interest.toNumber())}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.prepayment.toNumber() > 0
                          ? formatJPY(row.prepayment.toNumber())
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatJPY(row.endBalance.toNumber())}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {(row.annualRate.toNumber() * 100).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
        {viewMode === "monthly" && totalMonthlyPages > 1 && (
          <div className="flex items-center justify-between pt-3">
            <Button
              variant="outline"
              size="sm"
              disabled={monthlyPage === 0}
              onClick={() => setMonthlyPage((p) => p - 1)}
            >
              前へ
            </Button>
            <span className="text-xs text-muted-foreground">
              {monthlyPage * MONTHLY_PAGE_SIZE + 1}〜
              {Math.min((monthlyPage + 1) * MONTHLY_PAGE_SIZE, rows.length)}回
              / 全{rows.length}回
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={monthlyPage >= totalMonthlyPages - 1}
              onClick={() => setMonthlyPage((p) => p + 1)}
            >
              次へ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
