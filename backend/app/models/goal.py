from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from datetime import datetime
from ..database import Base

class NutritionGoal(Base):
    __tablename__ = "nutrition_goals"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, unique=True, index=True)
    calories = Column(Float, default=2000)
    protein = Column(Float, default=50)
    carbohydrates = Column(Float, default=250)
    fat = Column(Float, default=65)
    fiber = Column(Float, default=30)
    sodium = Column(Float, default=2300)
    potassium = Column(Float, default=3500)
    iron = Column(Float, default=18)
    calcium = Column(Float, default=1000)
    vitamin_c = Column(Float, default=90)
    vitamin_d = Column(Float, default=20)
    vitamin_b12 = Column(Float, default=2.4)
    magnesium = Column(Float, default=420)
    zinc = Column(Float, default=11)
    saturated_fat = Column(Float, default=20)
    cholesterol = Column(Float, default=300)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
