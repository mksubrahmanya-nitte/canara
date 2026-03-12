import Challenge from "../models/challenge.model.js";
import Expense from "../models/expense.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const clamp100 = (n) => Math.min(100, Math.max(0, n));

const todayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/** Points formula: longer + bigger-streak = more points */
const calcPoints = (challenge) => {
  const base = challenge.duration * 5;
  const streakBonus = (challenge.streak || 0) * 2;
  return base + streakBonus;
};

/** Rank label from total points */
export const pointsToRank = (points) => {
  if (points >= 2000) return "Finance Champion";
  if (points >= 1000) return "Budget Master";
  if (points >= 500) return "Smart Saver";
  if (points >= 200) return "Saver Apprentice";
  return "Beginner";
};

// ─── Public CRUD ────────────────────────────────────────────────────────────

export const createChallenge = async (req, res) => {
  try {
    const { title, challengeType, category, targetAmount, duration, startDate } = req.body;

    if (!title?.trim()) return res.status(400).json({ message: "Title is required" });
    if (!["daily_limit", "category_avoidance", "savings_goal"].includes(challengeType)) {
      return res.status(400).json({ message: "Invalid challenge type" });
    }
    if (challengeType === "category_avoidance" && !category?.trim()) {
      return res.status(400).json({ message: "Category is required for avoidance challenges" });
    }

    const parsedTarget = Number(targetAmount);
    if (!Number.isFinite(parsedTarget) || parsedTarget < 0) {
      return res.status(400).json({ message: "Target amount must be a non-negative number" });
    }

    const parsedDuration = Number(duration);
    if (!Number.isInteger(parsedDuration) || parsedDuration < 1) {
      return res.status(400).json({ message: "Duration must be at least 1 day" });
    }

    const start = startDate ? new Date(startDate) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + parsedDuration);

    const challenge = await Challenge.create({
      userId: req.user.id,
      title: title.trim(),
      challengeType,
      category: category?.trim() || null,
      targetAmount: parsedTarget,
      duration: parsedDuration,
      startDate: start,
      endDate: end,
    });

    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ message: "Failed to create challenge" });
  }
};

export const getUserChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(challenges);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
};

/** Returns active challenges enriched with a riskWarning field for daily_limit type. */
export const getActiveChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.user.id, status: "active" }).sort({
      startDate: 1,
    });

    const { start: todayStart, end: todayEnd } = todayRange();

    const enriched = await Promise.all(
      challenges.map(async (c) => {
        const obj = c.toObject();
        obj.riskWarning = null;

        if (c.challengeType === "daily_limit" && c.targetAmount > 0) {
          const todayExpenses = await Expense.find({
            userId: req.user.id,
            type: "expense",
            entryMode: { $ne: "demo" },
            transactionDate: { $gte: todayStart, $lte: todayEnd },
          });
          const todayTotal = todayExpenses.reduce((s, t) => s + t.amount, 0);
          const pct = todayTotal / c.targetAmount;

          if (pct >= 1) {
            obj.riskWarning = {
              level: "danger",
              spent: todayTotal,
              limit: c.targetAmount,
              message: `You've exceeded ₹${c.targetAmount} today (spent ₹${Math.round(todayTotal)}).`,
            };
          } else if (pct >= 0.8) {
            obj.riskWarning = {
              level: "warning",
              spent: todayTotal,
              limit: c.targetAmount,
              message: `You spent ₹${Math.round(todayTotal)} today. Your limit is ₹${c.targetAmount}. One more purchase may fail today's challenge.`,
            };
          }
        }

        return obj;
      }),
    );

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch active challenges" });
  }
};

export const updateChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, status } = req.body;

    const challenge = await Challenge.findOne({ _id: id, userId: req.user.id });
    if (!challenge) return res.status(404).json({ message: "Challenge not found" });

    if (title?.trim()) challenge.title = title.trim();
    if (["active", "completed", "failed"].includes(status)) challenge.status = status;

    await challenge.save();
    res.status(200).json(challenge);
  } catch (error) {
    res.status(500).json({ message: "Failed to update challenge" });
  }
};

export const deleteChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Challenge.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ message: "Challenge not found" });
    res.status(200).json({ message: "Challenge deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete challenge" });
  }
};

// ─── Reward Economy ──────────────────────────────────────────────────────────

