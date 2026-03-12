import { useEffect, useMemo, useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import api from "../lib/api";
import { getAvailableCategories } from "../lib/budgetCategories";
import { createLoan } from "../lib/loans";

const DEFAULT_CATEGORIES = {
  expense: ["Food", "Transport", "Rent", "Utilities", "Shopping", "Health", "Entertainment", "Education", "Savings", "Other"],
  income: ["Salary", "Freelance", "Investments", "Refund", "Gift", "Other"],
};

const getToday = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const SmartInput = ({ onTransactionAdded }) => {
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [transactionDate, setTransactionDate] = useState(getToday());
  const [note, setNote] = useState("");
  const [useAi, setUseAi] = useState(true);
  const [isEssential, setIsEssential] = useState(true);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [passiveLoanSuggestion, setPassiveLoanSuggestion] = useState(null);

  const [categoryOptions, setCategoryOptions] = useState(DEFAULT_CATEGORIES);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const today = new Date();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      
      const categories = await getAvailableCategories(month, year);
      setCategoryOptions(categories);
      
      // Default to first category if not already set or if type just changed
      if (!category || !categories[type].includes(category)) {
        setCategory(categories[type][0] || "Other");
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (!isLoadingCategories) {
      setCategory(categoryOptions[type][0] || "Other");
    }
    setIsEssential(type === "expense");
  }, [type, isLoadingCategories, categoryOptions]);

  const currentCategoryOptions = useMemo(() => categoryOptions[type] || [], [type, categoryOptions]);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setCategory(categoryOptions[type][0] || "Other");
    setNote("");
    setAiSuggestion(null);
  };

  const handleAiSuggest = async () => {
    setErrorMessage("");
    const parsedAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Add description and amount before AI suggest.");
      return;
    }

    try {
      setAiLoading(true);
      const { data } = await api.post("/api/transactions/ai-suggest", {
        description,
        amount: parsedAmount,
        transactionDate,
        type,
      });

      setAiSuggestion(data);
      setType(data.type === "income" ? "income" : "expense");
      setCategory(data.category || "Other");
      setNote(data.note || "");
      setIsEssential(Boolean(data.isEssential));
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "AI suggestion failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    const parsedAmount = Number(amount);
    if (!description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Enter a valid description and amount.");
      return;
    }

    try {
      setLoading(true);
      setPassiveLoanSuggestion(null);
      let response;

      if (useAi) {
        response = await api.post("/api/transactions/ai-add", {
          description,
          amount: parsedAmount,
          transactionDate,
          type,
          entryMode: "actual",
        });
      } else {
        response = await api.post("/api/transactions", {
          description,
          amount: parsedAmount,
          transactionDate,
          type,
          category,
          note,
          isEssential: type === "expense" ? isEssential : true,
          entryMode: "actual",
        });
      }
      
      // Look for the passive loan suggestion returned by the backend
      if (response.data && response.data.loanSuggestion) {
        setPassiveLoanSuggestion(response.data.loanSuggestion);
      }

      resetForm();
      onTransactionAdded?.();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not save transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-cyan-400" /> Add Transaction
          </p>
          <p className="text-xs text-slate-400 mt-1">Track both income and expenses with optional AI assist.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAiSuggest}
            disabled={aiLoading}
            className="px-3 py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-xs sm:text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} Suggest
          </button>
          <button
            type="button"
            onClick={() => setUseAi((prev) => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs sm:text-sm ${
              useAi
                ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-300"
                : "border-slate-700 bg-slate-800 text-slate-300"
            }`}
          >
            AI Save: {useAi ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="lg:col-span-1 bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm"
            disabled={loading}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="lg:col-span-2 bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm"
            disabled={loading}
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="lg:col-span-1 bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm"
            disabled={loading}
          />

          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="lg:col-span-1 bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm"
            disabled={loading}
          />

          <button
            type="submit"
            disabled={loading}
            className="lg:col-span-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-xl py-2.5 px-3 text-sm font-semibold"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm"
            disabled={loading || useAi || isLoadingCategories}
          >
            {isLoadingCategories ? (
              <option>Loading categories...</option>
            ) : (
              currentCategoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))
            )}
          </select>

          <label className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm">
            <input
              type="checkbox"
              checked={isEssential}
              onChange={(e) => setIsEssential(e.target.checked)}
              disabled={loading || useAi || type !== "expense"}
            />
            Essential
          </label>

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm"
            disabled={loading || useAi}
          />
        </div>
      </form>

      {aiSuggestion && (
        <div className="mt-3 text-xs sm:text-sm rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-cyan-100">
          AI: classified as <b>{aiSuggestion.type}</b> in <b>{aiSuggestion.category}</b>. {aiSuggestion.nudge}
        </div>
      )}

      {errorMessage && (
        <p className="mt-3 text-sm text-red-300 border border-red-500/30 bg-red-500/10 rounded-xl px-3 py-2">
          {errorMessage}
        </p>
      )}

      {/* Passive Loan Suggestion Prompt */}
      {passiveLoanSuggestion && (
        <div className="mt-4 rounded-xl border border-violet-500/40 bg-violet-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-violet-300 flex items-center gap-1.5">
              <Sparkles size={14} />
              Did {passiveLoanSuggestion.personName} pay their share?
            </p>
            <p className="text-xs text-violet-400/80 mt-1">
              Automatically create an IOU for ₹{passiveLoanSuggestion.suggestedAmount}.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPassiveLoanSuggestion(null)}
              className="px-3 py-1.5 rounded-lg border border-violet-500/30 text-violet-300 hover:bg-violet-500/20 text-xs font-semibold transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={async () => {
                try {
                  await createLoan({
                    personName: passiveLoanSuggestion.personName,
                    amount: passiveLoanSuggestion.suggestedAmount,
                    type: "lent",
                    note: passiveLoanSuggestion.note,
                  });
                  setPassiveLoanSuggestion(null);
                  // Optional: trigger a toast or refresh loans if needed
                } catch {
                  setErrorMessage("Failed to create loan suggestion.");
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-colors shadow-lg shadow-violet-900/20"
            >
              Merge &amp; Create IOU
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default SmartInput;
