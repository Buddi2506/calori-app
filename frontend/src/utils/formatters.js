import { format } from 'date-fns';

export const formatNutrient = (value, unit) => {
  if (value === undefined || value === null) return `0 ${unit}`;
  return `${Number(value).toFixed(1)} ${unit}`;
};

export const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'EEEE, d MMM yyyy');
};

export const formatApiDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'yyyy-MM-dd');
};

export const getProgressColor = (percentage) => {
  if (percentage >= 80 && percentage <= 100) return 'bg-green-500';
  if (percentage > 100) return 'bg-red-500';
  if (percentage >= 50) return 'bg-orange-500';
  return 'bg-gray-400';
};

export const formatGoalPercentage = (percentage) => {
  if (percentage === undefined || percentage === null) return '0%';
  return `${Math.round(percentage)}%`;
};
