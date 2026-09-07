import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * NutrientInsightCard
 * Frosted gradient grain card matching the 75% Insights card in Zentra.
 */
const NutrientInsightCard = ({ caloriesEaten = 0, calorieGoal = 2000, proteinEaten = 0, proteinGoal = 140 }) => {
  const adherence = Math.min(100, Math.round((caloriesEaten / (calorieGoal || 1)) * 100));
  const proteinPct = Math.min(100, Math.round((proteinEaten / (proteinGoal || 1)) * 100));

  return (
    <div className="gradient-insight rounded-[28px] p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
      
      {/* Glossy Badge */}
      <div className="relative z-10">
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 inline-flex items-center gap-1.5 shadow-sm">
          <Sparkles size={13} /> Nutrient Insight
        </span>

        {/* Big Display Number */}
        <p className="text-5xl font-black mt-5 tracking-tight drop-shadow-sm">
          {adherence}%
        </p>
        
        <p className="text-xs font-semibold text-white/95 mt-2 leading-relaxed">
          {proteinPct >= 80 
            ? `Excellent nutrition! You achieved ${proteinPct}% of your protein target today. Andhra chicken curry & dals provided vital iron & zinc.`
            : `Balanced energy intake. Add an egg or a cup of dal/sprouts to reach your ${proteinGoal}g protein goal.`
          }
        </p>
      </div>

      {/* Card Footer Link */}
      <div className="relative z-10 pt-4 border-t border-white/20 flex justify-between items-center text-xs text-white/90 font-medium">
        <span>Target: {calorieGoal} kcal</span>
        <Link to="/reports" className="inline-flex items-center gap-1 hover:text-white underline text-[11px]">
          Full analytics <ArrowUpRight size={13} />
        </Link>
      </div>

    </div>
  );
};

export default NutrientInsightCard;
