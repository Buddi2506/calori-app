import httpx
import json
import re
from ..config import settings
from .food_catalog import categorize, plausible
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


def _per_100(nutriments: dict, key: str) -> float:
    try:
        return float(nutriments.get(f"{key}_100g") or 0)
    except (TypeError, ValueError):
        return 0.0


def _food_row(name, source, source_id, values: dict) -> dict:
    is_liq = is_liquid_name(name)
    category = categorize(name)
    if is_liq and category == "Packaged & Other":
        category = "Beverages"
    row = {
        "name": name,
        "name_local": None,
        "category": category,
        "source": source,
        "source_id": source_id,
        "serving_size_g": 100.0,
        "serving_unit": "ml" if is_liq else "g",
        "serving_unit_weight_g": 1.0 if is_liq else 100.0,
        "is_custom": False,
    }
    for key in ("calories", "protein", "carbohydrates", "fat", "fiber", "sugar", "sodium", "potassium",
                "iron", "calcium", "vitamin_c", "vitamin_d", "vitamin_b12", "magnesium", "zinc",
                "saturated_fat", "trans_fat", "cholesterol"):
        row[key] = round(float(values.get(key) or 0), 2)
    return row


def _tidy_name(name: str) -> str:
    """USDA branded names come in capitals; make them readable."""
    name = " ".join((name or "").split())
    return name.title() if name.isupper() else name


SKIP_NAMES = re.compile(r"^(babyfood|baby food|toddler|infant formula)", re.IGNORECASE)


def _readable(name: str) -> bool:
    """An English name worth showing: not empty, not another script, not baby food."""
    return bool(name) and name.isascii() and not SKIP_NAMES.match(name)


def _search_open_food_facts(query: str) -> list:
    """Packaged products from Open Food Facts, only those with a full nutrition label."""
    try:
        res = httpx.get(
            "https://world.openfoodfacts.org/cgi/search.pl",
            params={
                "search_terms": query, "search_simple": 1, "action": "process", "json": 1,
                "fields": "code,product_name,product_name_en,brands,nutriments", "page_size": 20,
                # Products sold in India; the global catalogue is mostly European items.
                "tagtype_0": "countries", "tag_contains_0": "contains", "tag_0": "india",
            },
            timeout=6.0,
            headers={"User-Agent": "CaloriApp/1.0"},
        )
        if res.status_code != 200:
            return []
        results = []
        for p in res.json().get("products", []):
            name = _tidy_name(p.get("product_name_en") or p.get("product_name") or "")
            if not _readable(name):
                continue
            brand = (p.get("brands") or "").split(",")[0].strip()
            if brand and brand.lower() not in name.lower():
                name = f"{name} ({brand})"
            nut = p.get("nutriments") or {}
            kcal = _per_100(nut, "energy-kcal") or _per_100(nut, "energy") / 4.184
            protein, carbs, fat = _per_100(nut, "proteins"), _per_100(nut, "carbohydrates"), _per_100(nut, "fat")
            if not plausible(kcal, protein, carbs, fat):
                continue
            results.append(_food_row(name, "off", f"off_{p.get('code', '')}", {
                "calories": kcal,
                "protein": protein,
                "carbohydrates": carbs,
                "fat": fat,
                "fiber": _per_100(nut, "fiber"),
                "sugar": _per_100(nut, "sugars"),
                "sodium": _per_100(nut, "sodium") * 1000,  # g → mg
                "calcium": _per_100(nut, "calcium") * 1000,
                "iron": _per_100(nut, "iron") * 1000,
                "vitamin_c": _per_100(nut, "vitamin-c") * 1000,
                "saturated_fat": _per_100(nut, "saturated-fat"),
                "trans_fat": _per_100(nut, "trans-fat"),
                "cholesterol": _per_100(nut, "cholesterol") * 1000,
            }))
        return results
    except Exception as e:
        print(f"Open Food Facts error: {e}")
        return []


# USDA nutrient ids → our fields. Energy has three ids: 1008 in most data,
# 2047 / 2048 (Atwater factors) in the newer Foundation foods.
USDA_NUTRIENTS = {
    1003: "protein", 1005: "carbohydrates", 1004: "fat", 1079: "fiber", 2000: "sugar",
    1093: "sodium", 1092: "potassium", 1089: "iron", 1087: "calcium", 1162: "vitamin_c",
    1114: "vitamin_d", 1178: "vitamin_b12", 1090: "magnesium", 1095: "zinc",
    1258: "saturated_fat", 1257: "trans_fat", 1253: "cholesterol",
}
USDA_ENERGY = (1008, 2047, 2048)
# Lab-measured generic foods first; branded labels only when those find too little.
USDA_GENERIC = ["Foundation", "SR Legacy", "Survey (FNDDS)"]


def _search_usda(query: str, data_types: list) -> list:
    try:
        res = httpx.post(
            f"{settings.USDA_BASE_URL}/foods/search",
            params={"api_key": settings.USDA_API_KEY},
            json={"query": query, "pageSize": 15, "dataType": data_types},
            timeout=6.0,
        )
        if res.status_code != 200:
            print(f"USDA search returned {res.status_code}")
            return []
        results = []
        for f in res.json().get("foods", []):
            nutrients = {n.get("nutrientId"): float(n.get("value") or 0) for n in f.get("foodNutrients", [])}
            values = {field: nutrients.get(nid, 0.0) for nid, field in USDA_NUTRIENTS.items()}
            values["calories"] = next((nutrients[i] for i in USDA_ENERGY if nutrients.get(i)), 0.0)
            if not plausible(values["calories"], values["protein"], values["carbohydrates"], values["fat"]):
                continue
            name = _tidy_name(f.get("description", ""))
            if not _readable(name):
                continue
            brand = _tidy_name(f.get("brandName") or f.get("brandOwner") or "")
            if brand and brand.lower() not in name.lower():
                name = f"{name} ({brand})"
            results.append(_food_row(name, "usda", f"usda_{f.get('fdcId')}", values))
        return results
    except Exception as e:
        print(f"USDA error: {e}")
        return []


def search_external(query: str) -> list:
    """Foods from USDA and Open Food Facts, cached in Redis."""
    cache_key = f"food:search:v2:{query.lower().strip()}"
    rc = get_redis()
    if rc:
        try:
            cached = rc.get(cache_key)
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    results = _search_usda(query, USDA_GENERIC)
    if len(results) < 5:
        results += _search_usda(query, ["Branded"])
    results += _search_open_food_facts(query)

    unique, seen = [], set()
    for r in results:
        key = r["name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(r)
    unique = unique[:20]

    if rc:
        try:
            # An empty answer is often a rate limit or a timeout, so it is only kept for an hour.
            ttl = 7 * 24 * 60 * 60 if unique else 60 * 60
            rc.setex(cache_key, ttl, json.dumps(unique))
        except Exception:
            pass

    return unique
