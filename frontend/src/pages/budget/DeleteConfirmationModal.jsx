import { motion } from "framer-motion";
import { X, Trash2, AlertTriangle } from "lucide-react";

const DeleteConfirmationModal = ({ isOpen, onClose, onDelete, isSubmitting, category, error }) => {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl"
      >
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-full bg-red-500/10 text-red-500">
            <Trash2 size={32} />
          </div>
          
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Delete Category?</h2>
            <p className="text-slate-400 text-sm">
              Are you sure you want to remove <span className="text-white font-bold">"{category.category}"</span>?
            </p>
          </div>

          {error && (
            <div className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-3 text-left">
              <AlertTriangle size={24} className="shrink-0" />
              <div>
                <p className="font-bold">Cannot delete</p>
                <p className="text-xs opacity-80">{error}</p>
              </div>
            </div>
          )}

          <div className="w-full flex flex-col gap-2 pt-2">
            {!error ? (
              <button
                onClick={() => onDelete(category.category)}
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
              >
                {isSubmitting ? "Deleting..." : "Yes, Delete Category"}
              </button>
            ) : (
                <button
                    onClick={() => onDelete(category.category, true)}
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-red-500/20"
                >
                    {isSubmitting ? "Deleting..." : "Force Delete & Move to 'Other'"}
                </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl text-slate-400 font-bold hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DeleteConfirmationModal;
