"""Food categories, calorie corrections and sorting of foods fetched from USDA / Open Food Facts.

Every food is stored per 100 g (or 100 ml). Some built-in foods were entered with the values of
one piece or one serving instead, and the original seed file was scaled a second time on import,
so `CALORIE_FIXES` sets the right per-100 g calories for those. The other nutrients are scaled by
the same ratio, which is what a unit mix-up needs.
"""
import logging
import re

from sqlalchemy.orm import Session

from ..models.diary import DiaryEntry
from ..models.food import Food
from ..models.meal import CustomMealItem

logger = logging.getLogger(__name__)

NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "trans_fat", "cholesterol",
]

# The categories, in the order the food list shows them.
CATEGORIES = [
    ("Rice & Grains", "🌾"),
    ("Rice Dishes", "🍛"),
    ("Breakfast & Tiffins", "🥞"),
    ("Breads & Rotis", "🫓"),
    ("Dals & Pulses", "🫘"),
    ("Pappu, Sambar & Rasam", "🍲"),
    ("Vegetables", "🥕"),
    ("Leafy Greens", "🥬"),
    ("Vegetable Curries & Fries", "🥘"),
    ("Fruits & Dry Fruits", "🍎"),
    ("Nuts & Seeds", "🥜"),
    ("Eggs", "🥚"),
    ("Chicken & Meat", "🍗"),
    ("Fish & Seafood", "🐟"),
    ("Dairy", "🥛"),
    ("Chutneys & Pachadi", "🥣"),
    ("Pickles", "🫙"),
    ("Spices & Podis", "🌶️"),
    ("Oils & Ghee", "🫒"),
    ("Sugars & Sweeteners", "🍯"),
    ("Snacks", "🥨"),
    ("Sweets & Desserts", "🍮"),
    ("Beverages", "☕"),
    ("Supplements", "💪"),
    ("Restaurant & Fast Food", "🍕"),
    ("Packaged & Other", "📦"),
]
CATEGORY_NAMES = {name for name, _ in CATEGORIES}
OTHER = "Packaged & Other"

# Old category name → new one, for everything not listed in CATEGORY_OVERRIDES.
CATEGORY_RENAMES = {
    "Rice & Grains": "Rice & Grains",
    "Rice dishes": "Rice Dishes",
    "Breakfast": "Breakfast & Tiffins",
    "Breads": "Breads & Rotis",
    "Legumes & Pulses": "Dals & Pulses",
    "Dal": "Pappu, Sambar & Rasam",
    "Dal / Curries": "Pappu, Sambar & Rasam",
    "Sambar & Rasam": "Pappu, Sambar & Rasam",
    "Vegetables": "Vegetables",
    "Roots & Tubers": "Vegetables",
    "Leafy Greens": "Leafy Greens",
    "Vegetable curries": "Vegetable Curries & Fries",
    "Fruits": "Fruits & Dry Fruits",
    "Seeds & Nuts": "Nuts & Seeds",
    "Dairy & Eggs": "Eggs",
    "Meat & Poultry": "Chicken & Meat",
    "Non-vegetarian": "Chicken & Meat",
    "Fish & Seafood": "Fish & Seafood",
    "Dairy": "Dairy",
    "Condiments": "Chutneys & Pachadi",
    "Pachadi & Chutneys": "Chutneys & Pachadi",
    "Pickles": "Pickles",
    "Spices & Condiments": "Spices & Podis",
    "Sugars & Sweeteners": "Sugars & Sweeteners",
    "Snacks": "Snacks",
    "Sweets & Desserts": "Sweets & Desserts",
    "Beverage": "Beverages",
    "Supplements": "Supplements",
    "Restaurant & Fast Foods": "Restaurant & Fast Food",
}

