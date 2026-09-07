from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import foods, diary, meals, goals, reports, auth, admin
from .database import engine, Base, SessionLocal
from .models.food import Food
from .models.user import User
from .services.security import hash_password
import json
import os
import logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Calori — Personal Nutrition Tracker", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(foods.router)
app.include_router(diary.router)
app.include_router(meals.router)
app.include_router(goals.router)
app.include_router(reports.router)


NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "trans_fat", "cholesterol",
]


def seed_south_indian_foods(db):
    """Seed missing foods from south_indian_foods.json into the database."""
    seeds_path = os.path.join(os.path.dirname(__file__), "..", "seeds", "south_indian_foods.json")
    if not os.path.exists(seeds_path):
        logger.warning("Seed file not found: %s", seeds_path)
        return

    with open(seeds_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    inserted = 0
    for item in data:
        # Check if food already exists by name
        if db.query(Food).filter(Food.name == item["name"]).first():
            continue

        serving_g = item.get("serving_size_g", 100) or 100
        factor = 100.0 / serving_g  # convert per-serving → per-100g

        food_data = {
            "name": item["name"],
            "name_local": item.get("name_local", ""),
            "category": item.get("category", "General"),
            "source": item.get("source", "local"),
            "source_id": item.get("source_id"),
            "serving_size_g": serving_g,
            "serving_unit": item.get("serving_unit", "g"),
            "serving_unit_weight_g": item.get("serving_unit_weight_g", 100),
            "is_custom": False,
        }

        for key in NUTRIENT_KEYS:
            raw = item.get(key, 0) or 0
            food_data[key] = round(raw * factor, 3)

        db.add(Food(**food_data))
        inserted += 1

    if inserted > 0:
        db.commit()
        logger.info("✅ Seeded %d new foods into the database.", inserted)


def seed_default_custom_meals(db):
    """Seed default custom meal combos like Mixed Seeds (Melon, Pumpkin, Sunflower, Flax)."""
    from .models.meal import CustomMeal, CustomMealItem

    combo_name = "Mixed Seeds Combo (Melon, Pumpkin, Sunflower, Flax)"
    if db.query(CustomMeal).filter(CustomMeal.name == combo_name).first():
        return

    # Find the 4 local seed food items
    melon = db.query(Food).filter(Food.source == "local", Food.name.ilike("%Melon Seeds%")).first()
    pumpkin = db.query(Food).filter(Food.source == "local", Food.name.ilike("%Pumpkin Seeds%")).first()
    sunflower = db.query(Food).filter(Food.source == "local", Food.name.ilike("%Sunflower Seeds%")).first()
    flax = db.query(Food).filter(Food.source == "local", Food.name.ilike("%Flax Seeds%")).first()

    if melon and pumpkin and sunflower and flax:
        m = CustomMeal(
            name=combo_name,
            description="5g Melon + 5g Pumpkin + 5g Sunflower + 5g Flax seeds (20g total)",
            image_emoji="🌱"
        )
        db.add(m)
        db.flush()

        for f in [melon, pumpkin, sunflower, flax]:
            db.add(CustomMealItem(
                meal_id=m.id,
                food_id=f.id,
                quantity_g=5.0,
                quantity_display=5.0,
                quantity_unit="g"
            ))
        db.commit()
        logger.info("✅ Seeded default Custom Meal: %s", combo_name)


def create_default_goals(db):
    """Create default nutrition goals if none exist."""
    from .models.goal import NutritionGoal
    if db.query(NutritionGoal).count() == 0:
        db.add(NutritionGoal())
        db.commit()
        logger.info("✅ Created default nutrition goals.")


def seed_admin_user(db):
    """Ensure Super Admin Nithin-Kiran exists."""
    admin = db.query(User).filter(User.username == "Nithin-Kiran").first()
    if not admin:
        admin = User(
            username="Nithin-Kiran",
            email="nithin@calori.app",
            full_name="Nithin Kiran",
            hashed_password=hash_password("Nithin@987"),
            role="admin",
            is_active=True,
            must_change_password=False,
            calorie_target=2000.0,
        )
        db.add(admin)
        db.commit()
        logger.info("✅ Seeded super admin account: Nithin-Kiran")


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_admin_user(db)
        seed_south_indian_foods(db)
        seed_default_custom_meals(db)
        create_default_goals(db)
    except Exception as e:
        logger.error("Startup seeding failed: %s", e)
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "Calori Nutrition Tracker"}
