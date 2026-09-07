from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date as date_type

from ..database import get_db
from ..models.meal import CustomMeal, CustomMealItem
from ..models.diary import DiaryEntry
from ..models.food import Food
from ..models.user import User
from ..schemas.meal import CustomMealCreate, CustomMealRead
from ..services.calculations import calculate_nutrients
from ..services.security import get_current_user

from .diary import resolve_quantity_in_grams

router = APIRouter(prefix="/api/meals", tags=["Meals"])


def _meal_nutrition_summary(meal: CustomMeal, db: Session) -> dict:
    """Calculate total nutrition for a custom meal."""
    totals = {"calories": 0.0, "protein": 0.0, "carbohydrates": 0.0, "fat": 0.0, "fiber": 0.0}
    for item in meal.items:
        food = db.query(Food).filter(Food.id == item.food_id).first()
        if not food:
            continue
        qty_g = item.quantity_g
        nuts = calculate_nutrients(food, qty_g)
        for k in totals:
            totals[k] += nuts.get(k, 0)
    return totals


@router.get("/")
def list_meals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meals = db.query(CustomMeal).filter(
        (CustomMeal.user_id == current_user.id) | (CustomMeal.user_id.is_(None))
    ).all()
    result = []
    for m in meals:
        nutrition = _meal_nutrition_summary(m, db)
        items_preview = []
        for item in m.items:
            food = db.query(Food).filter(Food.id == item.food_id).first()
            nuts = calculate_nutrients(food, item.quantity_g) if food else {}
            items_preview.append({
                "id": item.id,
                "food_id": item.food_id,
                "food_name": food.name if food else "Unknown",
                "quantity_display": item.quantity_display,
                "quantity_unit": item.quantity_unit,
                "quantity_g": item.quantity_g,
                "calories": round(nuts.get("calories", 0)),
                "protein": round(nuts.get("protein", 0), 1),
                "carbohydrates": round(nuts.get("carbohydrates", 0), 1),
                "fat": round(nuts.get("fat", 0), 1),
                "base_cal": food.calories if food else 0,
                "base_pro": food.protein if food else 0,
                "base_carb": food.carbohydrates if food else 0,
                "base_fat": food.fat if food else 0,
                "serving_unit_weight_g": food.serving_unit_weight_g if food else 100,
            })
        result.append({
            "id": m.id,
            "name": m.name,
            "description": m.description,
            "image_emoji": m.image_emoji,
            "created_at": str(m.created_at),
            "items": items_preview,
            "nutrition": nutrition,
        })
    return result


