"""
Seed script for South Indian foods.
The JSON stores nutrients per serving size.
This script converts to per-100g values before inserting.
"""
import json
import os
import sys

# Allow running from project root: python seed.py
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app.models.food import Food

NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "trans_fat", "cholesterol",
]

def seed_data():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    
    seeds_path = os.path.join(os.path.dirname(__file__), "seeds", "south_indian_foods.json")
    with open(seeds_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    inserted = 0
    skipped = 0
    for item in data:
        if db.query(Food).filter(Food.name == item["name"]).first():
            skipped += 1
            continue
        
        # The JSON stores per-serving values. serving_size_g tells us how many grams per serving.
        # We need per-100g values for the DB, since calculate_nutrients does (value * g / 100).
        serving_g = item.get("serving_size_g", 100)
        if serving_g <= 0:
            serving_g = 100
        
        # Convert: per_100g = (per_serving / serving_g) * 100
        factor = 100.0 / serving_g
        
        food_data = {
            "name": item["name"],
            "name_local": item.get("name_local", ""),
            "category": item.get("category", "General"),
            "source": item.get("source", "local"),
            "source_id": item.get("source_id"),
            "serving_size_g": item.get("serving_size_g", 100),
            "serving_unit": item.get("serving_unit", "g"),
            "serving_unit_weight_g": item.get("serving_unit_weight_g", 100),
            "is_custom": False,
        }
        
        # Apply per-100g conversion for all nutrient fields
        for key in NUTRIENT_KEYS:
            raw = item.get(key, 0) or 0
            food_data[key] = round(raw * factor, 3)
        
        fd = Food(**food_data)
        db.add(fd)
        inserted += 1
    
    db.commit()
    db.close()
    print(f"✅ Seeded: {inserted} foods inserted, {skipped} already existed.")

if __name__ == "__main__":
    seed_data()