# Built-in foods that sat in the wrong category.
CATEGORY_OVERRIDES = {
    # Rotis made from millet flour are breads
    "Bajra Roti / Sajja Rotte": "Breads & Rotis",
    "Jowar Roti / Jonna Rotte": "Breads & Rotis",
    # Drinks
    "Ragi Malt / Ragi Java (with Buttermilk)": "Beverages",
    "Barley Water / Cooked Barley": "Beverages",
    "Tender Coconut Water / Kobbari Neellu": "Beverages",
    "Cow Milk": "Dairy",
    "Whole Milk": "Dairy",
    # Plain cooked rice sits with the other rice, dishes are separate
    "Cooked White Rice": "Rice & Grains",
    "Cooked Brown Rice": "Rice & Grains",
    "Ragi Sankati with Natu Kodi Pulusu": "Rice Dishes",
    # Stews and dals
    "Ulavacharu (Horsegram Stew)": "Pappu, Sambar & Rasam",
    "Drumstick Sambar": "Pappu, Sambar & Rasam",
    "Majjiga Pulusu": "Vegetable Curries & Fries",
    # Cooked vegetable dishes
    "Aratikaya Vepudu (Raw Banana Fry)": "Vegetable Curries & Fries",
    "Bendakaya Pulusu (Okra Tangy Stew)": "Vegetable Curries & Fries",
    "Carrot Beans Poriyal / Kura": "Vegetable Curries & Fries",
    "Chikkudukaya Kura (Broad Beans Curry)": "Vegetable Curries & Fries",
    "Dondakaya Vepudu (Ivy Gourd Fry)": "Vegetable Curries & Fries",
    "Gutti Vankaya Kura (Stuffed Brinjal Curry)": "Vegetable Curries & Fries",
    "Kakarakaya Pulusu (Sweet & Sour Bitter Gourd)": "Vegetable Curries & Fries",
    "Kakarakaya Vepudu (Bitter Gourd Fry)": "Vegetable Curries & Fries",
    "Munagakaya Kura (Drumstick Masala Curry)": "Vegetable Curries & Fries",
    "Raw Jackfruit Curry / Panasa Pottu Kura": "Vegetable Curries & Fries",
    "Vankaya Pulusu (Brinjal Tangy Stew)": "Vegetable Curries & Fries",
    # Leaves and herbs
    "Bachali Kura (Malabar Spinach, Raw)": "Leafy Greens",
    "Gongura (Sorrel Leaves, Raw)": "Leafy Greens",
    "Menthi Kura (Fenugreek Leaves, Raw)": "Leafy Greens",
    "Moringa Leaves / Munagaku (Raw)": "Leafy Greens",
    "Thotakura (Amaranth Leaves, Raw)": "Leafy Greens",
    "Spinach / Palakura (Raw)": "Leafy Greens",
    "Coriander Leaves / Kothimeera (Fresh)": "Leafy Greens",
    "Mint Leaves / Pudina (Fresh)": "Leafy Greens",
    "Curry Leaves / Karivepaku (Fresh)": "Leafy Greens",
    # Eggs
    "Boiled Egg": "Eggs",
    "Boiled Egg White": "Eggs",
    "Egg White (Boiled)": "Eggs",
    "Egg Bhurji": "Eggs",
    "Egg Curry": "Eggs",
    "Omelette (Plain / Indian Style with Onion)": "Eggs",
    "Scrambled Egg / Plain Egg Bhurji": "Eggs",
    "Egg Pulusu (Boiled Egg in Tangy Curry)": "Eggs",
    # Seafood curries
    "Fish Curry - Rohu": "Fish & Seafood",
    "Prawns Curry": "Fish & Seafood",
    # Fats
    "Ghee": "Oils & Ghee",
    "Buffalo Ghee": "Oils & Ghee",
    "Vanaspati / Dalda (Hydrogenated Fat)": "Oils & Ghee",
    # Pickles and chutneys
    "Avakaya Pachadi (Andhra Mango Pickle)": "Pickles",
    "Gongura Nilva Pachadi (Andhra Pickle)": "Pickles",
    "Tomato Nilva Pachadi (Tomato Pickle)": "Pickles",
    "Allam Pachadi (Ginger Chutney)": "Chutneys & Pachadi",
    "Gongura Pachadi": "Chutneys & Pachadi",
    # Fruit and sweets that were filed as snacks
    "Banana": "Fruits & Dry Fruits",
    "Mango": "Fruits & Dry Fruits",
    "Semiya Payasam (with Milk & Ghee)": "Sweets & Desserts",
    "Sunnundalu (Urad Dal Ladoo with Ghee)": "Sweets & Desserts",
    "Bobbatlu / Bakshalu / Puran Poli": "Sweets & Desserts",
    "Gavvalu (Sweet Jaggery Shells)": "Sweets & Desserts",
}

