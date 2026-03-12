import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCcw, Loader2, Handshake } from "lucide-react";
import { getLoans, getLoanSummary } from "../../lib/loans";
import { useNotification } from "../../context/notification-context.jsx";
import LoanCard from "./LoanCard";
import LoanSummaryCard from "./LoanSummaryCard";
import AddLoanModal from "./AddLoanModal";

const EmptySection = ({ label }) => (
  <div className="rounded-2xl border border-dashed border-slate-800 py-7 flex items-center justify-center text-slate-500 text-sm">
    No {label} records yet.
  </div>
);

const getDaysUntilDue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const checkAndAddLoanNotifications = (loans, addWarning) => {
  loans.forEach((loan) => {
    if (loan.status === "pending") {
      const daysLeft = getDaysUntilDue(loan.dueDate);
      if (daysLeft < 0) {
        addWarning(`${loan.personName}'s loan is overdue by ${Math.abs(daysLeft)} days!`, {
          title: "⚠️ Overdue Loan",
        });
      } else if (daysLeft === 0) {
        addWarning(`${loan.personName}'s loan is due today!`, {
          title: "📌 Due Today",
        });
      } else if (daysLeft <= 3) {
        addWarning(`${loan.personName}'s loan is due in ${daysLeft} days`, {
          title: "📅 Due Soon",
        });
      }
    }
  });
};

const LoansPage = () => {
  const { addWarning, addSuccess } = useNotification();
  const [loans, setLoans] = useState([]);
  const [summary, setSummary] = useState({ totalLent: 0, totalBorrowed: 0, netBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [flash, setFlash] = useState({ type: "", text: "" });

  const notify = (type, text) => {
    setFlash({ type, text });
    setTimeout(() => setFlash({ type: "", text: "" }), 2800);
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [loanData, summaryData] = await Promise.all([getLoans(), getLoanSummary()]);
      setLoans(loanData || []);
      setSummary(summaryData || { totalLent: 0, totalBorrowed: 0, netBalance: 0 });
      
      // Check for overdue/due soon loans and add notifications
      if (loanData && loanData.length > 0) {
        checkAndAddLoanNotifications(loanData, addWarning);
      }
    } catch {
      notify("error", "Could not load loans.");
    } finally {
      setLoading(false);
    }
  }, [addWarning]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Update a loan in state without full refetch
  const handleUpdate = (updated) => {
    setLoans((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
    // Refresh summary totals after a status change
    getLoanSummary().then(setSummary).catch(() => {});
    notify("success", "Marked as paid ✅");
    addSuccess("Marked as paid ✅", { title: "Loan Updated" });
  };

  const handleDelete = (id) => {
    setLoans((prev) => prev.filter((l) => l._id !== id));
    getLoanSummary().then(setSummary).catch(() => {});
    notify("success", "Loan record removed.");
    addSuccess("Loan record removed", { title: "Loan Deleted" });
  };

  const handleCreated = (loan) => {
    setLoans((prev) => [loan, ...prev]);
    getLoanSummary().then(setSummary).catch(() => {});
    notify("success", "Loan recorded! 🤝");
    addSuccess(`Loan with ${loan.personName} recorded!`, { title: "Loan Created 🤝" });
  };

  // Split into lent / borrowed; pending first, then paid
  const sort = (arr) => [
    ...arr.filter((l) => l.status === "pending"),
    ...arr.filter((l) => l.status === "paid"),
  ];

  const lent     = sort(loans.filter((l) => l.type === "lent"));
  const borrowed = sort(loans.filter((l) => l.type === "borrowed"));

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-violet-900/30 via-slate-900 to-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Handshake size={22} className="text-violet-400" />
              Friend Loans &amp; IOUs
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Track money lent to friends and money you owe.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchAll}
              disabled={loading}
              className="rounded-xl border border-slate-700 bg-slate-800 text-slate-300 px-3 py-2 text-sm flex items-center gap-1.5 hover:bg-slate-700 transition-colors disabled:opacity-60"
            >
              <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus size={16} />
              Add Loan
            </button>
          </div>
        </div>
      </div>

      {/* Flash */}
      {flash.text && (
        <p className={`rounded-xl border px-3 py-2 text-sm ${
          flash.type === "error"
            ? "border-red-500/30 bg-red-500/10 text-red-300"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
        }`}>
          {flash.text}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-16 flex items-center justify-center">
          <Loader2 size={32} className="animate-spin text-violet-400" />
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <LoanSummaryCard summary={summary} />

          {/* ── Money You Lent ──────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              Money You Lent
              <span className="text-slate-600 normal-case tracking-normal font-normal">
                ({lent.filter((l) => l.status === "pending").length} pending)
              </span>
            </h3>
            {lent.length === 0 ? (
              <EmptySection label="lent" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lent.map((l) => (
                  <LoanCard key={l._id} loan={l} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </section>

          {/* ── Money You Borrowed ───────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              Money You Borrowed
              <span className="text-slate-600 normal-case tracking-normal font-normal">
                ({borrowed.filter((l) => l.status === "pending").length} pending)
              </span>
            </h3>
            {borrowed.length === 0 ? (
              <EmptySection label="borrowed" />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {borrowed.map((l) => (
                  <LoanCard key={l._id} loan={l} onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {showModal && (
        <AddLoanModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
};

export default LoansPage;
