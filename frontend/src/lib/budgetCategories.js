import api from "./api";

/**
 * Fetch budget limits and spent amounts for a specific month
 * @param {string} month - Format "MM"
 * @param {number} year - Format YYYY
 */
export const fetchCategoryBudgets = async (month, year) => {
  const { data } = await api.get(`/api/budget/categories`, {
    params: { month, year },
  });
  return data;
};

/**
 * Update budget limit for a single category
 */
export const updateCategoryBudget = async (category, limit, month, year) => {
  const { data } = await api.put(`/api/budget/categories/${category}`, {
    limit,
    month,
    year,
  });
  return data;
};

/**
 * Update budget limits for multiple categories at once
 */
export const updateBulkBudgets = async (budgets, month, year) => {
  const { data } = await api.put(`/api/budget/categories/bulk`, {
    budgets,
    month,
    year,
  });
  return data;
};

/**
 * Fetch budget vs actual spending progress report
 */
export const fetchBudgetProgress = async (month, year) => {
  const { data } = await api.get(`/api/budget/progress`, {
    params: { month, year },
  });
  return data;
};
/**
 * Create a new custom category
 */
export const createCustomCategory = async (categoryData) => {
  const { data } = await api.post(`/api/budget/categories`, categoryData);
  return data;
};

/**
 * Update category metadata (name, icon)
 */
export const updateCategoryMetadata = async (oldName, updates) => {
  const { data } = await api.patch(`/api/budget/categories/${oldName}`, updates);
  return data;
};

/**
 * Delete or archive a category
 */
export const deleteCategory = async (category, options) => {
  const { data } = await api.delete(`/api/budget/categories/${category}`, {
    data: options,
  });
  return data;
};

/**
 * Restore default category set
 */
export const restoreDefaultCategories = async (month, year) => {
  const { data } = await api.post(`/api/budget/categories/restore-defaults`, { month, year });
  return data;
};

/**
 * Fetch categorized available categories for dropdowns
 */
export const getAvailableCategories = async (month, year) => {
  try {
    const budgetData = await fetchCategoryBudgets(month, year);
    
    if (!budgetData || !budgetData.categoryLimits || budgetData.categoryLimits.length === 0) {
      // Return hardcoded defaults if no data exists yet
      return {
        income: ["Salary", "Freelance", "Investments", "Refund", "Gift", "Other"],
        expense: [
          "Baby", "Beauty", "Bills", "Car", "Clothing", "Education", "Electronics", 
          "Entertainment", "Food", "Health", "Home", "Shopping", "Sports", 
          "Tax", "Telephone", "Transportation"
        ],
      };
    }

    const incomeCategories = budgetData.categoryLimits
      .filter(cl => cl.type === "income")
      .map(cl => cl.category);
      
    const expenseCategories = budgetData.categoryLimits
      .filter(cl => cl.type === "expense")
      .map(cl => cl.category);
    
    return { 
      income: incomeCategories.length > 0 ? incomeCategories : ["Salary", "Freelance", "Investments", "Refund", "Gift", "Other"],
      expense: expenseCategories.length > 0 ? expenseCategories : ["Food", "Transport", "Rent", "Utilities", "Shopping", "Health", "Entertainment", "Education", "Savings", "Other"]
    };
  } catch (error) {
    console.error("Failed to fetch available categories", error);
    return {
      income: ["Salary", "Freelance", "Investments", "Refund", "Gift", "Other"],
      expense: ["Food", "Transport", "Rent", "Utilities", "Shopping", "Health", "Entertainment", "Education", "Savings", "Other"],
    };
  }
};