# Right calories per 100 g for built-in foods that were off by more than ~20%.
# Values follow IFCT 2017 / USDA and common Indian recipe averages.
CALORIE_FIXES = {
    # Seed foods scaled twice on import
    "Idly": 135,
    "Plain Dosa": 170,
    "Masala Dosa": 175,
    "Set Dosa": 165,
    "Pesarattu": 160,
    "Rava Idly": 160,
    "Puri": 400,
    "Coconut Chutney": 210,
    "Peanut Chutney": 280,
    "Tomato Chutney": 120,
    "Gongura Pachadi": 170,
    # Values of one piece or one serving stored as per 100 g
    "Uttapam": 170,
    "Mysore Bonda": 300,
    "Plain Naan": 290,
    "Lachha Paratha": 330,
    "Methi Paratha": 265,
    "Makki Roti (Corn Flour Roti)": 270,
    "Multigrain Roti": 270,
    "Phulka (Oil-Free Puffed Roti)": 260,
    "Tandoori Roti (Whole Wheat)": 270,
    "Sattu Drink (Roasted Gram Flour with Spices)": 50,
    "Sugarcane Juice / Cheruku Rasam (Fresh)": 72,
    "Chepala Pulusu (Nellore Fish Curry)": 120,
    "Royyala Iguru (Andhra Prawn Masala)": 140,
    "Bobbatlu / Bakshalu / Puran Poli": 310,
    "Gavvalu (Sweet Jaggery Shells)": 430,
    "Janthikalu / Murukulu": 500,
    "Mirchi Bajji (Andhra Style Stuffed)": 260,
    "Ariselu (Jaggery & Rice Flour Sweet with Ghee)": 430,
    "Besan Laddu": 500,
    "Boondi Laddu": 460,
    "Gulab Jamun": 320,
    "Jalebi": 430,
    "Kajjikayalu (Coconut Stuffed Puffs)": 460,
    "Kobbari Louz (Coconut Jaggery Balls)": 430,
    "Mysore Pak (Ghee)": 550,
    "Poornam Boorelu": 340,
    "Pootharekulu (Paper Sweet with Sugar/Jaggery)": 460,
    "Rasgulla": 190,
    "Rasmalai": 260,
    "Rava Laddu": 450,
    "Rice Payasam / Paramannam (with Jaggery & Ghee)": 170,
    "Suji Halwa / Kesari (with Ghee)": 300,
    "Chole Bhature (1 Bhatura + Chole Curry)": 200,
    "Pav Bhaji (2 Pavs + Bhaji Curry)": 170,
    "Butter Chicken / Murgh Makhani": 190,
    "Paneer Butter Masala": 230,
}

# Keyword rules for foods fetched from USDA / Open Food Facts. First match wins,
# so the more specific rules ("ice cream", "peanut butter") come before general ones.
_RULES = [
    ("Supplements", r"whey|protein powder|protein isolate|casein|mass gainer|creatine"),
    ("Sweets & Desserts", r"ice cream|chocolate|cake|cookie|brownie|pastry|candy|dessert|pudding|custard|icing|"
                          r"frosting|jam\b|jelly|gulab|jamun|laddu|ladoo|halwa|barfi|burfi|jalebi|rasgulla|kheer|payasam|chikki|mithai"),
    ("Pickles", r"pickle|achar|avakaya"),
    ("Snacks", r"chips|crisps|namkeen|bhujia|mixture|popcorn|cracker|biscuit|pretzel|nachos|snack|bar\b"),
    ("Nuts & Seeds", r"peanut butter|almond|cashew|walnut|pistachio|hazelnut|pecan|macadamia|peanut|groundnut|"
                     r"\bnuts?\b|seeds?\b|chia|flax"),
    ("Rice Dishes", r"biryani|pulao|fried rice|khichdi"),
    ("Beverages", r"juice|\btea\b|coffee|soda|\bdrink|beverage|smoothie|shake|lassi|cola|lemonade|\bwater\b"),
    ("Eggs", r"\beggs?\b|omelet"),
    ("Fish & Seafood", r"fish|salmon|tuna|sardine|mackerel|prawn|shrimp|crab|lobster|squid|oyster|clam|mussel|seafood|cod\b|tilapia"),
    ("Chicken & Meat", r"chicken|mutton|lamb|goat|beef|pork|turkey|duck|meat|sausage|bacon|\bham\b|salami|keema"),
    ("Oils & Ghee", r"\boil\b|\bghee\b|margarine|shortening|lard"),
    ("Dairy", r"milk|cheese|yogh?urt|\bcurd|paneer|cream|butter|buttermilk|khoa"),
    ("Breads & Rotis", r"bread|roti|chapati|naan|paratha|tortilla|bun\b|bagel|pita"),
    ("Rice & Grains", r"\brice\b|oat|wheat|flour|quinoa|millet|barley|ragi|jowar|bajra|semolina|rava|pasta|noodle|"
                      r"macaroni|spaghetti|cereal|flakes|cornmeal|couscous|muesli|granola|poha"),
    ("Dals & Pulses", r"lentil|\bdal\b|chickpea|chana|rajma|kidney bean|black bean|soybean|tofu|\bbeans?\b|\bpeas\b|gram\b"),
    ("Fruits & Dry Fruits", r"apple|banana|mango|grape|orange|berry|berries|fruit|\bdates?\b|raisin|\bfigs?\b|papaya|"
                            r"pineapple|melon|guava|pomegranate|kiwi|peach|pear|plum|cherry|apricot|lemon|lime|coconut|"
                            r"avocado|lychee|litchi|sapota|chikoo|jackfruit|prune|olive"),
    ("Vegetables", r"vegetable|potato|tomato|onion|carrot|broccoli|cabbage|cauliflower|spinach|cucumber|pepper|"
                   r"brinjal|eggplant|okra|pumpkin|gourd|beet|radish|mushroom|lettuce|kale|corn\b|garlic|ginger"),
    ("Spices & Podis", r"spice|masala|powder|salt|pepper|cumin|turmeric|chilli|chili|sauce|ketchup|vinegar|seasoning|"
                       r"\bdip\b|mayonnaise|dressing|mustard|chutney"),
    ("Sugars & Sweeteners", r"sugar|honey|jaggery|syrup|sweetener"),
]
_RULES = [(cat, re.compile(pat)) for cat, pat in _RULES]
_OIL = re.compile(r"\boil\b", re.IGNORECASE)


