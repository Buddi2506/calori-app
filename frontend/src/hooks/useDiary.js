import { useState, useEffect, useCallback } from 'react';
import { getDiary, addDiaryEntry, updateDiaryEntry, deleteDiaryEntry } from '../api/diary';

export function useDiary(date) {
  const [diaryData, setDiaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDiary = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDiary(date);
      setDiaryData(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch diary');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchDiary();
  }, [fetchDiary]);

  const addEntry = async (entryData) => {
    try {
      await addDiaryEntry(entryData);
      await fetchDiary();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to add entry');
      return false;
    }
  };

  const updateEntry = async (id, updateData) => {
    try {
      await updateDiaryEntry(id, updateData);
      await fetchDiary();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to update entry');
      return false;
    }
  };

  const deleteEntry = async (id) => {
    try {
      await deleteDiaryEntry(id);
      await fetchDiary();
      return true;
    } catch (err) {
      setError(err.message || 'Failed to delete entry');
      return false;
    }
  };

  return {
    diaryData,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refreshDiary: fetchDiary
  };
}
