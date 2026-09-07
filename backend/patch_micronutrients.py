"""
Script to patch accurate ICMR-NIN and USDA micronutrients (especially Vitamin B12, Vitamin D,
Zinc, Magnesium, and Iron) across all foods in PostgreSQL and in south_indian_foods.json,
and recalculate existing diary entries.
"""
import os
import sys
import json

# Add current directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import Base, SessionLocal, engine
from app.models.food import Food
from app.models.diary import DiaryEntry
from app.services.calculations import calculate_nutrients

NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "cholesterol",
]

def get_nutrient_enrichments(food_name: str, category: str):
    """
    Returns a dict of micronutrient overrides based on ICMR-NIN & USDA nutritional standards.
    """
    name_l = food_name.lower()
    cat_l = (category or "").lower()
    updates = {}

    # ─────────────────────────────────────────────────────────────
    # 1. Chicken & Poultry
    # ─────────────────────────────────────────────────────────────
    if "chicken liver" in name_l:
        updates = {"vitamin_b12": 16.5, "vitamin_d": 1.3, "iron": 9.0, "zinc": 2.7, "magnesium": 20.0, "calcium": 18.0}
    elif "chicken gizzard" in name_l or "chicken heart" in name_l:
        updates = {"vitamin_b12": 4.5, "vitamin_d": 0.2, "iron": 4.0, "zinc": 3.0, "magnesium": 18.0}
    elif "chicken breast" in name_l or "chicken boneless" in name_l:
        b12 = 0.45 if ("cooked" in name_l or "grilled" in name_l) else 0.35
        updates = {"vitamin_b12": b12, "vitamin_d": 0.1, "zinc": 1.2, "magnesium": 28.0, "iron": 1.0, "calcium": 12.0}
    elif "chicken thigh" in name_l:
        updates = {"vitamin_b12": 0.50, "vitamin_d": 0.15, "zinc": 1.8, "magnesium": 24.0, "iron": 1.2, "calcium": 12.0}
    elif "chicken drumstick" in name_l or "chicken leg" in name_l:
        updates = {"vitamin_b12": 0.45, "vitamin_d": 0.12, "zinc": 1.7, "magnesium": 23.0, "iron": 1.2, "calcium": 12.0}
    elif "chicken wings" in name_l:
        updates = {"vitamin_b12": 0.40, "vitamin_d": 0.15, "zinc": 1.4, "magnesium": 20.0, "iron": 1.1, "calcium": 14.0}
    elif "chicken keema" in name_l:
        updates = {"vitamin_b12": 0.40, "vitamin_d": 0.10, "zinc": 1.5, "magnesium": 25.0, "iron": 1.2, "calcium": 12.0}
    elif "chicken" in name_l:
        # General chicken dishes / cuts
        updates = {"vitamin_b12": 0.35, "vitamin_d": 0.10, "zinc": 1.3, "magnesium": 24.0, "iron": 1.1, "calcium": 14.0}

    # ─────────────────────────────────────────────────────────────
    # 2. Eggs
    # ─────────────────────────────────────────────────────────────
    elif "boiled egg" in name_l or "egg (boiled" in name_l:
        updates = {"vitamin_b12": 1.1, "vitamin_d": 2.0, "zinc": 1.3, "iron": 1.8, "magnesium": 12.0, "calcium": 50.0}
    elif "egg" in name_l and ("omelette" in name_l or "bhurji" in name_l or "scramble" in name_l or "curry" in name_l or "pulusu" in name_l):
        updates = {"vitamin_b12": 0.9, "vitamin_d": 1.6, "zinc": 1.2, "iron": 1.6, "magnesium": 14.0, "calcium": 52.0}
    elif name_l.strip() == "egg" or "raw egg" in name_l:
        updates = {"vitamin_b12": 1.1, "vitamin_d": 2.0, "zinc": 1.3, "iron": 1.8, "magnesium": 12.0, "calcium": 50.0}

    # ─────────────────────────────────────────────────────────────
    # 3. Mutton & Goat
    # ─────────────────────────────────────────────────────────────
    elif "mutton liver" in name_l or "goat liver" in name_l:
        updates = {"vitamin_b12": 70.0, "vitamin_d": 0.5, "iron": 14.0, "zinc": 5.8, "magnesium": 24.0, "calcium": 15.0}
    elif "mutton" in name_l or "goat" in name_l or "bheja" in name_l or "kidney" in name_l:
        updates = {"vitamin_b12": 2.6, "vitamin_d": 0.2, "iron": 3.0, "zinc": 3.8, "magnesium": 22.0, "calcium": 16.0}

    # ─────────────────────────────────────────────────────────────
    # 4. Fish & Seafood
    # ─────────────────────────────────────────────────────────────
    elif "salmon" in name_l:
        updates = {"vitamin_b12": 3.2, "vitamin_d": 11.0, "iron": 0.8, "zinc": 0.7, "magnesium": 29.0, "calcium": 15.0}
    elif "sardine" in name_l:
        updates = {"vitamin_b12": 8.9, "vitamin_d": 4.8, "iron": 2.9, "zinc": 1.4, "magnesium": 39.0, "calcium": 382.0}
    elif "tuna" in name_l:
        updates = {"vitamin_b12": 2.2, "vitamin_d": 2.1, "iron": 1.5, "zinc": 0.9, "magnesium": 35.0, "calcium": 16.0}
    elif "prawn" in name_l or "shrimp" in name_l or "royyala" in name_l:
        updates = {"vitamin_b12": 1.2, "vitamin_d": 0.1, "iron": 1.6, "zinc": 1.4, "magnesium": 35.0, "calcium": 70.0}
    elif "fish" in name_l or "rohu" in name_l or "katla" in name_l or "tilapia" in name_l or "basa" in name_l or "murrel" in name_l or "korameenu" in name_l or cat_l == "fish & seafood":
        updates = {"vitamin_b12": 1.8, "vitamin_d": 3.5, "iron": 1.2, "zinc": 1.1, "magnesium": 30.0, "calcium": 25.0}

    # ─────────────────────────────────────────────────────────────
    # 5. Dairy & Milk Products
    # ─────────────────────────────────────────────────────────────
    elif "paneer" in name_l:
        updates = {"vitamin_b12": 0.9, "vitamin_d": 0.2, "calcium": 480.0, "zinc": 2.5, "magnesium": 25.0}
    elif "curd" in name_l or "yogurt" in name_l or "perugu" in name_l:
        updates = {"vitamin_b12": 0.5, "vitamin_d": 0.1, "calcium": 150.0, "zinc": 0.6, "magnesium": 12.0}
    elif "buttermilk" in name_l or "majjiga" in name_l:
        updates = {"vitamin_b12": 0.25, "vitamin_d": 0.05, "calcium": 80.0, "zinc": 0.3, "magnesium": 8.0}
    elif "milk" in name_l or "palu" in name_l:
        updates = {"vitamin_b12": 0.45, "vitamin_d": 0.1, "calcium": 120.0, "zinc": 0.4, "magnesium": 10.0}
    elif "cheese" in name_l:
        updates = {"vitamin_b12": 1.6, "vitamin_d": 0.3, "calcium": 600.0, "zinc": 3.0, "magnesium": 28.0}
    elif "whey" in name_l:
        updates = {"vitamin_b12": 0.8, "calcium": 140.0, "magnesium": 20.0, "zinc": 0.8}

    # ─────────────────────────────────────────────────────────────
    # 6. Dals & Legumes (High in Zinc & Magnesium)
    # ─────────────────────────────────────────────────────────────
    elif "dal" in name_l or "pappu" in name_l or "chana" in name_l or "rajma" in name_l or "moong" in name_l or "urad" in name_l or "toor" in name_l:
        updates = {"zinc": 2.6, "magnesium": 95.0}

    # ─────────────────────────────────────────────────────────────
    # 7. Seeds & Nuts (Rich in Zinc & Magnesium)
    # ─────────────────────────────────────────────────────────────
    elif "seed" in name_l or "nut" in name_l or "almond" in name_l or "peanut" in name_l or "cashew" in name_l or "walnut" in name_l:
        updates = {"zinc": 4.5, "magnesium": 240.0}

    return updates


