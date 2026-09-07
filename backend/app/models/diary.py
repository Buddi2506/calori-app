from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class DiaryEntry(Base):
    __tablename__ = "diary_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    date = Column(Date, index=True, nullable=False)
    meal_type = Column(String, nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), index=True, nullable=False)
    quantity_g = Column(Float, nullable=False)
    quantity_display = Column(Float, nullable=False)
    quantity_unit = Column(String, nullable=False)
    
    calories = Column(Float, default=0.0, nullable=False)
    protein = Column(Float, default=0.0, nullable=False)
    carbohydrates = Column(Float, default=0.0, nullable=False)
    fat = Column(Float, default=0.0, nullable=False)
    fiber = Column(Float, default=0.0, nullable=False)
    sodium = Column(Float, default=0.0, nullable=False)
    potassium = Column(Float, default=0.0, nullable=False)
    iron = Column(Float, default=0.0, nullable=False)
    calcium = Column(Float, default=0.0, nullable=False)
    vitamin_c = Column(Float, default=0.0, nullable=False)
    vitamin_d = Column(Float, default=0.0, nullable=False)
    vitamin_b12 = Column(Float, default=0.0, nullable=False)
    magnesium = Column(Float, default=0.0, nullable=False)
    zinc = Column(Float, default=0.0, nullable=False)
    saturated_fat = Column(Float, default=0.0, nullable=False)
    cholesterol = Column(Float, default=0.0, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    food = relationship("Food")
