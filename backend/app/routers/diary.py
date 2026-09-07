from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date

from ..database import get_db
from ..models.diary import DiaryEntry
from ..models.food import Food
from ..models.user import User
from ..schemas.diary import DiaryEntryCreate, DiaryEntryRead
from ..services.calculations import calculate_nutrients
from ..services.security import get_current_user

router = APIRouter(prefix="/api/diary", tags=["Diary"])

NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "cholesterol",
]


def resolve_quantity_in_grams(food: Food, quantity_display: float, quantity_unit: str) -> float:
    """
    Converts any unit (g, ml, piece, glass, cup, tbsp, tsp) into standard grams
    for nutrient scaling (nutrients are per 100g / 100ml).
    """
    unit = (quantity_unit or "g").lower().strip()
    qty = float(quantity_display or 0)

    if unit in ("g", "ml"):
        return qty
    elif unit in ("scoop", "scoops"):
        weight = food.serving_unit_weight_g if food.serving_unit_weight_g else 33.0
        return weight * qty
    elif unit in ("piece", "item") and food.serving_unit_weight_g:
        return food.serving_unit_weight_g * qty
    elif unit == "glass":
        # 1 standard glass = 200ml / 200g
        weight = food.serving_unit_weight_g if food.serving_unit == "glass" else 200.0
        return weight * qty
    elif unit == "cup":
        # 1 standard cup = 240ml / 240g
        weight = food.serving_unit_weight_g if food.serving_unit == "cup" else 240.0
        return weight * qty
    elif unit in ("tbsp", "tablespoon"):
        return 15.0 * qty
    elif unit in ("tsp", "teaspoon"):
        return 5.0 * qty
    elif food.serving_unit and unit == food.serving_unit.lower() and food.serving_unit_weight_g:
        return food.serving_unit_weight_g * qty
    else:
        return qty


def _entry_to_dict(e: DiaryEntry) -> dict:
    return {
        "id": e.id,
        "date": str(e.date),
        "meal_type": e.meal_type,
        "food_id": e.food_id,
        "food": {
            "id": e.food.id if e.food else None,
            "name": e.food.name if e.food else "Unknown",
            "category": e.food.category if e.food else "",
            "serving_unit": e.food.serving_unit if e.food else "g",
            "serving_unit_weight_g": e.food.serving_unit_weight_g if e.food else 100,
        } if e.food else None,
        "quantity_g": e.quantity_g,
        "quantity_display": e.quantity_display,
        "quantity_unit": e.quantity_unit,
        **{k: round(getattr(e, k, 0) or 0, 2) for k in NUTRIENT_KEYS},
        "created_at": str(e.created_at),
    }


@router.get("/{date_str}")
def get_diary(
    date_str: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entries = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.date == date_str
    ).all()
    by_meal = {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
    totals = {k: 0.0 for k in NUTRIENT_KEYS}

    for e in entries:
        mt = e.meal_type if e.meal_type in by_meal else "snack"
        by_meal[mt].append(_entry_to_dict(e))
        for k in NUTRIENT_KEYS:
            totals[k] += getattr(e, k, 0) or 0

    totals = {k: round(v, 2) for k, v in totals.items()}
    return {"date": str(date_str), "entries": by_meal, "totals": totals}


@router.post("/entries")
def add_entry(
    entry: DiaryEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    food = db.query(Food).filter(Food.id == entry.food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    qty_g = resolve_quantity_in_grams(food, entry.quantity_display, entry.quantity_unit)
    nuts = calculate_nutrients(food, qty_g)

    new_entry = DiaryEntry(
        user_id=current_user.id,
        date=entry.date,
        meal_type=entry.meal_type,
        food_id=food.id,
        quantity_g=qty_g,
        quantity_display=entry.quantity_display,
        quantity_unit=entry.quantity_unit,
        **nuts,
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return _entry_to_dict(new_entry)


@router.put("/entries/{entry_id}")
def update_entry(
    entry_id: int,
    quantity_display: float,
    quantity_unit: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    e = db.query(DiaryEntry).filter(
        DiaryEntry.id == entry_id,
        DiaryEntry.user_id == current_user.id
    ).first()
    if not e:
        raise HTTPException(status_code=404, detail="Entry not found")

    food = db.query(Food).filter(Food.id == e.food_id).first()
    if not food:
        raise HTTPException(status_code=404, detail="Food not found")

    qty_g = resolve_quantity_in_grams(food, quantity_display, quantity_unit)
    nuts = calculate_nutrients(food, qty_g)

    e.quantity_display = quantity_display
    e.quantity_unit = quantity_unit
    e.quantity_g = qty_g
    for k, v in nuts.items():
        setattr(e, k, v)

    db.commit()
    db.refresh(e)
    return _entry_to_dict(e)


@router.delete("/entries/{entry_id}")
def delete_entry(
    entry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    e = db.query(DiaryEntry).filter(
        DiaryEntry.id == entry_id,
        DiaryEntry.user_id == current_user.id
    ).first()
    if e:
        db.delete(e)
        db.commit()
    return {"ok": True}
