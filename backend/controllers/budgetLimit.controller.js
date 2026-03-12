import BudgetLimit from "../models/budgetLimit.js";
import Expense from "../models/expense.js";
import mongoose from "mongoose";

/**
 * Recalculate spending for all categories in a specific month/year for a user
 */
export const recalculateSpending = async (userId, month, year) => {
  const transactions = await Expense.find({
    userId,
    type: "expense",
    entryMode: "actual",
    transactionDate: {
      $gte: new Date(year, parseInt(month) - 1, 1),
      $lt: new Date(year, parseInt(month), 1),
    },
  });

  const spendingMap = {};
  transactions.forEach((tx) => {
    if (tx.category) {
      spendingMap[tx.category] = (spendingMap[tx.category] || 0) + tx.amount;
    }
  });

  const budgetLimit = await BudgetLimit.findOne({ userId, month, year: parseInt(year) });
  if (budgetLimit) {
    budgetLimit.categoryLimits.forEach((cl) => {
      cl.spent = spendingMap[cl.category] || 0;
      cl.lastUpdated = new Date();
    });
    await budgetLimit.save();
  }
  return spendingMap;
};

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Baby", icon: "Baby" },
  { name: "Beauty", icon: "Sparkles" },
  { name: "Bills", icon: "FileText" },
  { name: "Car", icon: "Car" },
  { name: "Clothing", icon: "Shirt" },
  { name: "Education", icon: "GraduationCap" },
  { name: "Electronics", icon: "Laptop" },
  { name: "Entertainment", icon: "Film" },
  { name: "Food", icon: "UtensilsCrossed" },
  { name: "Health", icon: "HeartPulse" },
  { name: "Home", icon: "Home" },
  { name: "Shopping", icon: "ShoppingCart" },
  { name: "Sports", icon: "Trophy" },
  { name: "Tax", icon: "Receipt" },
  { name: "Telephone", icon: "Phone" },
  { name: "Transportation", icon: "Bus" },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", icon: "Briefcase" },
  { name: "Freelance", icon: "Laptop" },
  { name: "Investments", icon: "TrendingUp" },
  { name: "Refund", icon: "RotateCcw" },
  { name: "Gift", icon: "Gift" },
  { name: "Other", icon: "Tag" },
];

export const getCategoryBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.id;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    let budgetLimit = await BudgetLimit.findOne({ userId, month, year: parseInt(year) });

    if (!budgetLimit) {
      // Find the most recent budget limit to copy custom categories
      const lastMonthLimit = await BudgetLimit.findOne({ userId }).sort({ year: -1, month: -1 });
      const customCategories = lastMonthLimit ? lastMonthLimit.customCategories : [];

      // Combine defaults with custom categories
      const categoryLimits = [
        ...DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
          category: cat.name,
          type: "expense",
          icon: cat.icon,
          limit: 0,
          spent: 0,
          isCustom: false,
        })),
        ...DEFAULT_INCOME_CATEGORIES.map((cat) => ({
          category: cat.name,
          type: "income",
          icon: cat.icon,
          limit: 0,
          spent: 0,
          isCustom: false,
        })),
        ...customCategories
          .filter((cat) => cat.isActive)
          .map((cat) => ({
            category: cat.name,
            type: cat.type || "expense",
            icon: cat.icon,
            limit: 0,
            spent: 0,
            isCustom: true,
          })),
      ];

      budgetLimit = await BudgetLimit.create({
        userId,
        month,
        year: parseInt(year),
        categoryLimits,
        customCategories,
      });

      // Initial spending calculation
      await recalculateSpending(userId, month, parseInt(year));
      budgetLimit = await BudgetLimit.findOne({ userId, month, year: parseInt(year) });
    }

    res.status(200).json(budgetLimit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch category budgets" });
  }
};

