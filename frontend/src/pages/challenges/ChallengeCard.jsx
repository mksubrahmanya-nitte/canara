import { Flame, Trophy, XCircle, Clock, Target, ShieldOff, PiggyBank, AlertTriangle, Star } from "lucide-react";
import ChallengeProgressRing from "./ChallengeProgressRing";

const TYPE_META = {
  daily_limit: { label: "Daily Limit", Icon: Target, color: "#6366f1", ring: "#6366f1" },
  category_avoidance: { label: "Category Avoidance", Icon: ShieldOff, color: "#f59e0b", ring: "#f59e0b" },
  savings_goal: { label: "Savings Goal", Icon: PiggyBank, color: "#10b981", ring: "#10b981" },
};

const STATUS_CHIP = {
  active: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300",
  completed: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  failed: "border-red-500/40 bg-red-500/10 text-red-300",
};

const STATUS_LABEL = {
  active: "On Track",
  completed: "🏆 Completed",
  failed: "❌ Failed",
};

const RISK_STYLES = {
  warning: { border: "border-yellow-500/40", bg: "bg-yellow-500/10", text: "text-yellow-300" },
  danger: { border: "border-red-500/40", bg: "bg-red-500/10", text: "text-red-300" },
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const ChallengeCard = ({ challenge, onDelete }) => {
  const meta = TYPE_META[challenge.challengeType] || TYPE_META.daily_limit;
  const { Icon, ring } = meta;
  const daysPassed = Math.max(
    0,
    Math.floor((Date.now() - new Date(challenge.startDate)) / 86_400_000),
  );
  const daysTotal = challenge.duration;
  const risk = challenge.riskWarning;
  const riskStyle = risk ? RISK_STYLES[risk.level] || RISK_STYLES.warning : null;

  return (
    <div className={`rounded-2xl border bg-slate-900/80 p-5 flex flex-col gap-3 transition-all hover:border-slate-700 ${
      risk ? (risk.level === "danger" ? "border-red-500/40" : "border-yellow-500/40") : "border-slate-800"
    }`}>
      <div className="flex gap-4 items-start">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <ChallengeProgressRing
            progress={challenge.progress}
            size={80}
            strokeWidth={6}
            color={challenge.status === "failed" ? "#ef4444" : risk?.level === "danger" ? "#ef4444" : risk ? "#f59e0b" : ring}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-white">{Math.round(challenge.progress)}%</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="font-semibold text-white text-sm leading-tight truncate max-w-[220px]">
                {challenge.title}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Icon size={12} style={{ color: meta.color }} />
                <span className="text-xs text-slate-400">{meta.label}</span>
                {challenge.category && (
                  <span className="text-xs text-slate-500">· {challenge.category}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {/* Points badge (completed only) */}
              {challenge.status === "completed" && challenge.points > 0 && (
                <span className="flex items-center gap-1 text-[10px] font-bold rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 px-2 py-0.5">
                  <Star size={10} fill="currentColor" />
                  +{challenge.points} pts
                </span>
              )}
              <span className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 ${STATUS_CHIP[challenge.status]}`}>
                {STATUS_LABEL[challenge.status]}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${challenge.progress}%`,
                background:
                  challenge.status === "failed"
                    ? "#ef4444"
                    : risk?.level === "danger"
                    ? "#ef4444"
                    : risk
                    ? "#f59e0b"
                    : `linear-gradient(90deg, ${ring}99, ${ring})`,
              }}
            />
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              Day {Math.min(daysPassed, daysTotal)} / {daysTotal}
            </span>
            {challenge.streak > 0 && (
              <span className="flex items-center gap-1 text-orange-400">
                <Flame size={11} />
                {challenge.streak}d streak
              </span>
            )}
            <span className="ml-auto flex items-center gap-1">
              {formatDate(challenge.startDate)} → {formatDate(challenge.endDate)}
            </span>
          </div>
        </div>

        {/* Delete button */}
        {onDelete && (
          <button
            onClick={() => onDelete(challenge._id)}
            className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
            title="Delete challenge"
          >
            <XCircle size={16} />
          </button>
        )}
      </div>

      {/* Risk Warning Banner */}
      {risk && (
        <div className={`rounded-xl border ${riskStyle.border} ${riskStyle.bg} px-3 py-2 flex items-start gap-2`}>
          <AlertTriangle size={14} className={`${riskStyle.text} flex-shrink-0 mt-0.5`} />
          <p className={`text-xs ${riskStyle.text}`}>
            ⚠️ {risk.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChallengeCard;
