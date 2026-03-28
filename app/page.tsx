import Simulator from "./components/Simulator";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">住宅ローン シミュレーター</h1>
            <p className="text-sm text-muted-foreground mt-1">
              変動金利・繰上返済・元利均等/元金均等に対応 — Powered by{" "}
              <a
                href="https://github.com/yasu/finprecise"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                @finprecise/loans
              </a>
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Client Component */}
      <Simulator />

      {/* Footer — Server Component */}
      <footer className="mx-auto max-w-7xl px-4 mt-12 border-t pt-6 pb-8 text-center text-xs text-muted-foreground">
        <p>
          計算エンジン:{" "}
          <a
            href="https://github.com/yasu/finprecise"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            @finprecise/loans
          </a>{" "}
          — 任意精度演算による正確なローン計算
        </p>
        <p className="mt-1">
          本シミュレーションは参考値です。実際の返済額は金融機関にご確認ください。
        </p>
      </footer>
    </main>
  );
}
