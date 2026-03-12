import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { createChallenge } from "../../lib/challenges";

const CHALLENGE_TYPES = [
  {
    value: "daily_limit",
    label: "Daily Spending Limit",
    desc: "Stay under a daily spending cap for N days.",
  },
  {
    value: "category_avoidance",
    label: "Category Avoidance",
    desc: "Avoid spending in a specific category entirely.",
  },
  {
    value: "savings_goal",
    label: "Savings Goal",
    desc: "Save a target amount by the end of the challenge.",
  },
];

const COMMON_CATEGORIES = [
  "Food", "Transport", "Shopping", "Entertainment",
  "Health", "Education", "Utilities", "Rent", "Other",
];

const CreateChallengeModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    title: "",
    challengeType: "daily_limit",
    category: "",
    targetAmount: "",
    duration: 7,
    startDate: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const created = await createChallenge({
        ...form,
        targetAmount: Number(form.targetAmount),
        duration: Number(form.duration),
      });
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to create challenge");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = CHALLENGE_TYPES.find((t) => t.value === form.challengeType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">Start a Challenge</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Challenge Title
            </label>
            <input
              required
              maxLength={100}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="No Food Delivery for 30 days…"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Challenge Type
            </label>
            <div className="space-y-2">
              {CHALLENGE_TYPES.map((t) => (
                <label
                  key={t.value}
                  className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                    form.challengeType === t.value
                      ? "border-indigo-500/60 bg-indigo-500/10"
                      : "border-slate-800 bg-slate-950/50 hover:border-slate-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="challengeType"
                    value={t.value}
                    checked={form.challengeType === t.value}
                    onChange={() => set("challengeType", t.value)}
                    className="mt-0.5 accent-indigo-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{t.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{t.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Category (only for category_avoidance) */}
          {form.challengeType === "category_avoidance" && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Category to Avoid
              </label>
              <select
                required
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Select category…</option>
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              {form.challengeType === "daily_limit"
                ? "Daily Spend Limit (₹)"
                : form.challengeType === "savings_goal"
                ? "Savings Target (₹)"
                : "Max Allowed Spend in Category (₹)"}
            </label>
            <input
              required
              type="number"
              min="0"
              step="1"
              value={form.targetAmount}
              onChange={(e) => set("targetAmount", e.target.value)}
              placeholder="e.g. 500"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Duration + Start Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Duration (days)
              </label>
              <input
                required
                type="number"
                min="1"
                max="365"
                value={form.duration}
                onChange={(e) => set("duration", e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
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
              className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              Start Challenge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChallengeModal;
