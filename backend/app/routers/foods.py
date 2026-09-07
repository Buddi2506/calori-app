from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import json
import time
from ..database import get_db, SessionLocal
from ..models.food import Food
from ..schemas.food import FoodRead, FoodCreate
from ..services.nutrition_api import search_external, get_redis

router = APIRouter(prefix="/api/foods", tags=["Foods"])

_library_mem_cache: Dict[str, Any] = {}
_library_mem_cache_time: float = 0.0

NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "trans_fat", "cholesterol",
]


def _build_search_filter(q: str):
    clean_q = (q or "").strip()
    norm_q = clean_q.lower()

    # Common user alias mappings & typo normalizations
    if "flex" in norm_q:
        norm_q = norm_q.replace("flex", "flax")
    if "almonds" in norm_q:
        norm_q = norm_q.replace("almonds", "almond")
    if "brest" in norm_q:
        norm_q = norm_q.replace("brest", "breast")
    if "boan less" in norm_q or "bone less" in norm_q or "boanless" in norm_q:
        norm_q = norm_q.replace("boan less", "boneless").replace("bone less", "boneless").replace("boanless", "boneless")
    if "chick peace" in norm_q or "chick peas" in norm_q or "channa" in norm_q:
        norm_q = norm_q.replace("chick peace", "chickpeas").replace("chick peas", "chickpeas").replace("channa", "chana")
    if "vegitables" in norm_q or "vegitable" in norm_q:
        norm_q = norm_q.replace("vegitables", "vegetables").replace("vegitable", "vegetable")
    if "chilakada" in norm_q:
        norm_q = norm_q.replace("chilakada", "chilagada")
    if "tati munjalu" in norm_q or "munjalu" in norm_q:
        norm_q = norm_q.replace("tati munjalu", "taati munjalu")
    if "arikelu" in norm_q:
        norm_q = norm_q.replace("arikelu", "kodo millet")
    if "korralu" in norm_q:
        norm_q = norm_q.replace("korralu", "foxtail millet")
    if "samalu" in norm_q:
        norm_q = norm_q.replace("samalu", "little millet")
    if "udalu" in norm_q:
        norm_q = norm_q.replace("udalu", "barnyard millet")
    if "variga" in norm_q or "varigalu" in norm_q:
        norm_q = norm_q.replace("varigalu", "proso millet").replace("variga", "proso millet")
    if "kandagadda" in norm_q:
        norm_q = norm_q.replace("kandagadda", "elephant foot yam")
    if "chamadumpa" in norm_q or "arbi" in norm_q:
        norm_q = norm_q.replace("chamadumpa", "colocasia").replace("arbi", "colocasia")
    if "bobbarlu" in norm_q:
        norm_q = norm_q.replace("bobbarlu", "cowpea")
    if "gasagasalu" in norm_q:
        norm_q = norm_q.replace("gasagasalu", "poppy seeds")
    if "sabja" in norm_q:
        norm_q = norm_q.replace("sabja", "basil seeds")
    if "bangaladumpa" in norm_q:
        norm_q = norm_q.replace("bangaladumpa", "potato")

    # Check for mix seeds variations
    is_mix_seeds = any(term in norm_q for term in ["mix seed", "mixed seed", "mix of seed", "seed mix"])

    conditions = []

    # Brand aliases for protein powder searches
    if any(k in norm_q for k in ["muscle blaze", "muscleblaze", "mb whey", "mb protein"]):
        conditions.append(Food.name.ilike("%MuscleBlaze%"))
    elif norm_q == "mb":
        conditions.append(Food.name.ilike("%MuscleBlaze%"))

    if any(k in norm_q for k in ["optimum nutrition", "on whey", "on protein", "gold standard"]):
        conditions.append(Food.name.ilike("%Optimum Nutrition%"))

    if any(k in norm_q for k in ["dymatize", "iso 100", "iso100"]):
        conditions.append(Food.name.ilike("%Dymatize%"))

    if any(k in norm_q for k in ["avvatar", "avatar"]):
        conditions.append(Food.name.ilike("%Avvatar%"))

    if norm_q in ("whey", "whey protein", "protein powder", "whey powder"):
        conditions.append(Food.category == "Supplements")
        conditions.append(Food.name.ilike("%Whey%"))

    # Category aliases
    if norm_q in ("fruit", "fruits"):
        conditions.append(Food.category == "Fruits")
    elif norm_q in ("veg", "vegs", "vegetable", "vegetables", "vegitables"):
        conditions.append(Food.category == "Vegetables")
        conditions.append(Food.category == "Leafy Greens")
        conditions.append(Food.category == "Roots & Tubers")
    elif norm_q in ("greens", "leafy greens", "aaku kooralu", "aku kura"):
        conditions.append(Food.category == "Leafy Greens")
    elif norm_q in ("millet", "millets", "chirudhanyalu"):
        conditions.append(Food.name.ilike("%millet%"))
        conditions.append(Food.name.ilike("%ragi%"))
        conditions.append(Food.name.ilike("%jowar%"))
        conditions.append(Food.name.ilike("%bajra%"))
    elif norm_q in ("dal", "dals", "pulses", "pulse", "pappu"):
        conditions.append(Food.category == "Legumes & Pulses")
        conditions.append(Food.category == "Dal")
        conditions.append(Food.name.ilike("%pappu%"))
    elif norm_q in ("spice", "spices", "masala", "masalas"):
        conditions.append(Food.category == "Spices & Condiments")
    elif norm_q in ("dairy", "milk", "curd"):
        conditions.append(Food.category == "Dairy")
    elif norm_q in ("nuts", "nut", "seeds", "seed"):
        conditions.append(Food.category == "Seeds & Nuts")
    elif norm_q in ("meat", "chicken", "mutton", "poultry"):
        conditions.append(Food.category == "Meat & Poultry")
        conditions.append(Food.category == "Non-vegetarian")
    elif norm_q in ("fish", "seafood", "prawn", "prawns", "crab"):
        conditions.append(Food.category == "Fish & Seafood")
    elif norm_q in ("breakfast", "tiffin", "tiffins"):
        conditions.append(Food.category == "Breakfast")
    elif norm_q in ("sweet", "sweets", "dessert", "desserts"):
        conditions.append(Food.category == "Sweets & Desserts")
    elif norm_q in ("bread", "breads", "roti", "rotis", "naan"):
        conditions.append(Food.category == "Breads")
    elif norm_q in ("rice", "annam"):
        conditions.append(Food.category == "Rice & Grains")
        conditions.append(Food.category == "Rice dishes")
    elif norm_q in ("pachadi", "chutney", "chutneys"):
        conditions.append(Food.category == "Pachadi & Chutneys")
    elif norm_q in ("pickle", "pickles"):
        conditions.append(Food.category == "Pickles")
    elif norm_q in ("sambar", "rasam", "charu"):
        conditions.append(Food.category == "Sambar & Rasam")
    elif norm_q in ("snack", "snacks"):
        conditions.append(Food.category == "Snacks")

    # 1. Exact or partial substring match on name, local name, and category
    conditions.append(Food.name.ilike(f"%{clean_q}%"))
    conditions.append(Food.name_local.ilike(f"%{clean_q}%"))
    conditions.append(Food.category.ilike(f"%{clean_q}%"))
    if norm_q != clean_q.lower():
        conditions.append(Food.name.ilike(f"%{norm_q}%"))
        conditions.append(Food.category.ilike(f"%{norm_q}%"))

    # 2. If mix seeds query, specifically match our combined seed items
    if is_mix_seeds:
        conditions.append(Food.name.ilike("%Mix Seeds%"))
        conditions.append(Food.name.ilike("%Mixed Seeds%"))

    # 3. Token-based matching: e.g. "melon seeds", "pumpkin seeds", "almond nuts"
    tokens = [t for t in norm_q.split() if len(t) > 1 and t not in ("of", "and", "the", "in")]
    if len(tokens) > 1:
        token_match = and_(*[or_(Food.name.ilike(f"%{t}%"), Food.name_local.ilike(f"%{t}%")) for t in tokens])
        conditions.append(token_match)

    return or_(*conditions)


