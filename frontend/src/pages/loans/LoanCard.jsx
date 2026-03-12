import { useState } from "react";
import {
  CheckCircle, XCircle, Clock, CalendarDays, MessageSquare, Copy, Check, Trash2,
} from "lucide-react";
import { markLoanAsPaid, deleteLoan } from "../../lib/loans";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const dueDetails = (dueDate, status) => {
  if (status === "paid") return { status: "paid" };
  if (!dueDate) return { status: "none" };
  const now = new Date();
  now.setHours(0,0,0,0);
  const due = new Date(dueDate);
  due.setHours(0,0,0,0);
  const diffDays = Math.round((due - now) / 86_400_000);
  
  if (diffDays < 0) return { status: "overdue", days: Math.abs(diffDays) };
  if (diffDays <= 3) return { status: "soon", days: diffDays };
  return { status: "ok", days: diffDays };
};

const DUE_STYLE = {
  overdue: "text-red-400 bg-red-500/10 border-red-500/30",
  soon:    "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  ok:      "text-slate-400 bg-slate-800 border-slate-700",
  paid:    "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  none:    "",
};

const LoanCard = ({ loan, onUpdate, onDelete }) => {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const dueInfo = dueDetails(loan.dueDate, loan.status);
  const dueSt = dueInfo.status;

  const handlePay = async () => {
    setBusy(true);
    try {
      const updated = await markLoanAsPaid(loan._id);
      onUpdate(updated);
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete loan with ${loan.personName}?`)) return;
    setBusy(true);
    try {
      await deleteLoan(loan._id);
      onDelete(loan._id);
    } catch { /* silent */ }
    finally { setBusy(false); }
  };

  const handleReminder = () => {
    const typeLabel = loan.type === "lent" ? "borrowed" : "lent";
    const msg = `Hey ${loan.personName}, just a friendly reminder about ${fmt(loan.amount)}${
      loan.note ? ` (${loan.note})` : ""
    }. Let me know when you're able to settle it. Thanks! 😊`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isPending = loan.status === "pending";

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
        loan.status === "paid"
          ? "border-slate-800/60 bg-slate-900/40 opacity-75"
          : dueSt === "overdue"
          ? "border-red-500/30 bg-slate-900/80"
          : dueSt === "soon"
          ? "border-yellow-500/30 bg-slate-900/80"
          : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Avatar + Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {loan.personName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{loan.personName}</p>
            {loan.note && (
              <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                <MessageSquare size={10} />
                {loan.note}
              </p>
            )}
          </div>
        </div>

        {/* Amount + status */}
        <div className="flex-shrink-0 text-right">
          <p className={`text-lg font-black ${loan.type === "lent" ? "text-emerald-400" : "text-red-400"}`}>
            {loan.type === "lent" ? "+" : "-"}{fmt(loan.amount)}
          </p>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full border px-2 py-0.5 mt-1 ${
              loan.status === "paid"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : dueSt === "overdue"
                ? "border-red-500/40 bg-red-500/10 text-red-300"
                : dueSt === "soon"
                ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-300"
                : "border-slate-700 bg-slate-800 text-slate-400"
            }`}
          >
            {loan.status === "paid" ? (
              <><CheckCircle size={9} /> Paid</>
            ) : dueSt === "overdue" ? (
              <>⚠️ Overdue {dueInfo.days}d</>
            ) : dueSt === "soon" ? (
              <><Clock size={9} /> Due in {dueInfo.days}d</>
            ) : (
              <><Clock size={9} /> Pending</>
            )}
          </span>
        </div>
      </div>

      {/* Due date row */}
      {loan.dueDate && (
        <div className={`flex items-center gap-1.5 text-xs rounded-lg border px-2.5 py-1.5 w-fit ${DUE_STYLE[dueSt]}`}>
          {dueSt === "overdue" ? <XCircle size={11} /> : dueSt === "paid" ? <CheckCircle size={11} /> : <CalendarDays size={11} />}
          {dueSt === "overdue" 
            ? `Overdue by ${dueInfo.days} day${dueInfo.days === 1 ? '' : 's'}` 
            : `Due: ${new Date(loan.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${dueSt === "soon" ? `(in ${dueInfo.days}d)` : ""}`}
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
        {isPending && (
          <>
            <button
              onClick={handlePay}
              disabled={busy}
              className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
            >
              <CheckCircle size={13} />
              Mark Paid
            </button>
            <button
              onClick={handleReminder}
              title="Copy reminder message"
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 px-3 text-xs flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copied ? "Copied!" : "Reminder"}
            </button>
          </>
        )}
        <button
          onClick={handleDelete}
          disabled={busy}
          title="Delete"
          className="rounded-xl border border-slate-700 bg-slate-800 hover:border-red-500/40 hover:text-red-400 text-slate-500 py-1.5 px-2.5 text-xs transition-colors ml-auto disabled:opacity-60"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};

export default LoanCard;
