import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createLoan } from "../../lib/loans";

const AddLoanModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    personName: "",
    amount: "",
    type: "lent",
    note: "",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const created = await createLoan({
        ...form,
        amount: Number(form.amount),
        dueDate: form.dueDate || null,
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create loan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Add Loan / IOU</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2">
            {["lent", "borrowed"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("type", t)}
                className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  form.type === t
                    ? t === "lent"
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
                      : "border-red-500/60 bg-red-500/15 text-red-300"
                    : "border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600"
                }`}
              >
                {t === "lent" ? "💸 I Lent" : "🤲 I Borrowed"}
              </button>
            ))}
          </div>

          {/* Person Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Person's Name
            </label>
            <input
              required
              maxLength={80}
              value={form.personName}
              onChange={(e) => set("personName", e.target.value)}
              placeholder="Rahul, Ananya…"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Amount (₹)
            </label>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="500"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Note + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Note
              </label>
              <input
                maxLength={300}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                placeholder="Dinner, travel…"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set("dueDate", e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 py-2.5 text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 rounded-xl text-white py-2.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                form.type === "lent"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {form.type === "lent" ? "Add — I Lent" : "Add — I Borrowed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLoanModal;
