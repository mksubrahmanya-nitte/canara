import { useCallback, useEffect, useState } from "react";
import {
  Trophy, Flame, Plus, RefreshCcw, Loader2, Swords, Star, Crown,
} from "lucide-react";
import { useNotification } from "../../context/notification-context.jsx";
import { getChallenges, getStats, getSuggestion, deleteChallenge } from "../../lib/challenges";
import ChallengeCard from "./ChallengeCard";
import CreateChallengeModal from "./CreateChallengeModal";
import AISuggestionCard from "./AISuggestionCard";

const RANK_COLOR = {
  "Finance Champion": "text-purple-400",
  "Budget Master": "text-yellow-400",
  "Smart Saver": "text-emerald-400",
  "Saver Apprentice": "text-blue-400",
  "Beginner": "text-slate-400",
};

const EmptySection = ({ message }) => (
  <div className="rounded-2xl border border-dashed border-slate-800 py-8 flex flex-col items-center gap-2 text-slate-500">
    <Swords size={28} className="opacity-40" />
    <p className="text-sm">{message}</p>
  </div>
);

const ChallengesPage = () => {
  const { addSuccess, addError, addWarning } = useNotification();
  const [challenges, setChallenges] = useState([]);
  const [stats, setStats] = useState({ totalPoints: 0, rank: "Beginner", completedCount: 0 });
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [flash, setFlash] = useState({ type: "", text: "" });

  const notify = (type, text) => {
    setFlash({ type, text });
    setTimeout(() => setFlash({ type: "", text: "" }), 2800);
    
    // Also add to notification system
    if (type === "error") {
      addError(text, { title: "Error" });
    } else {
      addSuccess(text, { title: "Success" });
    }
  };

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [challengeData, statsData, suggestionData] = await Promise.all([
        getChallenges(),
        getStats(),
        getSuggestion(),
      ]);
      setChallenges(challengeData || []);
      setStats(statsData || { totalPoints: 0, rank: "Beginner", completedCount: 0 });
      setSuggestion(suggestionData?.suggestion || null);
    } catch {
      notify("error", "Could not load challenges.");
    } finally {
      setLoading(false);
    }
  }, [addSuccess, addError]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this challenge?")) return;
    try {
      await deleteChallenge(id);
      setChallenges((prev) => prev.filter((c) => c._id !== id));
      notify("success", "Challenge deleted.");
      addSuccess("Challenge deleted successfully", { title: "Removed" });
    } catch {
      notify("error", "Failed to delete challenge.");
      addError("Could not delete challenge", { title: "Error" });
    }
  };

  const handleCreated = (newChallenge) => {
    setChallenges((prev) => [newChallenge, ...prev]);
    notify("success", "Challenge started! 🔥");
    addSuccess("Challenge started! Get ready to save! 🔥", { title: "New Challenge" });
  };

  // Use the full list for completed/failed (no riskWarning needed)
  // Use getChallenges() result for all sections — only active from the API includes riskWarning
  const active = challenges.filter((c) => c.status === "active");
  const completed = challenges.filter((c) => c.status === "completed");
  const failed = challenges.filter((c) => c.status === "failed");
  const totalStreak = active.reduce((s, c) => s + (c.streak || 0), 0);
  const bestStreak = Math.max(0, ...challenges.map((c) => c.streak || 0));
  const rankColor = RANK_COLOR[stats.rank] || "text-slate-400";

  return (
    <div className="space-y-5">
      {/* ── Hero bar ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-900 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy size={22} className="text-yellow-400" />
              Budget Challenges
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Build better spending habits with daily goals.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Reward Economy pills */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-2.5 flex items-center gap-3">
              <div className="text-center">
                <p className="text-base font-black text-yellow-400 flex items-center gap-1">
                  <Star size={14} fill="currentColor" />
                  {stats.totalPoints}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Total Points</p>
              </div>
              <div className="w-px h-8 bg-slate-700" />
              <div className="text-center">
                <p className={`text-sm font-black flex items-center gap-1 ${rankColor}`}>
                  <Crown size={13} />
                  {stats.rank}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Rank</p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl px-4 py-2 text-center min-w-[72px]">
              <p className="text-lg font-black text-indigo-400">{active.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Active</p>
            </div>
            <div className="bg-slate-800 rounded-xl px-4 py-2 text-center min-w-[72px]">
              <p className="text-lg font-black text-orange-400 flex items-center justify-center gap-1">
                <Flame size={14} />{bestStreak}d
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Best Streak</p>
            </div>
            <div className="bg-slate-800 rounded-xl px-4 py-2 text-center min-w-[72px]">
              <p className="text-lg font-black text-emerald-400">{completed.length}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">Completed</p>
            </div>
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
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Plus size={16} />
              Start Challenge
            </button>
          </div>
        </div>
      </div>

      {/* Flash message */}
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
          <Loader2 size={32} className="animate-spin text-indigo-400" />
        </div>
      ) : (
        <>
          {/* ── AI Suggestion ──────────────────────────────────────────── */}
          {suggestion && (
            <AISuggestionCard
              suggestion={suggestion}
              onAccepted={(c) => {
                handleCreated(c);
                setSuggestion(null); // hide after accepting
              }}
            />
          )}

          {/* ── Active Challenges ─────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              Active Challenges
              <span className="text-slate-600 normal-case tracking-normal font-normal">({active.length})</span>
            </h3>
            {active.length === 0 ? (
              <EmptySection message="No active challenges. Start one above!" />
            ) : (
              <div className="space-y-3">
                {active.map((c) => (
                  <ChallengeCard key={c._id} challenge={c} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </section>

          {/* ── Completed Challenges ──────────────────────────────────── */}
          {completed.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                Completed
                <span className="text-slate-600 normal-case tracking-normal font-normal">({completed.length})</span>
              </h3>
              <div className="space-y-3">
                {completed.map((c) => (
                  <ChallengeCard key={c._id} challenge={c} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}

          {/* ── Failed Challenges ─────────────────────────────────────── */}
          {failed.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Failed
                <span className="text-slate-600 normal-case tracking-normal font-normal">({failed.length})</span>
              </h3>
              <div className="space-y-3">
                {failed.map((c) => (
                  <ChallengeCard key={c._id} challenge={c} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {showModal && (
        <CreateChallengeModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}
    </div>
  );
};

export default ChallengesPage;