def patch_database():
    db = SessionLocal()
    try:
        foods = db.query(Food).all()
        print(f"Loaded {len(foods)} foods from database.")
        
        updated_count = 0
        for f in foods:
            enrichments = get_nutrient_enrichments(f.name, f.category)
            if enrichments:
                for k, v in enrichments.items():
                    curr = getattr(f, k, 0.0) or 0.0
                    # If current is 0 or significantly under-reported, update it
                    if curr == 0.0 or (k == "vitamin_b12" and curr < v):
                        setattr(f, k, v)
                updated_count += 1
        
        db.commit()
        print(f"Successfully enriched micronutrients for {updated_count} foods in database.")

        # Recalculate existing diary entries
        entries = db.query(DiaryEntry).all()
        print(f"Recalculating nutrients for {len(entries)} diary entries...")
        for e in entries:
            if not e.food:
                continue
            grams = e.quantity_g or 100.0
            calc = calculate_nutrients(e.food, grams)
            for k in NUTRIENT_KEYS:
                if k in calc:
                    setattr(e, k, calc[k])
        
        db.commit()
        print(f"Successfully recalculated all {len(entries)} diary entries!")

    finally:
        db.close()


def patch_seed_json():
    json_path = os.path.join(os.path.dirname(__file__), "seeds", "south_indian_foods.json")
    if not os.path.exists(json_path):
        print(f"Seed file {json_path} not found.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        foods = json.load(f)

    updated_count = 0
    for item in foods:
        enrichments = get_nutrient_enrichments(item.get("name", ""), item.get("category", ""))
        if enrichments:
            for k, v in enrichments.items():
                if item.get(k, 0.0) == 0.0 or (k == "vitamin_b12" and item.get(k, 0.0) < v):
                    item[k] = v
            updated_count += 1

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(foods, f, indent=2, ensure_ascii=False)

    print(f"Successfully updated {updated_count} items in {json_path}.")


if __name__ == "__main__":
    patch_database()
    patch_seed_json()
    print("ALL MICRONUTRIENT PATCHES COMPLETE.")
