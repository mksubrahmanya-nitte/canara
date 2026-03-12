import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));

const LoanSummaryCard = ({ summary }) => {
  const { totalLent = 0, totalBorrowed = 0, netBalance = 0 } = summary || {};

  const netPositive = netBalance > 0;
  const netNeutral = netBalance === 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Total Lent */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <TrendingUp size={15} />
          <span className="text-xs font-semibold uppercase tracking-wide">You Lent</span>
        </div>
        <p className="text-xl font-black text-white mt-1">{fmt(totalLent)}</p>
        <p className="text-xs text-slate-500">People owe you</p>
      </div>

      {/* Total Borrowed */}
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex flex-col gap-1">
        <div className="flex items-center gap-1.5 text-red-400">
          <TrendingDown size={15} />
          <span className="text-xs font-semibold uppercase tracking-wide">You Owe</span>
        </div>
        <p className="text-xl font-black text-white mt-1">{fmt(totalBorrowed)}</p>
        <p className="text-xs text-slate-500">You borrowed</p>
      </div>

      {/* Net Balance */}
      <div
        className={`rounded-2xl border p-4 flex flex-col gap-1 ${
          netPositive
            ? "border-indigo-500/20 bg-indigo-500/5"
            : netNeutral
            ? "border-slate-700 bg-slate-800/40"
            : "border-red-500/20 bg-red-500/5"
        }`}
      >
        <div
          className={`flex items-center gap-1.5 ${
            netPositive ? "text-indigo-400" : netNeutral ? "text-slate-400" : "text-red-400"
          }`}
        >
          {netPositive ? <TrendingUp size={15} /> : netNeutral ? <Minus size={15} /> : <TrendingDown size={15} />}
          <span className="text-xs font-semibold uppercase tracking-wide">Net Balance</span>
        </div>
        <p
          className={`text-xl font-black mt-1 ${
            netPositive ? "text-emerald-400" : netNeutral ? "text-slate-300" : "text-red-400"
          }`}
        >
          {netPositive ? "+" : netNeutral ? "" : "-"}{fmt(netBalance)}
        </p>
        <p className="text-xs text-slate-500">
          {netPositive ? "Net receivable" : netNeutral ? "All settled" : "Net payable"}
        </p>
      </div>
    </div>
  );
};

export default LoanSummaryCard;
