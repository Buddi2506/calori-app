from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import json
import re
import time
from ..database import get_db
from ..models.food import Food
from ..models.diary import DiaryEntry
from ..models.meal import CustomMealItem
from ..schemas.food import FoodRead, FoodCreate
from ..services.nutrition_api import search_external, get_redis
from ..services.food_catalog import CATEGORIES
from ..services.security import get_current_user, require_admin

# Every food endpoint needs a signed-in user; editing or deleting shared foods needs an admin.
router = APIRouter(prefix="/api/foods", tags=["Foods"], dependencies=[Depends(get_current_user)])

_library_mem_cache: Dict[str, Any] = {}
_library_mem_cache_time: float = 0.0

def _word_start(column, text: str):
    """Case-insensitive match of `text` at the start of a word in the column."""
    return column.op("~*")(r"\m" + re.escape(text.strip()))


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
        conditions.append(Food.category == "Fruits & Dry Fruits")
    elif norm_q in ("veg", "vegs", "vegetable", "vegetables", "vegitables"):
        conditions.append(Food.category == "Vegetables")
        conditions.append(Food.category == "Leafy Greens")
        conditions.append(Food.category == "Vegetable Curries & Fries")
    elif norm_q in ("greens", "leafy greens", "aaku kooralu", "aku kura"):
        conditions.append(Food.category == "Leafy Greens")
    elif norm_q in ("millet", "millets", "chirudhanyalu"):
        conditions.append(Food.name.ilike("%millet%"))
        conditions.append(Food.name.ilike("%ragi%"))
        conditions.append(Food.name.ilike("%jowar%"))
        conditions.append(Food.name.ilike("%bajra%"))
    elif norm_q in ("dal", "dals", "pulses", "pulse", "pappu"):
        conditions.append(Food.category == "Dals & Pulses")
        conditions.append(Food.category == "Pappu, Sambar & Rasam")
        conditions.append(Food.name.ilike("%pappu%"))
    elif norm_q in ("spice", "spices", "masala", "masalas"):
        conditions.append(Food.category == "Spices & Podis")
    elif norm_q in ("dairy", "milk", "curd"):
        conditions.append(Food.category == "Dairy")
    elif norm_q in ("nuts", "nut", "seeds", "seed"):
        conditions.append(Food.category == "Nuts & Seeds")
    elif norm_q in ("meat", "chicken", "mutton", "poultry"):
        conditions.append(Food.category == "Chicken & Meat")
    elif norm_q in ("fish", "seafood", "prawn", "prawns", "crab"):
        conditions.append(Food.category == "Fish & Seafood")
    elif norm_q in ("breakfast", "tiffin", "tiffins"):
        conditions.append(Food.category == "Breakfast & Tiffins")
    elif norm_q in ("sweet", "sweets", "dessert", "desserts"):
        conditions.append(Food.category == "Sweets & Desserts")
    elif norm_q in ("bread", "breads", "roti", "rotis", "naan"):
        conditions.append(Food.category == "Breads & Rotis")
    elif norm_q in ("rice", "annam"):
        conditions.append(Food.category == "Rice & Grains")
        conditions.append(Food.category == "Rice Dishes")
    elif norm_q in ("pachadi", "chutney", "chutneys"):
        conditions.append(Food.category == "Chutneys & Pachadi")
    elif norm_q in ("pickle", "pickles"):
        conditions.append(Food.category == "Pickles")
    elif norm_q in ("sambar", "rasam", "charu"):
        conditions.append(Food.category == "Pappu, Sambar & Rasam")
    elif norm_q in ("snack", "snacks"):
        conditions.append(Food.category == "Snacks")
    elif norm_q in ("egg", "eggs", "guddu", "gudlu"):
        conditions.append(Food.category == "Eggs")
    elif norm_q in ("oil", "oils", "ghee", "nune"):
        conditions.append(Food.category == "Oils & Ghee")

    # 1. Words in the name that start with the query ("gula" finds Gulab Jamun but not "regular"),
    #    the local (Telugu) name anywhere, and the category name
    conditions.append(_word_start(Food.name, clean_q))
    conditions.append(Food.name_local.ilike(f"%{clean_q}%"))
    conditions.append(_word_start(Food.category, clean_q))
    if norm_q != clean_q.lower():
        conditions.append(_word_start(Food.name, norm_q))
        conditions.append(_word_start(Food.category, norm_q))

    # 2. If mix seeds query, specifically match our combined seed items
    if is_mix_seeds:
        conditions.append(Food.name.ilike("%Mix Seeds%"))
        conditions.append(Food.name.ilike("%Mixed Seeds%"))

    # 3. Token-based matching: e.g. "melon seeds", "pumpkin seeds", "almond nuts"
    tokens = [t for t in norm_q.split() if len(t) > 1 and t not in ("of", "and", "the", "in")]
    if len(tokens) > 1:
        token_match = and_(*[or_(_word_start(Food.name, t), Food.name_local.ilike(f"%{t}%")) for t in tokens])
        conditions.append(token_match)

    return or_(*conditions)


