import React, { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Segmented from '../components/ui/Segmented';
import DailyReport from './reports/DailyReport';
import WeeklyReport from './reports/WeeklyReport';
import MonthlyReport from './reports/MonthlyReport';

const TABS = [
  { id: 'daily', label: 'Day' },
  { id: 'weekly', label: 'Week' },
  { id: 'monthly', label: 'Month' },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('daily');

  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Reports" title="Nutrition reports" subtitle="Trends in what you eat, against your goals">
        <Segmented label="Report period" options={TABS} value={activeTab} onChange={setActiveTab} />
      </PageHeader>

      {activeTab === 'daily' && <DailyReport />}
      {activeTab === 'weekly' && <WeeklyReport />}
      {activeTab === 'monthly' && <MonthlyReport />}
    </div>
  );
};

export default Reports;
