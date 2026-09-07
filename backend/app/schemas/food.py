from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FoodBase(BaseModel):
    name: str
    name_local: Optional[str] = None
    category: str
    source: str
    source_id: Optional[str] = None
    serving_size_g: float
    serving_unit: str
    serving_unit_weight_g: float
    calories: float = 0.0
    protein: float = 0.0
    carbohydrates: float = 0.0
    fat: float = 0.0
    fiber: float = 0.0
    sugar: float = 0.0
    sodium: float = 0.0
    potassium: float = 0.0
    iron: float = 0.0
    calcium: float = 0.0
    vitamin_c: float = 0.0
    vitamin_d: float = 0.0
    vitamin_b12: float = 0.0
    magnesium: float = 0.0
    zinc: float = 0.0
    saturated_fat: float = 0.0
    trans_fat: float = 0.0
    cholesterol: float = 0.0

class FoodCreate(FoodBase):
    is_custom: bool = True

class FoodRead(FoodBase):
    id: int
    is_custom: bool
    created_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2

class FoodSearchResult(BaseModel):
    items: list[FoodRead]
