from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime
from ..database import Base

class Food(Base):
    __tablename__ = "foods"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    name_local = Column(String, nullable=True)
    category = Column(String, nullable=False)
    source = Column(String, nullable=False)
    source_id = Column(String, nullable=True)
    serving_size_g = Column(Float, nullable=False)
    serving_unit = Column(String, nullable=False)
    serving_unit_weight_g = Column(Float, nullable=False)
    
    calories = Column(Float, default=0.0, nullable=False)
    protein = Column(Float, default=0.0, nullable=False)
    carbohydrates = Column(Float, default=0.0, nullable=False)
    fat = Column(Float, default=0.0, nullable=False)
    fiber = Column(Float, default=0.0, nullable=False)
    sugar = Column(Float, default=0.0, nullable=False)
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
    trans_fat = Column(Float, default=0.0, nullable=False)
    cholesterol = Column(Float, default=0.0, nullable=False)
    
    is_custom = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