def _save_external_foods(query: str):
    """Background task: fetch external foods and save to DB."""
    db = SessionLocal()
    try:
        ext_foods = search_external(query)
        for food_data in ext_foods:
            sid = food_data.get("source_id")
            if sid and db.query(Food).filter(Food.source_id == sid).first():
                continue
            clean = {k: food_data[k] for k in food_data if k in [
                "name", "name_local", "category", "source", "source_id",
                "serving_size_g", "serving_unit", "serving_unit_weight_g", "is_custom",
                *NUTRIENT_KEYS,
            ]}
            db.add(Food(**clean))
        db.commit()
    except Exception as e:
        print(f"Background food save error: {e}")
    finally:
        db.close()


@router.get("/search")
def search_foods(
    q: str,
    limit: int = 20,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
):
    """
    Search foods. Returns local DB results immediately.
    Supports intelligent matching for aliases (e.g. flex seeds -> flax seeds,
    mix seeds -> Mixed Seeds blend, badam -> almonds).
    If fewer than 3 local results found, queries external APIs.
    """
    q_lower = (q or "").lower().strip()
    is_meat_search = any(w in q_lower for w in ["chicken", "mutton", "fish", "prawn", "prawns", "egg", "meat"])

    order_clauses = [(Food.source == "local").desc()]
    if is_meat_search:
        order_clauses.append(Food.name.ilike("%(raw)%").desc())
    order_clauses.append((Food.calories > 0).desc())

    search_filter = _build_search_filter(q)
    db_foods = (
        db.query(Food)
        .filter(search_filter)
        .order_by(*order_clauses)
        .limit(limit)
        .all()
    )

    if len(db_foods) == 0:
        # Try to fetch from external APIs only when no local food matches
        try:
            ext_foods = search_external(q)
            for food_data in ext_foods:
                sid = food_data.get("source_id")
                if sid and db.query(Food).filter(Food.source_id == sid).first():
                    continue
                clean = {k: food_data[k] for k in food_data if k in [
                    "name", "name_local", "category", "source", "source_id",
                    "serving_size_g", "serving_unit", "serving_unit_weight_g", "is_custom",
                    *NUTRIENT_KEYS,
                ]}
                new_food = Food(**clean)
                db.add(new_food)
            db.commit()
        except Exception as e:
            print(f"External search error: {e}")

        # Re-query after saving external results
        db_foods = (
            db.query(Food)
            .filter(search_filter)
            .order_by(*order_clauses)
            .limit(limit)
            .all()
        )

    # Sort results so local foods with complete nutrition always come first, then exact/prefix matches
    # If searching meat (chicken, mutton, fish, prawns), prioritize raw cuts over cooked curries
    q_lower = q.lower()
    is_meat_search = any(w in q_lower for w in ["chicken", "mutton", "fish", "prawn", "prawns", "egg", "meat"])

    def sort_key(f):
        name_l = (f.name or "").lower()
        is_local = 0 if f.source == "local" else 1

        # Specific user-preferred ordering for raw cuts
        if name_l == "chicken (raw)":
            raw_cut_rank = 0
        elif "chicken breast (raw)" in name_l:
            raw_cut_rank = 1
        elif "chicken boneless (raw)" in name_l:
            raw_cut_rank = 2
        elif is_meat_search and "(raw)" in name_l:
            raw_cut_rank = 3
        else:
            raw_cut_rank = 4

        is_exact = 0 if name_l == q_lower else 1
        is_prefix = 0 if name_l.startswith(q_lower) else 1
        has_calories = 0 if (f.calories or 0) > 0 else 1
        return (is_local, raw_cut_rank, is_exact, is_prefix, has_calories)

    return sorted(db_foods, key=sort_key)