def _save_external_foods(db: Session, query: str) -> None:
    """Fetch foods from USDA / Open Food Facts and keep the new ones."""
    try:
        for food_data in search_external(query):
            sid = food_data.get("source_id")
            if sid and db.query(Food.id).filter(Food.source_id == sid).first():
                continue
            if db.query(Food.id).filter(Food.name.ilike(food_data["name"])).first():
                continue
            db.add(Food(**{k: v for k, v in food_data.items() if hasattr(Food, k)}))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"External search error: {e}")


# Fewer built-in matches than this and the search also asks USDA / Open Food Facts.
EXTERNAL_LOOKUP_BELOW = 3
# How many matches are ranked before the best `limit` are returned.
MAX_CANDIDATES = 300


@router.get("/search")
def search_foods(q: str, limit: int = 20, db: Session = Depends(get_db)):
    """
    Search foods: built-in foods first, then ones saved from USDA / Open Food Facts.
    Supports aliases (e.g. flex seeds -> flax seeds, badam -> almonds) and Telugu names.
    When few built-in foods match, it also looks the food up online and keeps what it finds.
    """
    q_lower = (q or "").lower().strip()
    if not q_lower:
        return []
    is_meat_search = any(w in q_lower for w in ["chicken", "mutton", "fish", "prawn", "prawns", "egg", "meat"])

    order_clauses = [(Food.source == "local").desc()]
    if is_meat_search:
        order_clauses.append(Food.name.ilike("%(raw)%").desc())
    order_clauses.append((Food.calories > 0).desc())

    search_filter = _build_search_filter(q)

    # Rank in Python over every match, not just the first `limit` rows the database returns.
    def run_query():
        return db.query(Food).filter(search_filter).order_by(*order_clauses).limit(MAX_CANDIDATES).all()

    db_foods = run_query()
    if sum(1 for f in db_foods if f.source == "local") < EXTERNAL_LOOKUP_BELOW and len(q_lower) >= 3:
        _save_external_foods(db, q)
        db_foods = run_query()

    whole_word = re.compile(r"\b" + re.escape(q_lower) + r"\b")

    # Built-in foods first; for meat searches the raw cuts before curries; then the exact name,
    # then names with the query as a whole word ("Plain Dosa" before "Dosakaya"), shortest first.
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
        is_whole_word = 0 if whole_word.search(name_l) else 1
        has_calories = 0 if (f.calories or 0) > 0 else 1
        return (is_local, raw_cut_rank, is_exact, is_whole_word, has_calories, len(name_l))

    return sorted(db_foods, key=sort_key)[:limit]


# Food list headings: every category with its icon and place in the list.
CATEGORY_GROUP_MAP = {
    name: {"id": name, "title": name, "icon": icon, "order": i}
    for i, (name, icon) in enumerate(CATEGORIES, start=1)
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
    cache_key = f"food:lib:v2:{q or ''}:{category or ''}:{filter_type or ''}"
    
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


@router.put("/custom/{food_id}", response_model=FoodRead, dependencies=[Depends(require_admin)])
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


@router.delete("/custom/{food_id}", dependencies=[Depends(require_admin)])
def delete_custom_food(food_id: int, db: Session = Depends(get_db)):
    f = db.query(Food).filter(Food.id == food_id, Food.is_custom == True).first()
    if not f:
        raise HTTPException(status_code=404, detail="Custom food not found")
    in_use = (
        db.query(DiaryEntry.id).filter(DiaryEntry.food_id == food_id).first()
        or db.query(CustomMealItem.id).filter(CustomMealItem.food_id == food_id).first()
    )
    if in_use:
        raise HTTPException(status_code=409, detail="This food is used in a diary or custom meal and can't be deleted")
    db.delete(f)
    db.commit()
    _invalidate_library_cache()
    return {"ok": True}
