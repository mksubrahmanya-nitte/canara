import { 
  Baby, Sparkles, FileText, Car, Shirt, GraduationCap, Laptop, 
  Film, UtensilsCrossed, HeartPulse, Home, ShoppingCart, Trophy, 
  Receipt, Phone, Bus, Tag, Info, Plane, Gift, Coffee, Music, 
  Gamepad, Camera, Briefcase, Dog, ShoppingBag, Waves, Cloud, Compass
} from "lucide-react";

const ICON_MAP = {
  Baby, Sparkles, FileText, Car, Shirt, GraduationCap, Laptop, 
  Film, UtensilsCrossed, HeartPulse, Home, ShoppingCart, Trophy, 
  Receipt, Phone, Bus, Tag, Info, Plane, Gift, Coffee, Music, 
  Gamepad, Camera, Briefcase, Dog, ShoppingBag, Waves, Cloud, Compass
};

const IconPicker = ({ selectedIcon, onSelect }) => {
  return (
    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 bg-slate-900/50 rounded-xl border border-slate-700">
      {Object.entries(ICON_MAP).map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          onClick={() => onSelect(name)}
          className={`p-3 rounded-lg flex items-center justify-center transition-all ${
            selectedIcon === name 
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" 
              : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
          }`}
          title={name}
        >
          <Icon size={20} />
        </button>
      ))}
    </div>
  );
};

export default IconPicker;
export { ICON_MAP };
