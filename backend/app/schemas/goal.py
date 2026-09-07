from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class NutritionGoalBase(BaseModel):
    calories: float = 2000
    protein: float = 50
    carbohydrates: float = 250
    fat: float = 65
    fiber: float = 30
    sodium: float = 2300
    potassium: float = 3500
    iron: float = 18
    calcium: float = 1000
    vitamin_c: float = 90
    vitamin_d: float = 20
    vitamin_b12: float = 2.4
    magnesium: float = 420
    zinc: float = 11
    saturated_fat: float = 20
    cholesterol: float = 300


class NutritionGoalRead(NutritionGoalBase):
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)


class NutritionGoalUpdate(BaseModel):
    """All fields optional — only provided fields are updated."""
    calories: Optional[float] = None
    protein: Optional[float] = None
    carbohydrates: Optional[float] = None
    fat: Optional[float] = None
    fiber: Optional[float] = None
    sodium: Optional[float] = None
    potassium: Optional[float] = None
    iron: Optional[float] = None
    calcium: Optional[float] = None
    vitamin_c: Optional[float] = None
    vitamin_d: Optional[float] = None
    vitamin_b12: Optional[float] = None
    magnesium: Optional[float] = None
    zinc: Optional[float] = None
    saturated_fat: Optional[float] = None
    cholesterol: Optional[float] = None