CATEGORY_GROUP_MAP = {
    "Rice & Grains": {"id": "Rice & Grains", "title": "Rice, Grains & Millets", "icon": "🌾", "order": 1},
    "Legumes & Pulses": {"id": "Legumes & Pulses", "title": "Dals, Pulses & Legumes", "icon": "🫘", "order": 2},
    "Dal": {"id": "Dal", "title": "Andhra Dals & Pappu", "icon": "🍲", "order": 3},
    "Dal / Curries": {"id": "Dal", "title": "Andhra Dals & Pappu", "icon": "🍲", "order": 3},
    "Vegetables": {"id": "Vegetables", "title": "Vegetables, Roots & Gourds", "icon": "🥕", "order": 4},
    "Vegetable curries": {"id": "Vegetables", "title": "Vegetables, Roots & Gourds", "icon": "🥕", "order": 4},
    "Roots & Tubers": {"id": "Vegetables", "title": "Vegetables, Roots & Gourds", "icon": "🥕", "order": 4},
    "Leafy Greens": {"id": "Leafy Greens", "title": "Green Leafy Vegetables (Aaku Kooralu)", "icon": "🥬", "order": 5},
    "Fruits": {"id": "Fruits", "title": "Fresh & Dry Fruits", "icon": "🍎", "order": 6},
    "Seeds & Nuts": {"id": "Seeds & Nuts", "title": "Seeds & Nuts", "icon": "🥜", "order": 7},
    "Meat & Poultry": {"id": "Meat & Poultry", "title": "Chicken, Mutton & Poultry", "icon": "🍗", "order": 8},
    "Non-vegetarian": {"id": "Meat & Poultry", "title": "Chicken, Mutton & Poultry", "icon": "🍗", "order": 8},
    "Fish & Seafood": {"id": "Fish & Seafood", "title": "Fish & Seafood", "icon": "🐟", "order": 9},
    "Dairy": {"id": "Dairy & Eggs", "title": "Dairy & Eggs", "icon": "🥛", "order": 10},
    "Dairy & Eggs": {"id": "Dairy & Eggs", "title": "Dairy & Eggs", "icon": "🥛", "order": 10},
    "Breakfast": {"id": "Breakfast", "title": "Andhra & South Indian Breakfast", "icon": "🥞", "order": 11},
    "Rice dishes": {"id": "Rice dishes", "title": "Rice Dishes & Biryanis", "icon": "🍛", "order": 12},
    "Breads": {"id": "Breads", "title": "Indian Breads & Rotis", "icon": "🫓", "order": 13},
    "Pachadi & Chutneys": {"id": "Pachadi & Chutneys", "title": "Pachadi & Chutneys", "icon": "🥣", "order": 14},
    "Pickles": {"id": "Pickles", "title": "Pickles & Preserved Foods", "icon": "🫙", "order": 15},
    "Sambar & Rasam": {"id": "Sambar & Rasam", "title": "Sambar, Rasam & Charu", "icon": "🥣", "order": 16},
    "Spices & Condiments": {"id": "Spices & Condiments", "title": "Spices, Podis & Cooking Oils", "icon": "🌶️", "order": 17},
    "Condiments": {"id": "Spices & Condiments", "title": "Spices, Podis & Cooking Oils", "icon": "🌶️", "order": 17},
    "Snacks": {"id": "Snacks", "title": "Indian & Andhra Snacks", "icon": "🥨", "order": 18},
    "Sweets & Desserts": {"id": "Sweets & Desserts", "title": "Indian Sweets & Desserts", "icon": "🍮", "order": 19},
    "Beverage": {"id": "Beverage", "title": "Beverages & Traditional Drinks", "icon": "☕", "order": 20},
    "Supplements": {"id": "Supplements", "title": "Whey Protein & Supplements", "icon": "💪", "order": 21},
    "Restaurant & Fast Foods": {"id": "Restaurant & Fast Foods", "title": "Restaurant & Fast Foods", "icon": "🍕", "order": 22},
}