/** Returns total points earned and the user's rank label. */
export const getChallengeStats = async (req, res) => {
  try {
    const completed = await Challenge.find({ userId: req.user.id, status: "completed" });
    const totalPoints = completed.reduce((sum, c) => sum + (c.points || 0), 0);
    const rank = pointsToRank(totalPoints);

    res.status(200).json({
      totalPoints,
      rank,
      completedCount: completed.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch challenge stats" });
  }
};

// ─── AI Challenge Suggestion ─────────────────────────────────────────────────

/**
 * Analyse last 30 days of transactions and suggest a personalised challenge.
 * Strategy:
 *   1. Find the top spending category.
 *   2. If average daily spend > 300 → suggest a daily_limit challenge.
 *   3. Else → suggest a category_avoidance challenge for the top category.
 */
export const suggestChallenge = async (req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    since.setHours(0, 0, 0, 0);

    const expenses = await Expense.find({
      userId: req.user.id,
      type: "expense",
      entryMode: { $ne: "demo" },
      transactionDate: { $gte: since },
    });

    if (expenses.length === 0) {
      return res.status(200).json({
        suggestion: null,
        message: "Add some transactions first to get a personalised suggestion.",
      });
    }

    // Tally per category
    const categoryTotals = {};
    for (const e of expenses) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const [topCategory, topTotal] = sortedCategories[0];

    const days = 30;
    const avgDaily = expenses.reduce((s, e) => s + e.amount, 0) / days;
    const avgDailyRounded = Math.round(avgDaily);

    let suggestion;

    if (avgDaily > 300) {
      // Suggest a daily limit challenge
      const suggestedLimit = Math.round(avgDaily * 0.8); // 20% cut
      const potentialSavings = Math.round((avgDaily - suggestedLimit) * 14);
      suggestion = {
        type: "daily_limit",
        title: `Keep daily spending under ₹${suggestedLimit}`,
        challengeType: "daily_limit",
        category: null,
        targetAmount: suggestedLimit,
        duration: 14,
        potentialSavings,
        reason: `You average ₹${avgDailyRounded}/day. Cutting 20% saves ~₹${potentialSavings} over 14 days.`,
      };
    } else {
      // Suggest avoiding the top category for 14 days
      const potentialSavings = Math.round(topTotal / 2);
      suggestion = {
        type: "category_avoidance",
        title: `Avoid "${topCategory}" for 14 days`,
        challengeType: "category_avoidance",
        category: topCategory,
        targetAmount: 0,
        duration: 14,
        potentialSavings,
        reason: `You spent ₹${Math.round(topTotal)} on ${topCategory} last month — your highest category.`,
      };
    }

    res.status(200).json({ suggestion });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate suggestion" });
  }
};

// ─── Internal: progress update after transaction ───────────────────────────

export const updateChallengeProgress = async (userId, transaction) => {
  try {
    const now = new Date();
    const activeChallenges = await Challenge.find({ userId, status: "active" });
    if (!activeChallenges.length) return;

    const { start: todayStart, end: todayEnd } = todayRange();

    for (const challenge of activeChallenges) {
      const wasActive = challenge.status === "active";

      // Auto-expire if past end date
      if (now > challenge.endDate) {
        challenge.status = challenge.progress >= 100 ? "completed" : "failed";
        if (challenge.status === "completed" && challenge.points === 0) {
          challenge.points = calcPoints(challenge);
        }
        await challenge.save();
        continue;
      }

      if (challenge.challengeType === "category_avoidance") {
        if (transaction.type === "expense" && transaction.category === challenge.category) {
          challenge.status = "failed";
        } else {
          const daysPassed = Math.floor((now - challenge.startDate) / 86_400_000);
          challenge.streak = daysPassed;
          challenge.progress = clamp100((daysPassed / challenge.duration) * 100);
          if (now >= challenge.endDate) challenge.status = "completed";
        }
      } else if (challenge.challengeType === "daily_limit") {
        const todayExpenses = await Expense.find({
          userId,
          type: "expense",
          entryMode: { $ne: "demo" },
          transactionDate: { $gte: todayStart, $lte: todayEnd },
        });
        const todayTotal = todayExpenses.reduce((s, t) => s + t.amount, 0);

        if (todayTotal > challenge.targetAmount) {
          challenge.streak = 0;
        } else {
          challenge.streak = Math.min(challenge.streak + 1, challenge.duration);
        }
        challenge.progress = clamp100((challenge.streak / challenge.duration) * 100);
        if (challenge.streak >= challenge.duration) challenge.status = "completed";
      } else if (challenge.challengeType === "savings_goal") {
        const allTx = await Expense.find({
          userId,
          entryMode: { $ne: "demo" },
          transactionDate: { $gte: challenge.startDate, $lte: challenge.endDate },
        });
        const income = allTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expenses = allTx.filter((t) => t.type !== "income").reduce((s, t) => s + t.amount, 0);
        const netSavings = Math.max(0, income - expenses);

        challenge.progress = clamp100((netSavings / challenge.targetAmount) * 100);
        if (netSavings >= challenge.targetAmount) challenge.status = "completed";
      }

      // Award points when newly completed
      if (wasActive && challenge.status === "completed" && challenge.points === 0) {
        challenge.points = calcPoints(challenge);
      }

      await challenge.save();
    }
  } catch (err) {
    console.error("updateChallengeProgress error:", err);
  }
};
