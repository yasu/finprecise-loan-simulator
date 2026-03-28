"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  LoanInput,
  RepaymentMethod,
  PrepaymentStrategy,
  ValidationError,
} from "@/lib/calculate";
import { formatJPY } from "@/lib/calculate";

interface RateChange {
  fromYear: number;
  annualRate: number;
}

interface PrepaymentInput {
  atYear: number;
  amount: number;
  strategy: PrepaymentStrategy;
}

interface Props {
  value: LoanInput;
  onChange: (input: LoanInput) => void;
  errors?: ValidationError[];
}

export default function LoanForm({ value, onChange, errors = [] }: Props) {
  const errorForField = (field: string) =>
    errors.find((e) => e.field === field)?.message;

  const update = (patch: Partial<LoanInput>) => {
    onChange({ ...value, ...patch });
  };

  const rateChanges = value.rateChanges ?? [];
  const prepayments = value.prepayments ?? [];

  const addRateChange = () => {
    const lastYear =
      rateChanges.length > 0
        ? rateChanges[rateChanges.length - 1].fromYear + 5
        : 6;
    update({
      rateChanges: [
        ...rateChanges,
        { fromYear: Math.min(lastYear, value.years), annualRate: value.annualRate + 0.5 },
      ],
    });
  };

  const removeRateChange = (index: number) => {
    update({ rateChanges: rateChanges.filter((_, i) => i !== index) });
  };

  const updateRateChange = (index: number, patch: Partial<RateChange>) => {
    update({
      rateChanges: rateChanges.map((rc, i) =>
        i === index ? { ...rc, ...patch } : rc
      ),
    });
  };

  const addPrepayment = () => {
    update({
      prepayments: [
        ...prepayments,
        { atYear: 5, amount: 1000000, strategy: "shorten-term" },
      ],
    });
  };

  const removePrepayment = (index: number) => {
    update({ prepayments: prepayments.filter((_, i) => i !== index) });
  };

  const updatePrepayment = (index: number, patch: Partial<PrepaymentInput>) => {
    update({
      prepayments: prepayments.map((p, i) =>
        i === index ? { ...p, ...patch } : p
      ),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>借入条件</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 借入金額 */}
        <div className="space-y-2">
          <Label htmlFor="principal">借入金額</Label>
          <div className="flex items-center gap-2">
            <Input
              id="principal"
              type="number"
              min={100}
              max={200000}
              step={100}
              value={value.principal / 10000}
              onChange={(e) =>
                update({ principal: Number(e.target.value) * 10000 })
              }
              className="w-28"
            />
            <span className="text-sm text-muted-foreground">万円</span>
          </div>
          <Slider
            min={100}
            max={20000}
            step={100}
            value={[value.principal / 10000]}
            onValueChange={(val) => update({ principal: (Array.isArray(val) ? val[0] : val) * 10000 })}
          />
          <p className="text-xs text-muted-foreground">
            {formatJPY(value.principal)}円
          </p>
        </div>

        {/* 返済期間 */}
        <div className="space-y-2">
          <Label htmlFor="years">返済期間</Label>
          <div className="flex items-center gap-2">
            <Input
              id="years"
              type="number"
              min={1}
              max={50}
              value={value.years}
              onChange={(e) => update({ years: Number(e.target.value) })}
              className="w-20"
            />
            <span className="text-sm text-muted-foreground">年</span>
          </div>
          <Slider
            min={1}
            max={50}
            step={1}
            value={[value.years]}
            onValueChange={(val) => update({ years: Array.isArray(val) ? val[0] : val })}
          />
        </div>

        {/* 金利 */}
        <div className="space-y-2">
          <Label htmlFor="rate">当初金利 (年利)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="rate"
              type="number"
              min={0.01}
              max={20}
              step={0.01}
              value={value.annualRate}
              onChange={(e) => update({ annualRate: Number(e.target.value) })}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <Slider
            min={0.1}
            max={20}
            step={0.05}
            value={[value.annualRate]}
            onValueChange={(val) => { const v = Array.isArray(val) ? val[0] : val; update({ annualRate: Math.round(v * 100) / 100 }); }}
          />
          {errorForField("annualRate") && (
            <p className="text-xs text-destructive">{errorForField("annualRate")}</p>
          )}
        </div>

        {/* 返済方法 */}
        <div className="space-y-2">
          <Label>返済方法</Label>
          <Select
            value={value.method}
            onValueChange={(v) => update({ method: v as RepaymentMethod })}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {value.method === "level-payment" ? "元利均等返済" : "元金均等返済"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="level-payment">元利均等返済</SelectItem>
              <SelectItem value="level-principal">元金均等返済</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {value.method === "level-payment"
              ? "毎月の返済額（元金＋利息）が一定"
              : "毎月の元金返済額が一定（総利息が少ない）"}
          </p>
        </div>

        <Separator />

        {/* 金利変更 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>金利変更（変動金利）</Label>
            <Button variant="outline" size="sm" onClick={addRateChange}>
              + 追加
            </Button>
          </div>
          {errorForField("rateChanges") && (
            <p className="text-xs text-destructive">{errorForField("rateChanges")}</p>
          )}
          {rateChanges.map((rc, i) => (
            <div key={i} className="flex items-center gap-2 pl-2">
              <Input
                type="number"
                min={2}
                max={value.years}
                value={rc.fromYear}
                onChange={(e) =>
                  updateRateChange(i, { fromYear: Number(e.target.value) })
                }
                className="w-16"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                年目〜
              </span>
              <Input
                type="number"
                min={0.01}
                max={20}
                step={0.01}
                value={rc.annualRate}
                onChange={(e) =>
                  updateRateChange(i, { annualRate: Number(e.target.value) })
                }
                className="w-20"
              />
              <span className="text-xs text-muted-foreground">%</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRateChange(i)}
                className="text-destructive h-8 w-8 p-0"
              >
                ×
              </Button>
            </div>
          ))}
        </div>

        <Separator />

        {/* 繰上返済 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>繰上返済</Label>
            <Button variant="outline" size="sm" onClick={addPrepayment}>
              + 追加
            </Button>
          </div>
          {errorForField("prepayments") && (
            <p className="text-xs text-destructive">{errorForField("prepayments")}</p>
          )}
          {prepayments.map((p, i) => (
            <div key={i} className="space-y-1 rounded border p-2">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={value.years}
                  value={p.atYear}
                  onChange={(e) =>
                    updatePrepayment(i, { atYear: Number(e.target.value) })
                  }
                  className="w-16"
                />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  年目初月
                </span>
                <Input
                  type="number"
                  min={1}
                  step={10}
                  value={p.amount / 10000}
                  onChange={(e) =>
                    updatePrepayment(i, {
                      amount: Number(e.target.value) * 10000,
                    })
                  }
                  className="w-20"
                />
                <span className="text-xs text-muted-foreground">万円</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removePrepayment(i)}
                  className="text-destructive h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <Select
                value={p.strategy}
                onValueChange={(v) =>
                  updatePrepayment(i, {
                    strategy: v as PrepaymentStrategy,
                  })
                }
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue>
                    {p.strategy === "shorten-term" ? "期間短縮型" : "返済額軽減型"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shorten-term">期間短縮型</SelectItem>
                  <SelectItem value="reduce-payment">返済額軽減型</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