def _serialize_library_food(f: Food) -> Dict[str, Any]:
    unit = f.serving_unit or "g"
    unit_w = f.serving_unit_weight_g or 100.0
    factor = unit_w / 100.0 if unit not in ["g", "ml"] else 1.0

    is_liquid = unit in ["ml", "glass"] or (f.category and "beverage" in f.category.lower())
    base_label = "100ml" if is_liquid else "100g"

    return {
        "id": f.id,
        "name": f.name,
        "name_local": f.name_local,
        "category": f.category,
        "source": f.source,
        "serving_unit": unit,
        "serving_unit_weight_g": unit_w,
        "base_unit": base_label,
        "per_100g": {
            "calories": round(f.calories or 0, 1),
            "protein": round(f.protein or 0, 1),
            "carbohydrates": round(f.carbohydrates or 0, 1),
            "fat": round(f.fat or 0, 1),
            "saturated_fat": round(f.saturated_fat or 0, 1),
            "fiber": round(f.fiber or 0, 1),
            "sugar": round(f.sugar or 0, 1),
            "calcium": round(f.calcium or 0, 1),
            "iron": round(f.iron or 0, 1),
            "potassium": round(f.potassium or 0, 1),
            "sodium": round(f.sodium or 0, 1),
            "magnesium": round(f.magnesium or 0, 1),
            "zinc": round(f.zinc or 0, 1),
            "vitamin_c": round(f.vitamin_c or 0, 1),
            "cholesterol": round(f.cholesterol or 0, 1),
        },
        "per_serving": {
            "unit": unit,
            "weight_g": unit_w,
            "calories": round((f.calories or 0) * factor, 1),
            "protein": round((f.protein or 0) * factor, 1),
            "carbohydrates": round((f.carbohydrates or 0) * factor, 1),
            "fat": round((f.fat or 0) * factor, 1),
            "saturated_fat": round((f.saturated_fat or 0) * factor, 1),
            "fiber": round((f.fiber or 0) * factor, 1),
            "sugar": round((f.sugar or 0) * factor, 1),
            "calcium": round((f.calcium or 0) * factor, 1),
            "iron": round((f.iron or 0) * factor, 1),
            "potassium": round((f.potassium or 0) * factor, 1),
            "sodium": round((f.sodium or 0) * factor, 1),
            "magnesium": round((f.magnesium or 0) * factor, 1),
            "zinc": round((f.zinc or 0) * factor, 1),
            "vitamin_c": round((f.vitamin_c or 0) * factor, 1),
        }
    }


