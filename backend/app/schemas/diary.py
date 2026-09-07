from pydantic import BaseModel
from datetime import date, datetime
from typing import List, Dict, Optional
from .food import FoodRead

class DiaryEntryBase(BaseModel):
    date: date
    meal_type: str
    food_id: int
    quantity_display: float
    quantity_unit: str

class DiaryEntryCreate(DiaryEntryBase):
    pass

class DiaryEntryRead(DiaryEntryBase):
    id: int
    quantity_g: float
    calories: float
    protein: float
    carbohydrates: float
    fat: float
    fiber: float
    sodium: float
    potassium: float
    iron: float
    calcium: float
    vitamin_c: float
    vitamin_d: float
    vitamin_b12: float
    magnesium: float
    zinc: float
    saturated_fat: float
    cholesterol: float
    created_at: datetime
    food: FoodRead
    class Config:
        from_attributes = True  # Pydantic v2

class DailyDiaryResponse(BaseModel):
    date: date
    entries_by_meal: Dict[str, List[DiaryEntryRead]]
    totals: Dict[str, float]
