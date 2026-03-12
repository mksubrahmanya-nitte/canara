import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Save, RotateCcw, Info, Pencil, Trash2, RefreshCw, X
} from "lucide-react";
import { useBudgetOutlet } from "./useBudgetOutlet";
import { 
  fetchCategoryBudgets, 
  updateBulkBudgets,
  createCustomCategory,
  updateCategoryMetadata,
  deleteCategory,
  restoreDefaultCategories
} from "../../lib/budgetCategories";
import { monthTitle } from "../../lib/budget";
import { ICON_MAP } from "../../components/IconPicker";
import AddCategoryModal from "./AddCategoryModal";
import EditCategoryModal from "./EditCategoryModal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const BudgetCategoriesPage = () => {
  const { currentMonth, money, stats } = useBudgetOutlet();
  const [budgetData, setBudgetData] = useState(null);
  const [localLimits, setLocalLimits] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const year = currentMonth.getFullYear();
  const month = String(currentMonth.getMonth() + 1).padStart(2, '0');

  useEffect(() => {
    loadBudgets();
  }, [currentMonth]);

  const loadBudgets = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCategoryBudgets(month, parseInt(year));
      setBudgetData(data);
      const limits = {};
      data.categoryLimits.forEach(cl => {
        limits[cl.category] = cl.limit;
      });
      setLocalLimits(limits);
    } catch (error) {
      console.error("Failed to load budgets", error);
      setMessage({ type: "error", text: "Failed to load budget categories" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLimitChange = (category, value) => {
    const numValue = value === "" ? 0 : parseFloat(value);
    setLocalLimits(prev => ({ ...prev, [category]: numValue }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setMessage({ type: "info", text: "Saving changes..." });
    try {
      const updates = Object.entries(localLimits).map(([category, limit]) => ({
        category,
        limit,
      }));
      await updateBulkBudgets(updates, month, parseInt(year));
      setMessage({ type: "success", text: "Budget limits updated successfully!" });
      loadBudgets();
    } catch (error) {
      console.error("Failed to save budgets", error);
      setMessage({ type: "error", text: "Failed to save budget limits" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (budgetData) {
      const limits = {};
      budgetData.categoryLimits.forEach(cl => {
        limits[cl.category] = 0;
      });
      setLocalLimits(limits);
    }
  };

  // CRUD Handlers
  const handleAddCategory = async (payload) => {
    setIsActionSubmitting(true);
    try {
      await createCustomCategory({ ...payload, month, year: parseInt(year) });
      setShowAddModal(false);
      setMessage({ type: "success", text: `Category "${payload.name}" added!` });
      loadBudgets();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to add category" });
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleUpdateCategory = async (oldName, payload) => {
    setIsActionSubmitting(true);
    try {
      await updateCategoryMetadata(oldName, { ...payload, month, year: parseInt(year) });
      setShowEditModal(false);
      setMessage({ type: "success", text: `Category updated to "${payload.name}"` });
      loadBudgets();
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Failed to update category" });
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryName, force = false) => {
    setIsActionSubmitting(true);
    setDeleteError("");
    try {
      await deleteCategory(categoryName, { month, year: parseInt(year), force });
      setShowDeleteModal(false);
      setMessage({ type: "success", text: `Category "${categoryName}" removed` });
      loadBudgets();
    } catch (error) {
      if (error.response?.data?.requiresForce) {
        setDeleteError(error.response.data.message);
      } else {
        setMessage({ type: "error", text: error.response?.data?.message || "Failed to delete category" });
        setShowDeleteModal(false);
      }
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (window.confirm("Restore missing default categories?")) {
      try {
        await restoreDefaultCategories(month, parseInt(year));
        loadBudgets();
        setMessage({ type: "success", text: "Default categories restored" });
      } catch (error) {
        setMessage({ type: "error", text: "Failed to restore defaults" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500/40 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white">Budget Categories</h1>
          <p className="text-slate-400 text-sm mt-1">Manage thresholds for {monthTitle(currentMonth)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRestoreDefaults}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors"
            title="Restore missing default categories"
          >
            <RefreshCw size={16} /> Restore Defaults
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition-colors"
          >
            <RotateCcw size={16} /> Reset
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            <Save size={16} /> {isSaving ? "Saving..." : "Save All"}
          </button>
        </div>
      </header>

      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-sm ${
          message.type === "error" ? "bg-red-500/10 border border-red-500/20 text-red-400" : 
          message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" :
          "bg-blue-500/10 border border-blue-500/20 text-blue-400"
        }`}>
          <div className="flex items-center gap-3">
            <Info size={16} /> {message.text}
          </div>
          <button onClick={() => setMessage({ type: "", text: "" })} className="opacity-50 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
        {budgetData?.categoryLimits.map((cl) => {
          const Icon = ICON_MAP[cl.icon] || ICON_MAP[cl.category] || Info;
          const currentLimit = localLimits[cl.category] || 0;
          const percentage = currentLimit > 0 ? (cl.spent / currentLimit) * 100 : 0;
          const remaining = Math.max(0, currentLimit - cl.spent);
          
          let progressColor = "bg-emerald-500";
          if (percentage >= 100) progressColor = "bg-red-500";
          else if (percentage >= 90) progressColor = "bg-orange-500";
          else if (percentage >= 75) progressColor = "bg-yellow-500";

          return (
            <motion.div
              layout
              key={cl.category}
              className="bg-slate-900/80 border border-slate-800 rounded-[1.5rem] p-5 flex flex-col gap-4 group hover:border-slate-700 transition-all shadow-xl shadow-black/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm line-clamp-1">{cl.category}</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{cl.isCustom ? "Custom" : "System"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => { setActiveCategory(cl); setShowEditModal(true); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-400 hover:bg-orange-400/10 transition-all"
                    title="Edit name/icon"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => { setActiveCategory(cl); setDeleteError(""); setShowDeleteModal(true); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    title="Remove category"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-black">Threshold (₹)</p>
                    {percentage > 0 && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
                            percentage >= 100 ? "bg-red-500/20 text-red-400" : "bg-slate-800 text-slate-400"
                        }`}>
                            {percentage.toFixed(0)}%
                        </span>
                    )}
                </div>
                <input
                  type="number"
                  value={localLimits[cl.category] === 0 ? "" : localLimits[cl.category]}
                  onChange={(e) => handleLimitChange(cl.category, e.target.value)}
                  placeholder="Unlimited"
                  className="w-full bg-slate-950/50 border border-slate-700/50 rounded-xl py-2.5 px-3 text-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] mt-0.5 px-0.5">
                <div className="text-slate-500">
                  Spent: <span className="font-bold text-slate-300">{money(cl.spent)}</span>
                </div>
                <div className="text-slate-500">
                  Remaining: <span className={`font-bold ${remaining === 0 && currentLimit > 0 ? "text-red-400" : "text-emerald-400"}`}>
                    {money(remaining)}
                  </span>
                </div>
              </div>

              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden mt-0.5 shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, percentage)}%` }}
                  className={`h-full ${progressColor} shadow-lg`}
                />
              </div>
            </motion.div>
          );
        })}

        {/* Add Category Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900/40 border-2 border-dashed border-slate-700/50 rounded-[1.5rem] p-5 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all min-h-[220px] group"
        >
          <div className="p-4 rounded-2xl bg-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-lg">
            <Plus size={32} />
          </div>
          <div className="text-center">
            <p className="text-sm font-black text-slate-400 group-hover:text-indigo-400 transition-colors">Add New Category</p>
            <p className="text-[10px] text-slate-600 mt-1 font-bold">Personalize your tracking</p>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <AddCategoryModal 
            isOpen={showAddModal} 
            onClose={() => setShowAddModal(false)}
            onAdd={handleAddCategory}
            isSubmitting={isActionSubmitting}
          />
        )}
        {showEditModal && (
          <EditCategoryModal 
            isOpen={showEditModal} 
            category={activeCategory}
            onClose={() => setShowEditModal(false)}
            onUpdate={handleUpdateCategory}
            isSubmitting={isActionSubmitting}
          />
        )}
        {showDeleteModal && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            category={activeCategory}
            onClose={() => setShowDeleteModal(false)}
            onDelete={handleDeleteCategory}
            isSubmitting={isActionSubmitting}
            error={deleteError}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BudgetCategoriesPage;
