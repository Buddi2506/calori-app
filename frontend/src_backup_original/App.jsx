import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Diary from './pages/Diary';
import CustomMeals from './pages/CustomMeals';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import FoodList from './pages/FoodList';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="diary" element={<Diary />} />
          <Route path="diary/:date" element={<Diary />} />
          <Route path="foods" element={<FoodList />} />
          <Route path="meals" element={<CustomMeals />} />
          <Route path="goals" element={<Goals />} />
          <Route path="reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