def categorize(name: str) -> str:
    """A category for a food fetched from outside, from words in its name."""
    text = (name or "").lower()
    for category, pattern in _RULES:
        if pattern.search(text):
            return category
    return OTHER


def plausible(kcal: float, protein: float, carbs: float, fat: float) -> bool:
    """Calories that roughly agree with protein, carbs and fat. Rejects empty listings
    and labels typed in per serving or in kJ."""
    if kcal <= 0 or kcal > 900:
        return False
    macros = 4 * protein + 4 * carbs + 9 * fat
    if macros <= 0:
        return False
    # Fibre, alcohol and rounding make labels differ a bit; a big gap means bad data.
    return abs(kcal - macros) <= max(40, 0.35 * kcal)


def _scale(food: Food, kcal: float) -> None:
    ratio = kcal / food.calories
    for key in NUTRIENT_KEYS:
        value = getattr(food, key) or 0
        setattr(food, key, round(value * ratio, 3))
    food.calories = float(kcal)


def apply_catalog_fixes(db: Session) -> int:
    """Correct built-in calories and categories, and tidy foods saved from USDA / Open Food Facts.
    Safe to run on every startup: foods that are already right are left alone."""
    changed = 0

    for food in db.query(Food).filter(Food.source == "local").all():
        want = CATEGORY_OVERRIDES.get(food.name) or CATEGORY_RENAMES.get(food.category, food.category)
        if want == "Spices & Podis" and _OIL.search(food.name):
            want = "Oils & Ghee"
        if want not in CATEGORY_NAMES:
            want = OTHER
        if food.category != want:
            food.category = want
            changed += 1
        kcal = CALORIE_FIXES.get(food.name)
        if kcal and food.calories and abs(food.calories - kcal) > 0.5:
            _scale(food, kcal)
            changed += 1

    used = {fid for (fid,) in db.query(DiaryEntry.food_id).distinct()}
    used |= {fid for (fid,) in db.query(CustomMealItem.food_id).distinct()}
    seen = set()
    external = db.query(Food).filter(Food.source.in_(["usda", "off"])).order_by(Food.id).all()
    # Foods in use are kept and claim their name first, so a duplicate of them is the one removed.
    for food in sorted(external, key=lambda f: f.id not in used):
        key = (food.name or "").strip().lower()
        good = plausible(food.calories or 0, food.protein or 0, food.carbohydrates or 0, food.fat or 0)
        if food.id not in used and (not good or key in seen):
            db.delete(food)
            changed += 1
            continue
        seen.add(key)
        if food.category not in CATEGORY_NAMES:
            food.category = categorize(food.name)
            changed += 1

    if changed:
        db.commit()
        logger.info("Food catalog: %d corrections applied", changed)
    return changed