export const createCustomCategory = async (req, res) => {
  try {
    const { name, icon, limit, month, year, type = "expense" } = req.body;
    const userId = req.user.id;

    if (!name || !month || !year) {
      return res.status(400).json({ message: "Name, month, and year are required" });
    }

    const budgetLimit = await BudgetLimit.findOne({ userId, month, year: parseInt(year) });
    if (!budgetLimit) {
      return res.status(404).json({ message: "Budget limit for month not found. Please load budgets first." });
    }

    // Check for duplicates
    const exists = budgetLimit.categoryLimits.some((cl) => cl.category.toLowerCase() === name.toLowerCase());
    if (exists) {
      return res.status(400).json({ message: "Category with this name already exists" });
    }

    const newCategory = {
      category: name,
      type,
      icon: icon || "Tag",
      limit: limit || 0,
      spent: 0,
      isCustom: true,
    };

    const newPersistentCategory = {
      name,
      type,
      icon: icon || "Tag",
      isActive: true,
    };

    // Add to current month
    budgetLimit.categoryLimits.push(newCategory);
    budgetLimit.customCategories.push(newPersistentCategory);
    await budgetLimit.save();

    // Also update all future months if they exist
    await BudgetLimit.updateMany(
      { userId, $or: [{ year: { $gt: parseInt(year) } }, { year: parseInt(year), month: { $gt: month } }] },
      {
        $push: {
          categoryLimits: { ...newCategory, limit: 0 },
          customCategories: newPersistentCategory,
        },
      }
    );

    res.status(201).json({ message: "Custom category created", budgetLimit });
  } catch (error) {
    res.status(500).json({ message: "Failed to create custom category" });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { category: oldName } = req.params;
    const { name: newName, icon, month, year } = req.body;
    const userId = req.user.id;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const budgetLimit = await BudgetLimit.findOne({ userId, month, year: parseInt(year) });
    if (!budgetLimit) return res.status(404).json({ message: "Budget limit not found" });

    const cl = budgetLimit.categoryLimits.find((c) => c.category === oldName);
    if (!cl) return res.status(404).json({ message: "Category not found" });

    // Enforce name editing only for custom categories if required, but let's allow renaming all for now
    // (User said "Can only edit custom categories" or "allow renaming defaults but keep internal ID constant")
    // Let's allow renaming all for simplicity, but if it's default, we might have issues with icons.
    
    const nameChanged = newName && newName !== oldName;

    // Update current month
    if (nameChanged) cl.category = newName;
    if (icon) cl.icon = icon;
    
    // Sync to customCategories array if it's a custom category
    const customCat = budgetLimit.customCategories.find(c => c.name === oldName);
    if (customCat) {
      if (nameChanged) customCat.name = newName;
      if (icon) customCat.icon = icon;
    }

    await budgetLimit.save();

    // Cascade update to ALL months for this user
    const updateQuery = {};
    if (nameChanged) updateQuery["categoryLimits.$.category"] = newName;
    if (icon) updateQuery["categoryLimits.$.icon"] = icon;

    await BudgetLimit.updateMany(
      { userId, "categoryLimits.category": oldName },
      { $set: updateQuery }
    );

    if (customCat) {
      const customUpdate = {};
      if (nameChanged) customUpdate["customCategories.$.name"] = newName;
      if (icon) customUpdate["customCategories.$.icon"] = icon;
      
      await BudgetLimit.updateMany(
        { userId, "customCategories.name": oldName },
        { $set: customUpdate }
      );
    }

    // Also update Transactions if name changed
    if (nameChanged) {
      await Expense.updateMany(
        { userId, category: oldName },
        { $set: { category: newName } }
      );
    }

    res.status(200).json({ message: "Category updated successfully", budgetLimit });
  } catch (error) {
    res.status(500).json({ message: "Failed to update category" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { month, year, force } = req.body;
    const userId = req.user.id;

    // Check for transactions in ANY month
    const hasTransactions = await Expense.exists({ userId, category });
    if (hasTransactions && !force) {
      const count = await Expense.countDocuments({ userId, category });
      return res.status(400).json({ 
        message: `Cannot delete: ${count} transactions exist in this category.`,
        requiresForce: true,
        transactionCount: count 
      });
    }

    // If forced or no transactions, remove or archive
    // We'll do a soft delete in customCategories and remove from categoryLimits for current/future
    
    await BudgetLimit.updateMany(
      { userId, "categoryLimits.category": category },
      { $pull: { categoryLimits: { category } } }
    );

    await BudgetLimit.updateMany(
      { userId, "customCategories.name": category },
      { $set: { "customCategories.$.isActive": false } }
    );

    // If forced and transactions exist, move them to "Other"
    if (hasTransactions && force) {
      await Expense.updateMany(
        { userId, category },
        { $set: { category: "Other" } }
      );
    }

    const updatedLimit = await BudgetLimit.findOne({ userId, month, year: parseInt(year) });
    res.status(200).json({ message: "Category deleted", budgetLimit: updatedLimit });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete category" });
  }
};

export const restoreDefaults = async (req, res) => {
  try {
    const { month, year } = req.body;
    const userId = req.user.id;

    const budgetLimit = await BudgetLimit.findOne({ userId, month, year: parseInt(year) });
    if (!budgetLimit) return res.status(404).json({ message: "Budget limit not found" });

    let addedCount = 0;
    const allDefaults = [
      ...DEFAULT_EXPENSE_CATEGORIES.map(c => ({ ...c, type: "expense" })),
      ...DEFAULT_INCOME_CATEGORIES.map(c => ({ ...c, type: "income" }))
    ];

    allDefaults.forEach(def => {
      const exists = budgetLimit.categoryLimits.some(cl => cl.category === def.name && cl.type === def.type);
      if (!exists) {
        budgetLimit.categoryLimits.push({
          category: def.name,
          type: def.type,
          icon: def.icon,
          limit: 0,
          spent: 0,
          isCustom: false
        });
        addedCount++;
      }
    });

    if (addedCount > 0) await budgetLimit.save();
    
    res.status(200).json({ message: `Restored ${addedCount} default categories`, budgetLimit });
  } catch (error) {
    res.status(500).json({ message: "Failed to restore defaults" });
  }
};

export const updateCategoryBudget = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit, month, year } = req.body;
    const userId = req.user.id;

    if (!month || !year || limit === undefined) {
      return res.status(400).json({ message: "Limit, month, and year are required" });
    }

    const budgetLimit = await BudgetLimit.findOneAndUpdate(
      { userId, month, year: parseInt(year), "categoryLimits.category": category },
      { 
        $set: { 
          "categoryLimits.$.limit": limit,
          "categoryLimits.$.lastUpdated": new Date()
        } 
      },
      { new: true, runValidators: true }
    );

    if (!budgetLimit) {
      return res.status(404).json({ message: "Budget limit for category not found" });
    }

    res.status(200).json({ message: "Category budget updated", budgetLimit });
  } catch (error) {
    res.status(500).json({ message: "Failed to update category budget" });
  }
};

