import { useState } from "react";
import { Sparkles, Loader2, CheckCircle, Target, ShieldOff, PiggyBank, TrendingDown } from "lucide-react";
import { createChallenge } from "../../lib/challenges";

const TYPE_ICON = {
  daily_limit: Target,
  category_avoidance: ShieldOff,
  savings_goal: PiggyBank,
};

const AISuggestionCard = ({ suggestion, onAccepted }) => {
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);

  if (!suggestion) return null;

  const Icon = TYPE_ICON[suggestion.challengeType] || Target;

  const handleAccept = async () => {
    setLoading(true);
    try {
      const created = await createChallenge({
        title: suggestion.title,
        challengeType: suggestion.challengeType,
        category: suggestion.category || "",
        targetAmount: suggestion.targetAmount,
        duration: suggestion.duration,
      });
      setAccepted(true);
      onAccepted(created);
    } catch {
      // silent — parent will show alert if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-900/30 to-slate-900 p-5">
      {/* Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full px-2.5 py-1">
          <Sparkles size={12} className="text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wide">AI Suggested Challenge</span>
        </div>
      </div>

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex-shrink-0">
          <Icon size={20} className="text-indigo-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-white leading-tight">{suggestion.title}</h4>
          <p className="text-xs text-slate-400 mt-1">{suggestion.reason}</p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-3 mt-3">
            {suggestion.targetAmount > 0 && (
              <div className="bg-slate-800 rounded-xl px-3 py-1.5 text-center">
                <p className="text-sm font-bold text-white">₹{suggestion.targetAmount}<span className="text-xs text-slate-400 font-normal">/day</span></p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Goal</p>
              </div>
            )}
            <div className="bg-slate-800 rounded-xl px-3 py-1.5 text-center">
              <p className="text-sm font-bold text-white">{suggestion.duration} days</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">Duration</p>
            </div>
            {suggestion.potentialSavings > 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 text-center">
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                  <TrendingDown size={12} />
                  ₹{suggestion.potentialSavings}
                </p>
                <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Potential Savings</p>
              </div>
            )}
          </div>
        </div>

        {/* Accept button */}
        <div className="flex-shrink-0">
          {accepted ? (
            <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
              <CheckCircle size={16} /> Accepted!
            </div>
          ) : (
            <button
              onClick={handleAccept}
              disabled={loading}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 whitespace-nowrap"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              Accept Challenge
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISuggestionCard;