@router.get("/library")
def get_food_library(
    q: Optional[str] = None,
    category: Optional[str] = None,
    filter_type: Optional[str] = None,  # "all", "raw", "cooked"
    db: Session = Depends(get_db)
):
    """
    Returns foods organized by category with complete macro and micro nutrient profiles.
    Allows browsing: Category -> Items -> Micro values for 100g/100ml and serving units.
    """
    cache_key = f"food:lib:{q or ''}:{category or ''}:{filter_type or ''}"
    
    # Check in-memory cache first (valid 10 minutes)
    global _library_mem_cache, _library_mem_cache_time
    if cache_key in _library_mem_cache and (time.time() - _library_mem_cache_time < 600):
        return _library_mem_cache[cache_key]

    # Check Redis cache
    r = get_redis()
    if r:
        try:
            cached = r.get(cache_key)
            if cached:
                res = json.loads(cached)
                _library_mem_cache[cache_key] = res
                _library_mem_cache_time = time.time()
                return res
        except Exception:
            pass

    query = db.query(Food).filter(Food.source == "local")

    if q and q.strip():
        search_filter = _build_search_filter(q.strip())
        query = query.filter(search_filter)

    if filter_type == "raw":
        query = query.filter(Food.name.ilike("%(raw)%"))
    elif filter_type == "cooked":
        query = query.filter(
            or_(
                Food.name.ilike("%(cooked%"),
                Food.name.ilike("%(boiled%"),
                Food.name.ilike("%(steamed%"),
                Food.name.ilike("%(fried%"),
                Food.name.ilike("%(roasted%"),
                Food.name.ilike("%(grilled%"),
                Food.name.ilike("%curry%"),
                Food.name.ilike("%pulusu%"),
                Food.name.ilike("%vepudu%"),
            )
        )

    all_foods = query.order_by(Food.name.asc()).all()

    # Group foods into structured categories
    category_buckets: Dict[str, Dict[str, Any]] = {}

    for f in all_foods:
        cat_key = f.category or "General"
        meta = CATEGORY_GROUP_MAP.get(cat_key, {
            "id": cat_key,
            "title": cat_key,
            "icon": "🍽️",
            "order": 99
        })
        group_id = meta["id"]

        if group_id not in category_buckets:
            category_buckets[group_id] = {
                "id": group_id,
                "title": meta["title"],
                "icon": meta["icon"],
                "order": meta["order"],
                "items": []
            }

        category_buckets[group_id]["items"].append(_serialize_library_food(f))

    # Convert to sorted list by predefined order
    sorted_categories = sorted(
        category_buckets.values(),
        key=lambda x: (x["order"], x["title"])
    )

    for cat in sorted_categories:
        cat["count"] = len(cat["items"])

    # If user requested a specific category filter
    if category and category != "all":
        sorted_categories = [c for c in sorted_categories if c["id"].lower() == category.lower() or c["title"].lower() == category.lower()]

    result = {
        "total_items": len(all_foods),
        "total_categories": len(sorted_categories),
        "categories": sorted_categories
    }

    _library_mem_cache[cache_key] = result
    _library_mem_cache_time = time.time()
    if r:
        try:
            r.setex(cache_key, 3600, json.dumps(result))
        except Exception:
            pass

    return result


