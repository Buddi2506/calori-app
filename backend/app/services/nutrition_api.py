import httpx
import json
import re
from ..config import settings
import redis

_redis_client = None

LIQUID_PATTERNS = [
    r"\bmilk\b", r"\bwater\b", r"\bjuice\b", r"\btea\b", r"\bcoffee\b",
    r"\boil\b", r"\bsoup\b", r"\brasam\b", r"\bbuttermilk\b", r"\bmajjiga\b",
    r"\bshake\b", r"\bsmoothie\b", r"\bdrink\b", r"\bsoda\b", r"\bbeverage\b",
    r"\bbeer\b", r"\bwine\b", r"\bbroth\b", r"\blassi\b", r"\bkashayam\b",
    r"\bsyrup\b", r"\blatte\b", r"\bchai\b", r"\bcappuccino\b", r"\bchaas\b"
]


def is_liquid_name(name: str) -> bool:
    name_lower = (name or "").lower()
    return any(re.search(pat, name_lower) for pat in LIQUID_PATTERNS)


def get_redis():
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2
            )
        except Exception:
            pass
    return _redis_client


def _search_open_food_facts(query: str) -> list:
    """Search Open Food Facts API."""
    url = (
        f"https://world.openfoodfacts.org/cgi/search.pl"
        f"?search_terms={query}"
        f"&search_simple=1&action=process&json=1"
        f"&fields=id,product_name,nutriments,serving_size&page_size=10"
    )
    try:
        res = httpx.get(url, timeout=8.0, headers={"User-Agent": "CaloriApp/1.0"})
        if res.status_code != 200:
            return []
        data = res.json()
        results = []
        for p in data.get("products", []):
            name = p.get("product_name", "").strip()
            if not name:
                continue
            nut = p.get("nutriments", {})
            is_liq = is_liquid_name(name)
            serving_unit = "ml" if is_liq else "g"
            results.append({
                "name": name,
                "name_local": None,
                "category": "Beverage" if is_liq else "General",
                "source": "off",
                "source_id": f"off_{p.get('id', '')}",
                "serving_size_g": 100.0,
                "serving_unit": serving_unit,
                "serving_unit_weight_g": 1.0 if is_liq else 100.0,
                "is_custom": False,
                "calories": float(nut.get("energy-kcal_100g") or 0),
                "protein": float(nut.get("proteins_100g") or 0),
                "carbohydrates": float(nut.get("carbohydrates_100g") or 0),
                "fat": float(nut.get("fat_100g") or 0),
                "fiber": float(nut.get("fiber_100g") or 0),
                "sugar": float(nut.get("sugars_100g") or 0),
                "sodium": float(nut.get("sodium_100g") or 0) * 1000,  # g → mg
                "potassium": 0.0,
                "iron": 0.0,
                "calcium": float(nut.get("calcium_100g") or 0) * 1000,  # g → mg
                "vitamin_c": float(nut.get("vitamin-c_100g") or 0) * 1000,
                "vitamin_d": 0.0,
                "vitamin_b12": 0.0,
                "magnesium": 0.0,
                "zinc": 0.0,
                "saturated_fat": float(nut.get("saturated-fat_100g") or 0),
                "trans_fat": 0.0,
                "cholesterol": 0.0,
            })
        return results
    except Exception as e:
        print(f"Open Food Facts error: {e}")
        return []


def _search_usda(query: str) -> list:
    """Search USDA FoodData Central API."""
    url = (
        f"{settings.USDA_BASE_URL}/foods/search"
        f"?query={query}&api_key={settings.USDA_API_KEY}&pageSize=10"
    )
    NUTRIENT_ID = {
        1008: "calories", 1003: "protein", 1005: "carbohydrates", 1004: "fat",
        1079: "fiber", 1093: "sodium", 1092: "potassium", 1089: "iron",
        1087: "calcium", 1162: "vitamin_c", 1114: "vitamin_d", 1178: "vitamin_b12",
        1090: "magnesium", 1095: "zinc", 1258: "saturated_fat", 1253: "cholesterol",
    }
    try:
        res = httpx.get(url, timeout=8.0)
        if res.status_code != 200:
            return []
        data = res.json()
        results = []
        for f in data.get("foods", []):
            name = f.get("description", "").strip()
            nutrients = {n["nutrientId"]: float(n.get("value") or 0) for n in f.get("foodNutrients", [])}
            mapped = {nname: nutrients.get(nid, 0.0) for nid, nname in NUTRIENT_ID.items()}
            is_liq = is_liquid_name(name)
            serving_unit = "ml" if is_liq else "g"
            results.append({
                "name": name,
                "name_local": None,
                "category": "Beverage" if is_liq else "General",
                "source": "usda",
                "source_id": f"usda_{f.get('fdcId')}",
                "serving_size_g": 100.0,
                "serving_unit": serving_unit,
                "serving_unit_weight_g": 1.0 if is_liq else 100.0,
                "is_custom": False,
                "sugar": 0.0,
                "trans_fat": 0.0,
                **mapped,
            })
        return results
    except Exception as e:
        print(f"USDA error: {e}")
        return []


def search_external(query: str) -> list:
    """Search external nutrition APIs with Redis caching."""
    cache_key = f"food:search:{query.lower().strip()}"
    rc = get_redis()
    if rc:
        try:
            cached = rc.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    results = []

    # Try USDA first (often faster and more accurate)
    if settings.USDA_API_KEY and settings.USDA_API_KEY != "DEMO_KEY":
        results.extend(_search_usda(query))

    # Then Open Food Facts
    off_results = _search_open_food_facts(query)
    existing_names = {r["name"].lower() for r in results}
    for r in off_results:
        if r["name"].lower() not in existing_names:
            results.append(r)

    # If DEMO_KEY, try USDA last
    if not results or settings.USDA_API_KEY == "DEMO_KEY":
        usda_results = _search_usda(query)
        existing_names = {r["name"].lower() for r in results}
        for r in usda_results:
            if r["name"].lower() not in existing_names:
                results.append(r)

    # Cache for 7 days
    if rc:
        try:
            rc.setex(cache_key, 7 * 24 * 60 * 60, json.dumps(results))
        except Exception:
            pass

    return results[:20]
