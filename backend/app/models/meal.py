from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class CustomMeal(Base):
    __tablename__ = "custom_meals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    image_emoji = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    items = relationship("CustomMealItem", back_populates="meal", cascade="all, delete")

class CustomMealItem(Base):
    __tablename__ = "custom_meal_items"
    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("custom_meals.id"))
    food_id = Column(Integer, ForeignKey("foods.id"))
    quantity_g = Column(Float, nullable=False)
    quantity_display = Column(Float, nullable=False)
    quantity_unit = Column(String, nullable=False)
    
    meal = relationship("CustomMeal", back_populates="items")
    food = relationship("Food")
