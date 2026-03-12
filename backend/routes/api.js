import express from "express";
const router = express.Router();

// Import Controllers
import { login, logout, me, refresh, register, updateBudget } from "../controllers/auth.controller.js";

import {
  createSmartTransaction,
  getAiSuggestion,
  getCanIAffordInsight,
  getMonthlyAiReport,
  getEndOfMonthPrediction,
  detectSpendingLeaks,
  detectSubscriptions,
  getGoalDelayImpact,
  getWeeklyAiCheckin,
} from "../controllers/ai.controller.js";

import { getDashboardStats, getAnalysisSummary } from "../controllers/budget.controller.js";
import {
  createChallenge,
  getUserChallenges,
  getActiveChallenges,
  updateChallenge,
  deleteChallenge,
  getChallengeStats,
  suggestChallenge,
} from "../controllers/challenge.controller.js";
import {
  createLoan,
  getUserLoans,
  getLoanSummary,
  markLoanAsPaid,
  deleteLoan,
} from "../controllers/loan.controller.js";
import { getAiBudgetBrief } from "../controllers/aiInsights.controller.js";
import {
  getBudgetProgress,
  getCategoryBudgets,
  updateBulkCategoryBudgets,
  updateCategoryBudget,
  createCustomCategory,
  deleteCategory,
  updateCategory,
  restoreDefaults,
} from "../controllers/budgetLimit.controller.js";
import {
  contributeToGoal,
  createGoal,
  deleteGoal,
  listGoals,
  updateGoal,
} from "../controllers/goal.controller.js";
import {
  clearTransactions,
  createTransaction,
  deleteTransaction,
  getCalendarSummary,
  listTransactions,
  seedDemoData,
  updateTransaction,
} from "../controllers/transaction.controller.js";

// Import Middleware
import authMiddleware from "../middleware/auth.middleware.js";

// Public Routes
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/refresh", refresh);
router.post("/auth/logout", logout);
router.get("/auth/me", authMiddleware, me);
router.patch("/auth/budget", authMiddleware, updateBudget);

// Budget Category Routes
router.get("/budget/categories", authMiddleware, getCategoryBudgets);
router.post("/budget/categories", authMiddleware, createCustomCategory);
router.put("/budget/categories/bulk", authMiddleware, updateBulkCategoryBudgets);
router.put("/budget/categories/:category", authMiddleware, updateCategoryBudget);
router.patch("/budget/categories/:category", authMiddleware, updateCategory);
router.delete("/budget/categories/:category", authMiddleware, deleteCategory);
router.post("/budget/categories/restore-defaults", authMiddleware, restoreDefaults);
router.get("/budget/progress", authMiddleware, getBudgetProgress);

// Protected Routes (Require Auth)
router.post("/transactions", authMiddleware, createTransaction);
router.post("/transactions/ai-add", authMiddleware, createSmartTransaction);
router.post("/transactions/ai-suggest", authMiddleware, getAiSuggestion);
router.post("/transactions/ai-afford", authMiddleware, getCanIAffordInsight);
router.get("/transactions/ai-brief", authMiddleware, getAiBudgetBrief);
router.get("/transactions", authMiddleware, listTransactions);
router.get("/transactions/stats", authMiddleware, getDashboardStats);
router.get("/transactions/calendar", authMiddleware, getCalendarSummary);
router.post("/transactions/seed", authMiddleware, seedDemoData);
router.put("/transactions/:transactionId", authMiddleware, updateTransaction);
router.delete("/transactions/:transactionId", authMiddleware, deleteTransaction);
router.delete("/transactions", authMiddleware, clearTransactions);

// Analysis Routes
router.get("/analysis/summary", authMiddleware, getAnalysisSummary);

// Advanced AI Insights
router.get("/ai/report/monthly", authMiddleware, getMonthlyAiReport);

router.get("/ai/prediction/end-month", authMiddleware, getEndOfMonthPrediction);

router.get("/ai/insights/leaks", authMiddleware, detectSpendingLeaks);

router.get("/ai/insights/subscriptions", authMiddleware, detectSubscriptions);

router.post("/ai/goals/delay-impact", authMiddleware, getGoalDelayImpact);

router.get("/ai/checkin/weekly", authMiddleware, getWeeklyAiCheckin);

// Goals Routes
router.get("/goals", authMiddleware, listGoals);
router.post("/goals", authMiddleware, createGoal);
router.patch("/goals/:goalId", authMiddleware, updateGoal);
router.post("/goals/:goalId/contribute", authMiddleware, contributeToGoal);
router.delete("/goals/:goalId", authMiddleware, deleteGoal);

// Challenge Routes
router.post("/challenges", authMiddleware, createChallenge);
router.get("/challenges", authMiddleware, getUserChallenges);
router.get("/challenges/active", authMiddleware, getActiveChallenges);
router.get("/challenges/stats", authMiddleware, getChallengeStats);
router.get("/challenges/suggest", authMiddleware, suggestChallenge);
router.put("/challenges/:id", authMiddleware, updateChallenge);
router.delete("/challenges/:id", authMiddleware, deleteChallenge);

// Loan Routes
router.post("/loans", authMiddleware, createLoan);
router.get("/loans", authMiddleware, getUserLoans);
router.get("/loans/summary", authMiddleware, getLoanSummary);
router.put("/loans/:id/pay", authMiddleware, markLoanAsPaid);
router.delete("/loans/:id", authMiddleware, deleteLoan);

export default router;
