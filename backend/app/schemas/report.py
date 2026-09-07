from pydantic import BaseModel
from typing import Dict, List, Optional
from .diary import DiaryEntryRead

class DailyReport(BaseModel):
    date: str
    totals: Dict[str, float]
    goal_percentages: Dict[str, float]
    entries_by_meal: Dict[str, List[DiaryEntryRead]]

class WeeklyReport(BaseModel):
    start_date: str
    end_date: str
    days: List[Dict]
    averages: Dict[str, float]
    goal_achievement_days: Dict[str, int]

class MonthlyReport(BaseModel):
    year: int
    month: int
    averages: Dict[str, float]
    calendar_data: Dict[int, Dict[str, float]]
    summary: str
