import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Pencil, Tag } from "lucide-react";
import IconPicker from "../../components/IconPicker";

const EditCategoryModal = ({ isOpen, onClose, onUpdate, isSubmitting, category }) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Tag");
  const [error, setError] = useState("");

  useEffect(() => {
    if (category) {
      setName(category.category);
      setIcon(category.icon || "Tag");
    }
  }, [category]);

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

    onUpdate(category.category, { name: name.trim(), icon });
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
            <div className="p-2 rounded-lg bg-orange-600/20 text-orange-400">
                <Pencil size={20} />
            </div>
            Edit Category
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
              placeholder="e.g. Dining Out..."
              className="w-full bg-slate-950/50 border border-slate-700 rounded-2xl py-3 px-4 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-semibold"
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
              {isSubmitting ? "Saving..." : "Update Category"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditCategoryModal;
