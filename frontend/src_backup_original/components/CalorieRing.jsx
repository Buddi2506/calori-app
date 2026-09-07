import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const CalorieRing = ({ calories = 0, goal = 2000, protein = 0, carbs = 0, fat = 0 }) => {
  const remaining = Math.max(goal - calories, 0);
  
  // Just show calories if no macros yet
  const hasMacros = protein > 0 || carbs > 0 || fat > 0;
  
  const data = hasMacros ? [
    { name: 'Protein', value: protein * 4, color: '#f97316' }, // Orange for protein
    { name: 'Carbs', value: carbs * 4, color: '#eab308' }, // Yellow for carbs
    { name: 'Fat', value: fat * 9, color: '#ef4444' }, // Red for fat
    { name: 'Remaining', value: remaining, color: '#e5e7eb' } // Gray
  ] : [
    { name: 'Consumed', value: calories, color: '#22c55e' },
    { name: 'Remaining', value: remaining, color: '#e5e7eb' }
  ];

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
            isAnimationActive={true}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-3xl font-bold text-gray-900">{Math.round(calories)}</span>
        <span className="text-sm text-gray-500 font-medium mt-1">kcal eaten</span>
      </div>
    </div>
  );
};

export default CalorieRing;
