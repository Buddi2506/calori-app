import React, { useState, useEffect } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Activity, Droplet, Flame, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import CalorieRing from '../components/CalorieRing';
import NutrientProgressBar from '../components/NutrientProgressBar';
import { getDailyReport } from '../api/reports';
import { formatApiDate } from '../utils/formatters';

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const data = await getDailyReport(formatApiDate(currentDate));
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [currentDate]);

  const handlePrevDay = () => setCurrentDate(prev => subDays(prev, 1));
  const handleNextDay = () => setCurrentDate(prev => addDays(prev, 1));
  const isToday = formatApiDate(currentDate) === formatApiDate(new Date());

  if (loading && !report) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  const data = report?.totals || {};
  const goals = report?.goals || { calories: 2000, protein: 50, carbohydrates: 250, fat: 70, fiber: 30 };
  const macros = { p: data.protein || 0, c: data.carbohydrates || 0, f: data.fat || 0 };

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <button onClick={handlePrevDay} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900">
            {isToday ? '🍽️ Today' : format(currentDate, 'EEEE')}
          </h2>
          <p className="text-sm text-gray-500">{format(currentDate, 'd MMM yyyy')}</p>
        </div>
        <button
          onClick={handleNextDay}
          disabled={isToday}
          className={`p-2 rounded-lg transition-colors ${isToday ? 'text-gray-200 cursor-not-allowed' : 'hover:bg-gray-100 text-gray-700'}`}
        >
          <ChevronRight />
        </button>
      </div>

      {/* Calorie Ring + Macros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Calorie Ring */}
        <div className="card md:col-span-1 flex flex-col items-center justify-center py-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Calories</h3>
          <CalorieRing
            calories={data.calories || 0}
            goal={goals.calories || 2000}
            protein={macros.p}
            carbs={macros.c}
            fat={macros.f}
          />
          <div className="mt-5 flex gap-6 text-sm font-medium">
            <div className="text-center">
              <span className="text-2xl font-bold text-primary">{Math.round(data.calories || 0)}</span>
              <p className="text-gray-500 text-xs mt-0.5">Eaten</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-700">
                {Math.max(0, Math.round((goals.calories || 2000) - (data.calories || 0)))}
              </span>
              <p className="text-gray-500 text-xs mt-0.5">Remaining</p>
            </div>
          </div>
        </div>

        {/* Macronutrients */}
        <div className="card md:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-900">Macronutrients</h3>
            <Link
              to={`/diary/${formatApiDate(currentDate)}`}
              className="text-sm text-primary font-medium hover:underline"
            >
              View Diary →
            </Link>
          </div>
          <div className="space-y-4">
            <NutrientProgressBar label="Protein" current={data.protein || 0} goal={goals.protein || 50} unit="g" />
            <NutrientProgressBar label="Carbohydrates" current={data.carbohydrates || 0} goal={goals.carbohydrates || 250} unit="g" />
            <NutrientProgressBar label="Fat" current={data.fat || 0} goal={goals.fat || 65} unit="g" />
            <NutrientProgressBar label="Fiber" current={data.fiber || 0} goal={goals.fiber || 30} unit="g" />
            <NutrientProgressBar label="Sugar" current={data.sugar || 0} goal={goals.sugar || 50} unit="g" />
            <NutrientProgressBar label="Saturated Fat" current={data.saturated_fat || 0} goal={goals.saturated_fat || 20} unit="g" />
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          bg="bg-orange-50"
          border="border-orange-100"
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          icon={<Flame size={20} />}
          label="Protein Goal"
          value={`${Math.min(100, Math.round(((data.protein || 0) / (goals.protein || 1)) * 100))}%`}
          valueColor="text-orange-900"
        />
        <StatCard
          bg="bg-blue-50"
          border="border-blue-100"
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          icon={<Droplet size={20} />}
          label="Fiber Goal"
          value={`${Math.min(100, Math.round(((data.fiber || 0) / (goals.fiber || 30)) * 100))}%`}
          valueColor="text-blue-900"
        />
        <StatCard
          bg="bg-green-50"
          border="border-green-100"
          iconBg="bg-green-100"
          iconColor="text-green-600"
          icon={<Activity size={20} />}
          label="Fat Goal"
          value={`${Math.min(100, Math.round(((data.fat || 0) / (goals.fat || 65)) * 100))}%`}
          valueColor="text-green-900"
        />
        <StatCard
          bg="bg-yellow-50"
          border="border-yellow-100"
          iconBg="bg-yellow-100"
          iconColor="text-yellow-600"
          icon={<Zap size={20} />}
          label="Energy"
          value={`${Math.round(data.calories || 0)} kcal`}
          valueColor="text-yellow-900"
        />
      </div>

      {/* Micronutrients — Collapsible */}
      <MicronutrientsSection data={data} goals={goals} />
    </div>
  );
};

const StatCard = ({ bg, border, iconBg, iconColor, icon, label, value, valueColor }) => (
  <div className={`card ${bg} ${border} flex items-center gap-3`}>
    <div className={`${iconBg} p-2 rounded-lg ${iconColor}`}>{icon}</div>
    <div>
      <p className={`text-xs font-medium ${iconColor}`}>{label}</p>
      <p className={`text-lg font-bold ${valueColor}`}>{value}</p>
    </div>
  </div>
);

const MicronutrientsSection = ({ data, goals }) => {
  const [expanded, setExpanded] = useState(false);

  const micros = [
    { label: 'Sodium', key: 'sodium', unit: 'mg', defaultGoal: 2300 },
    { label: 'Potassium', key: 'potassium', unit: 'mg', defaultGoal: 3500 },
    { label: 'Iron', key: 'iron', unit: 'mg', defaultGoal: 18 },
    { label: 'Calcium', key: 'calcium', unit: 'mg', defaultGoal: 1000 },
    { label: 'Vitamin C', key: 'vitamin_c', unit: 'mg', defaultGoal: 90 },
    { label: 'Vitamin D', key: 'vitamin_d', unit: 'mcg', defaultGoal: 20 },
    { label: 'Vitamin B12', key: 'vitamin_b12', unit: 'mcg', defaultGoal: 2.4 },
    { label: 'Magnesium', key: 'magnesium', unit: 'mg', defaultGoal: 420 },
    { label: 'Zinc', key: 'zinc', unit: 'mg', defaultGoal: 11 },
    { label: 'Cholesterol', key: 'cholesterol', unit: 'mg', defaultGoal: 300 },
  ];

  return (
    <div className="card">
      <button
        className="w-full flex justify-between items-center"
        onClick={() => setExpanded(e => !e)}
      >
        <h3 className="text-lg font-bold text-gray-900">Micronutrients</h3>
        <span className="text-sm text-primary font-medium px-3 py-1 bg-green-50 rounded-full">
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </span>
      </button>

      {!expanded && (
        <p className="text-sm text-gray-400 mt-2">
          Iron · Calcium · Vitamin C · Vitamin D · B12 · Magnesium · Zinc · Sodium · Potassium · Cholesterol
        </p>
      )}

      {expanded && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
          {micros.map(m => (
            <NutrientProgressBar
              key={m.key}
              label={m.label}
              current={data[m.key] || 0}
              goal={goals[m.key] || m.defaultGoal}
              unit={m.unit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
