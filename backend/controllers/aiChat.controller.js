import { GoogleGenerativeAI } from "@google/generative-ai";
import Expense from "../models/expense.js";
import Goal from "../models/goal.js";
import User from "../models/user.js";

const GEMINI_MODEL = "gemini-2.5-flash-lite";

const getGeminiApiKey = () =>
  process.env.GEMINI_API_KEY || process.env["GEMINI_API+KEY"] || process.env.GEMINI_KEY || "";

const roundToTwo = (value) => Number((Number(value) || 0).toFixed(2));

const getMonthRange = (monthString) => {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;

  if (monthString) {
    const [yearStr, monthStr] = String(monthString).split("-");
    const parsedYear = Number(yearStr);
    const parsedMonth = Number(monthStr);
    if (Number.isInteger(parsedYear) && Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
      year = parsedYear;
      month = parsedMonth;
    }
  }

  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month, 1);
  end.setHours(0, 0, 0, 0);
  return { start, end };
};

const fallbackResponse = ({ message, context }) => {
  const lower = message.toLowerCase();
  if (lower.includes("save") || lower.includes("savings")) {
    return `Try a 50-30-20 student split with your current numbers: keep essentials under ${roundToTwo(
      context.totalExpenses * 0.8,
    )}, and auto-transfer a fixed savings amount right after income day.`;
  }

  if (lower.includes("food") || lower.includes("hostel") || lower.includes("mess")) {
    return "For student food spending, use a weekly cap and one no-order day each week. Track that category separately to avoid silent overspending.";
  }

  if (context.netBalance < 0) {
    return "You are currently spending above income this month. Pause discretionary buys for 7 days, then re-check categories with the biggest spend to recover your balance.";
  }

  return "Great question. Based on your current month, prioritize essentials first, reserve goal savings second, and keep a small emergency buffer before any discretionary purchase.";
};

const buildPrompt = ({ message, history, context }) => `You are Canara AI, a helpful budgeting chatbot for students in India.
Be concise, practical, and supportive. Use INR and student-specific advice.
Never hallucinate data; only use context below.

Context JSON:
${JSON.stringify(context)}

Recent chat history JSON:
${JSON.stringify(history)}

User message:
${message}

Reply in plain text with:
1) one short direct answer,
2) one numeric suggestion,
3) one next action the student can do today.
Limit to 120 words.`;

export const chatWithBudgetAi = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const month = req.body.month;
    const history = Array.isArray(req.body.history)
      ? req.body.history
          .slice(-8)
          .map((item) => ({
            role: item?.role === "assistant" ? "assistant" : "user",
            content: String(item?.content || "").slice(0, 400),
          }))
      : [];

    if (!message) {
      return res.status(400).json({ message: "Chat message is required" });
    }

    const mode = req.body.mode === "demo" ? "demo" : "actual";
    const { start, end } = getMonthRange(month);

    const [transactions, goals, user] = await Promise.all([
      Expense.find({
        userId: req.user.id,
        entryMode: mode === "demo" ? "demo" : { $ne: "demo" },
        transactionDate: { $gte: start, $lt: end },
      })
        .sort({ transactionDate: -1 })
        .limit(120),
      Goal.find({ userId: req.user.id, isArchived: false }),
      User.findById(req.user.id),
    ]);

    const totalIncome = transactions.filter((txn) => txn.type === "income").reduce((sum, txn) => sum + txn.amount, 0);
    const totalExpenses = transactions.filter((txn) => txn.type !== "income").reduce((sum, txn) => sum + txn.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    const topCategories = Object.entries(
      transactions
        .filter((txn) => txn.type !== "income")
        .reduce((acc, txn) => {
          const key = txn.category || "Other";
          acc[key] = (acc[key] || 0) + Number(txn.amount || 0);
          return acc;
        }, {}),
    )
      .map(([category, amount]) => ({ category, amount: roundToTwo(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    const context = {
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      currency: user?.currency || "INR",
      monthlyBudget: roundToTwo(user?.monthlyBudget || 0),
      totalIncome: roundToTwo(totalIncome),
      totalExpenses: roundToTwo(totalExpenses),
      netBalance: roundToTwo(netBalance),
      goals: goals.map((goal) => ({
        title: goal.title,
        targetAmount: roundToTwo(goal.targetAmount || 0),
        savedAmount: roundToTwo(goal.savedAmount || 0),
      })),
      topCategories,
      transactionCount: transactions.length,
    };

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return res.status(200).json({ reply: fallbackResponse({ message, context }), source: "fallback", context });
    }

    try {
      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(buildPrompt({ message, history, context }));
      const reply = String(result.response.text() || "").trim();
      return res.status(200).json({
        reply: reply || fallbackResponse({ message, context }),
        source: reply ? "gemini" : "fallback",
        context,
      });
    } catch {
      return res.status(200).json({ reply: fallbackResponse({ message, context }), source: "fallback", context });
    }
  } catch {
    return res.status(500).json({ message: "Failed to process AI chat" });
  }
};