@router.post("/")
def create_meal(
    meal: CustomMealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m = CustomMeal(
        user_id=current_user.id,
        name=meal.name,
        description=meal.description or "",
        image_emoji=meal.image_emoji or "🍽️",
    )
    db.add(m)
    db.flush()

    for item in meal.items:
        food = db.query(Food).filter(Food.id == item.food_id).first()
        if not food:
            continue
        q_g = resolve_quantity_in_grams(food, item.quantity_display, item.quantity_unit)

        ci = CustomMealItem(
            meal_id=m.id,
            food_id=food.id,
            quantity_g=q_g,
            quantity_display=item.quantity_display,
            quantity_unit=item.quantity_unit,
        )
        db.add(ci)

    db.commit()
    db.refresh(m)

    nutrition = _meal_nutrition_summary(m, db)
    return {
        "id": m.id,
        "name": m.name,
        "description": m.description,
        "image_emoji": m.image_emoji,
        "created_at": str(m.created_at),
        "items": [
            {
                "id": item.id,
                "food_id": item.food_id,
                "food_name": db.query(Food).filter(Food.id == item.food_id).first().name
                    if db.query(Food).filter(Food.id == item.food_id).first() else "Unknown",
                "quantity_display": item.quantity_display,
                "quantity_unit": item.quantity_unit,
                "quantity_g": item.quantity_g,
            }
            for item in m.items
        ],
        "nutrition": nutrition,
    }


@router.get("/{meal_id}")
def get_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m = db.query(CustomMeal).filter(
        CustomMeal.id == meal_id,
        (CustomMeal.user_id == current_user.id) | (CustomMeal.user_id.is_(None))
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meal not found")
    nutrition = _meal_nutrition_summary(m, db)
    items = []
    for item in m.items:
        food = db.query(Food).filter(Food.id == item.food_id).first()
        nuts = calculate_nutrients(food, item.quantity_g) if food else {}
        items.append({
            "id": item.id,
            "food_id": item.food_id,
            "food_name": food.name if food else "Unknown",
            "quantity_display": item.quantity_display,
            "quantity_unit": item.quantity_unit,
            "quantity_g": item.quantity_g,
            "calories": round(nuts.get("calories", 0)),
            "protein": round(nuts.get("protein", 0), 1),
            "carbohydrates": round(nuts.get("carbohydrates", 0), 1),
            "fat": round(nuts.get("fat", 0), 1),
            "base_cal": food.calories if food else 0,
            "base_pro": food.protein if food else 0,
            "base_carb": food.carbohydrates if food else 0,
            "base_fat": food.fat if food else 0,
            "serving_unit_weight_g": food.serving_unit_weight_g if food else 100,
        })
    return {
        "id": m.id,
        "name": m.name,
        "description": m.description,
        "image_emoji": m.image_emoji,
        "created_at": str(m.created_at),
        "items": items,
        "nutrition": nutrition,
    }


@router.put("/{meal_id}")
def update_meal(
    meal_id: int,
    meal: CustomMealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing custom meal and its ingredients."""
    m = db.query(CustomMeal).filter(
        CustomMeal.id == meal_id,
        CustomMeal.user_id == current_user.id
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meal not found")

    m.name = meal.name.strip()
    m.description = (meal.description or "").strip()
    if meal.image_emoji:
        m.image_emoji = meal.image_emoji

    # Delete existing items and re-insert updated items
    db.query(CustomMealItem).filter(CustomMealItem.meal_id == meal_id).delete()

    for item in meal.items:
        food = db.query(Food).filter(Food.id == item.food_id).first()
        if not food:
            continue
        q_g = resolve_quantity_in_grams(food, item.quantity_display, item.quantity_unit)

        ci = CustomMealItem(
            meal_id=m.id,
            food_id=food.id,
            quantity_g=q_g,
            quantity_display=item.quantity_display,
            quantity_unit=item.quantity_unit,
        )
        db.add(ci)

    db.commit()
    db.refresh(m)

    nutrition = _meal_nutrition_summary(m, db)
    items_preview = []
    for item in m.items:
        food = db.query(Food).filter(Food.id == item.food_id).first()
        nuts = calculate_nutrients(food, item.quantity_g) if food else {}
        items_preview.append({
            "id": item.id,
            "food_id": item.food_id,
            "food_name": food.name if food else "Unknown",
            "quantity_display": item.quantity_display,
            "quantity_unit": item.quantity_unit,
            "quantity_g": item.quantity_g,
            "calories": round(nuts.get("calories", 0)),
            "protein": round(nuts.get("protein", 0), 1),
            "carbohydrates": round(nuts.get("carbohydrates", 0), 1),
            "fat": round(nuts.get("fat", 0), 1),
            "base_cal": food.calories if food else 0,
            "base_pro": food.protein if food else 0,
            "base_carb": food.carbohydrates if food else 0,
            "base_fat": food.fat if food else 0,
            "serving_unit_weight_g": food.serving_unit_weight_g if food else 100,
        })

    return {
        "id": m.id,
        "name": m.name,
        "description": m.description,
        "image_emoji": m.image_emoji,
        "created_at": str(m.created_at),
        "items": items_preview,
        "nutrition": nutrition,
    }


@router.delete("/{meal_id}")
def delete_meal(
    meal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    m = db.query(CustomMeal).filter(
        CustomMeal.id == meal_id,
        CustomMeal.user_id == current_user.id
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.query(CustomMealItem).filter(CustomMealItem.meal_id == meal_id).delete()
    db.delete(m)
    db.commit()
    return {"ok": True}


@router.post("/{meal_id}/log")
def log_meal(
    meal_id: int,
    date: date_type,
    meal_type: str = "lunch",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log all items of a custom meal to the diary for a given date and meal type."""
    m = db.query(CustomMeal).filter(
        CustomMeal.id == meal_id,
        (CustomMeal.user_id == current_user.id) | (CustomMeal.user_id.is_(None))
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meal not found")

    added_entries = []
    for item in m.items:
        food = db.query(Food).filter(Food.id == item.food_id).first()
        if not food:
            continue

        qty_g = item.quantity_g
        nuts = calculate_nutrients(food, qty_g)

        entry = DiaryEntry(
            user_id=current_user.id,
            date=date,
            meal_type=meal_type,
            food_id=food.id,
            quantity_g=qty_g,
            quantity_display=item.quantity_display,
            quantity_unit=item.quantity_unit,
            **nuts,
        )
        db.add(entry)
        added_entries.append(entry)

    db.commit()
    return {
        "ok": True,
        "logged_items": len(added_entries),
        "meal": m.name,
        "date": str(date),
        "meal_type": meal_type,
    }