export const updateBulkCategoryBudgets = async (req, res) => {
  try {
    const { budgets, month, year } = req.body; // budgets: [{ category, limit }, ...]
    const userId = req.user.id;

    if (!month || !year || !Array.isArray(budgets)) {
      return res.status(400).json({ message: "Budgets array, month, and year are required" });
    }

    const budgetLimit = await BudgetLimit.findOne({ userId, month, year: parseInt(year) });

    if (!budgetLimit) {
      return res.status(404).json({ message: "Budget limit for month not found" });
    }

    budgets.forEach((update) => {
      const categoryLimit = budgetLimit.categoryLimits.find((cl) => cl.category === update.category);
      if (categoryLimit) {
        categoryLimit.limit = update.limit;
        categoryLimit.lastUpdated = new Date();
      }
    });

    await budgetLimit.save();
    res.status(200).json({ message: "Bulk budgets updated", budgetLimit });
  } catch (error) {
    res.status(500).json({ message: "Failed to update bulk budgets" });
  }
};

export const getBudgetProgress = async (req, res) => {
  try {
    const { month, year } = req.query;
    const userId = req.user.id;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    // Always recalculate to ensure accuracy
    await recalculateSpending(userId, month, parseInt(year));
    
    const budgetLimit = await BudgetLimit.findOne({ userId, month, year: parseInt(year) });

    if (!budgetLimit) {
      return res.status(404).json({ message: "Budget limit not found" });
    }

    const report = budgetLimit.categoryLimits.map((cl) => {
      const percentage = cl.limit > 0 ? (cl.spent / cl.limit) * 100 : 0;
      let status = "Green";
      if (percentage >= 100) status = "Red";
      else if (percentage >= 90) status = "Orange";
      else if (percentage >= 75) status = "Yellow";

      return {
        category: cl.category,
        limit: cl.limit,
        spent: cl.spent,
        remaining: Math.max(0, cl.limit - cl.spent),
        percentage,
        status,
        icon: cl.icon
      };
    });

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: "Failed to get budget progress" });
  }
};
