"""
Script to add 'Egg White (Boiled)' and 'Boiled Egg White' to the food database and seed file.
"""
import os
import sys
import json
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.food import Food
from app.models.user import User

foods_to_add = [
    {
        "name": "Egg White (Boiled)",
        "name_local": "ఉడకబెట్టిన గుడ్డు తెల్లసొన",
        "category": "Non-vegetarian",
        "source": "local",
        "source_id": None,
        "serving_size_g": 33.0,
        "serving_unit": "piece",
        "serving_unit_weight_g": 33.0,
        "calories": 52.0,
        "protein": 10.9,
        "carbohydrates": 0.7,
        "fat": 0.17,
        "fiber": 0.0,
        "sugar": 0.7,
        "sodium": 166.0,
        "potassium": 163.0,
        "iron": 0.08,
        "calcium": 7.0,
        "vitamin_c": 0.0,
        "vitamin_d": 0.0,
        "vitamin_b12": 0.09,
        "magnesium": 11.0,
        "zinc": 0.03,
        "saturated_fat": 0.0,
        "trans_fat": 0.0,
        "cholesterol": 0.0,
        "is_custom": False,
    },
    {
        "name": "Boiled Egg White",
        "name_local": "ఉడకబెట్టిన కోడిగుడ్డు తెల్లసొన",
        "category": "Non-vegetarian",
        "source": "local",
        "source_id": None,
        "serving_size_g": 33.0,
        "serving_unit": "piece",
        "serving_unit_weight_g": 33.0,
        "calories": 52.0,
        "protein": 10.9,
        "carbohydrates": 0.7,
        "fat": 0.17,
        "fiber": 0.0,
        "sugar": 0.7,
        "sodium": 166.0,
        "potassium": 163.0,
        "iron": 0.08,
        "calcium": 7.0,
        "vitamin_c": 0.0,
        "vitamin_d": 0.0,
        "vitamin_b12": 0.09,
        "magnesium": 11.0,
        "zinc": 0.03,
        "saturated_fat": 0.0,
        "trans_fat": 0.0,
        "cholesterol": 0.0,
        "is_custom": False,
    }
]

def add_to_db():
    db = SessionLocal()
    try:
        added = 0
        for item in foods_to_add:
            existing = db.query(Food).filter(Food.name.ilike(item["name"])).first()
            if not existing:
                f = Food(**item)
                db.add(f)
                added += 1
                print(f"Added to DB: {item['name']}")
            else:
                print(f"Already in DB: {item['name']} (ID {existing.id})")
        db.commit()
        print(f"Successfully committed {added} new food(s) to DB.")
    finally:
        db.close()

def add_to_seed_json():
    json_path = os.path.join(os.path.dirname(__file__), "seeds", "south_indian_foods.json")
    if not os.path.exists(json_path):
        print(f"Seed file not found: {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    existing_names = {x["name"].lower() for x in data}
    added = 0
    for item in foods_to_add:
        if item["name"].lower() not in existing_names:
            seed_item = {
                "name": item["name"],
                "name_local": item["name_local"],
                "category": item["category"],
                "source": "local",
                "serving_size_g": item["serving_size_g"],
                "serving_unit": item["serving_unit"],
                "serving_unit_weight_g": item["serving_unit_weight_g"],
                "calories": item["calories"],
                "protein": item["protein"],
                "carbohydrates": item["carbohydrates"],
                "fat": item["fat"],
                "fiber": item["fiber"],
                "sugar": item["sugar"],
                "sodium": item["sodium"],
                "potassium": item["potassium"],
                "iron": item["iron"],
                "calcium": item["calcium"],
                "vitamin_c": item["vitamin_c"],
                "vitamin_d": item["vitamin_d"],
                "vitamin_b12": item["vitamin_b12"],
                "magnesium": item["magnesium"],
                "zinc": item["zinc"],
                "saturated_fat": item["saturated_fat"],
                "cholesterol": item["cholesterol"]
            }
            data.append(seed_item)
            added += 1
            print(f"Added to seed JSON: {item['name']}")

    if added > 0:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"Saved {added} item(s) to {json_path}")

def clear_cache():
    try:
        import redis
        r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://redis:6379"))
        keys = r.keys("food:*")
        if keys:
            r.delete(*keys)
            print(f"Cleared {len(keys)} Redis food keys.")
    except Exception as e:
        print(f"Redis clear skipped: {e}")

if __name__ == "__main__":
    add_to_db()
    add_to_seed_json()
    clear_cache()
    print("DONE.")