def _invalidate_library_cache():
    global _library_mem_cache
    _library_mem_cache.clear()
    r = get_redis()
    if r:
        try:
            keys = r.keys("food:lib:*")
            if keys:
                r.delete(*keys)
        except Exception:
            pass


@router.get("/{food_id}", response_model=FoodRead)
def get_food(food_id: int, db: Session = Depends(get_db)):
    f = db.query(Food).filter(Food.id == food_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Food not found")
    return f


@router.post("/custom", response_model=FoodRead)
def create_custom_food(food: FoodCreate, db: Session = Depends(get_db)):
    f = Food(**food.dict(), is_custom=True, source="custom")
    db.add(f)
    db.commit()
    db.refresh(f)
    _invalidate_library_cache()
    return f


@router.put("/custom/{food_id}", response_model=FoodRead)
def update_custom_food(food_id: int, food: FoodCreate, db: Session = Depends(get_db)):
    f = db.query(Food).filter(Food.id == food_id, Food.is_custom == True).first()
    if not f:
        raise HTTPException(status_code=404, detail="Custom food not found")
    for k, v in food.dict().items():
        setattr(f, k, v)
    db.commit()
    db.refresh(f)
    _invalidate_library_cache()
    return f


@router.delete("/custom/{food_id}")
def delete_custom_food(food_id: int, db: Session = Depends(get_db)):
    f = db.query(Food).filter(Food.id == food_id, Food.is_custom == True).first()
    if not f:
        raise HTTPException(status_code=404, detail="Custom food not found")
    db.delete(f)
    db.commit()
    _invalidate_library_cache()
    return {"ok": True}
