from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .food import FoodRead

class CustomMealItemBase(BaseModel):
    food_id: int
    quantity_display: float
    quantity_unit: str

class CustomMealItemCreate(CustomMealItemBase):
    pass

class CustomMealItemRead(CustomMealItemBase):
    id: int
    meal_id: int
    quantity_g: float
    food: FoodRead

    class Config:
        from_attributes = True

class CustomMealBase(BaseModel):
    name: str
    description: Optional[str] = None
    image_emoji: Optional[str] = None

class CustomMealCreate(CustomMealBase):
    items: List[CustomMealItemCreate]

class CustomMealRead(CustomMealBase):
    id: int
    created_at: datetime
    items: List[CustomMealItemRead]

    class Config:
        from_attributes = True
