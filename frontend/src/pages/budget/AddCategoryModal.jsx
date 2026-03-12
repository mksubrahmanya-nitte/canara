import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Tag } from "lucide-react";
import IconPicker from "../../components/IconPicker";

const AddCategoryModal = ({ isOpen, onClose, onAdd, isSubmitting }) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Tag");
  const [limit, setLimit] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Category name is required");
      return;
    }
    if (name.length < 2 || name.length > 30) {
      setError("Name must be 2-30 characters");
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(name)) {
      setError("Only letters and spaces allowed");
      return;
    }

    onAdd({ name: name.trim(), icon, limit: parseFloat(limit) || 0 });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-600/20 text-indigo-400">
                <Plus size={20} />
            </div>
            Add Custom Category
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category Name</label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pet Care, Subscriptions..."
              className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Initial Budget (Optional)</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Limit in ₹"
              className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Select Icon</label>
            <IconPicker selectedIcon={icon} onSelect={setIcon} />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 py-2 px-4 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/20"
            >
              {isSubmitting ? "Adding..." : "Add Category"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddCategoryModal;
