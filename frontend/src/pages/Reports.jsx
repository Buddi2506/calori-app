import React, { useState } from 'react';
import DailyReport from './reports/DailyReport';
import WeeklyReport from './reports/WeeklyReport';
import MonthlyReport from './reports/MonthlyReport';

// ─── Main Component ─────────────────────────────────────────────────────────
const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">📊 Nutrition Reports</h2>
          <p className="text-gray-500 text-sm mt-1 font-medium">Analyse your dietary trends and micronutrient patterns — daily, weekly, and monthly.</p>
        </div>

        {/* Tabs matching Zentra pill style */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-gray-200/80 shadow-sm self-start sm:self-auto">
          {['daily', 'weekly', 'monthly'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'pill-active shadow-sm'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              {tab === 'daily' ? '📅 Daily' : tab === 'weekly' ? '📆 Weekly' : '🗓️ Monthly'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'daily'   && <DailyReport />}
      {activeTab === 'weekly'  && <WeeklyReport />}
      {activeTab === 'monthly' && <MonthlyReport />}
    </div>
  );
};

export default Reports;
