"""Food search, calorie fixes and category tests. Run them like test_workouts.py (see its docstring)."""
import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
if not TEST_DATABASE_URL or TEST_DATABASE_URL == os.environ.get("DATABASE_URL"):
    pytest.skip("Set TEST_DATABASE_URL to a separate test database", allow_module_level=True)

from app.models.food import Food  # noqa: E402
from app.routers import foods as foods_router  # noqa: E402
from app.services import food_catalog  # noqa: E402
from app.services.food_catalog import apply_catalog_fixes, categorize, plausible  # noqa: E402

engine = create_engine(TEST_DATABASE_URL)
TestSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

PREFIX = "Zzq"  # an unlikely word, so these foods don't mix with the real ones


def make(name, source="local", category="General", kcal=100.0, p=5.0, c=15.0, f=2.0, **extra):
    return Food(
        name=f"{PREFIX} {name}", category=category, source=source, serving_size_g=100, serving_unit="g",
        serving_unit_weight_g=100, calories=kcal, protein=p, carbohydrates=c, fat=f, **extra,
    )


@pytest.fixture()
def db():
    session = TestSession()
    yield session
    session.rollback()
    session.query(Food).filter(Food.name.like(f"{PREFIX} %")).delete(synchronize_session=False)
    session.commit()
    session.close()


@pytest.fixture()
def no_internet(monkeypatch):
    calls = []
    monkeypatch.setattr(foods_router, "search_external", lambda q: calls.append(q) or [])
    return calls


def test_search_matches_word_starts_only(db, no_internet):
    db.add_all([make("Gulabi Sweet"), make("Rice, white, regular")])
    db.commit()
    names = [f.name for f in foods_router.search_foods(q=f"{PREFIX} gula", db=db)]
    assert names == [f"{PREFIX} Gulabi Sweet"]


def test_search_ranks_whole_words_first(db, no_internet):
    db.add_all([make("Dosakaya Curry"), make("Plain Dosa Long Name"), make("Egg Dosa")])
    db.commit()
    names = [f.name for f in foods_router.search_foods(q="dosa", db=db) if f.name.startswith(PREFIX)]
    assert names == [f"{PREFIX} Egg Dosa", f"{PREFIX} Plain Dosa Long Name", f"{PREFIX} Dosakaya Curry"]


def test_search_looks_online_when_few_foods_match(db, monkeypatch):
    online = [{
        "name": f"{PREFIX} Online Granola (Brand)", "category": "Rice & Grains", "source": "off",
        "source_id": "off_zzq1", "serving_size_g": 100.0, "serving_unit": "g", "serving_unit_weight_g": 100.0,
        "calories": 450.0, "protein": 10.0, "carbohydrates": 65.0, "fat": 16.0,
    }]
    monkeypatch.setattr(foods_router, "search_external", lambda q: online)
    found = foods_router.search_foods(q=f"{PREFIX} granola", db=db)
    assert [f.name for f in found] == [f"{PREFIX} Online Granola (Brand)"]
    # Saved once, not again on the next search
    foods_router.search_foods(q=f"{PREFIX} granola", db=db)
    assert db.query(Food).filter(Food.source_id == "off_zzq1").count() == 1


def test_calorie_fix_scales_every_nutrient(db, monkeypatch):
    # Values of one 40 g piece stored as per 100 g
    db.add(make("Jamun", category="Sweets & Desserts", kcal=145, p=2.5, c=24, f=4.5, sodium=20))
    db.commit()
    monkeypatch.setitem(food_catalog.CALORIE_FIXES, f"{PREFIX} Jamun", 290)
    apply_catalog_fixes(db)
    food = db.query(Food).filter(Food.name == f"{PREFIX} Jamun").one()
    assert (food.calories, food.protein, food.carbohydrates, food.fat, food.sodium) == (290, 5, 48, 9, 40)
    assert apply_catalog_fixes(db) == 0  # already right: nothing to do on the next startup


def test_old_categories_are_renamed(db):
    db.add_all([make("Pesara Dosa", category="Breakfast"), make("Odd One", category="Something Else")])
    db.commit()
    apply_catalog_fixes(db)
    got = {f.name: f.category for f in db.query(Food).filter(Food.name.like(f"{PREFIX} %"))}
    assert got == {f"{PREFIX} Pesara Dosa": "Breakfast & Tiffins", f"{PREFIX} Odd One": "Packaged & Other"}


def test_bad_online_foods_are_removed(db):
    db.add_all([
        make("Toothpaste", source="off", kcal=0, p=0, c=0, f=0),
        make("Per Serving Label", source="usda", kcal=900, p=1, c=1, f=1),
        make("Milk", source="usda", category="General", kcal=62, p=3.2, c=4.8, f=3.3),
        make("Milk", source="off", category="General", kcal=62, p=3.2, c=4.8, f=3.3),
    ])
    db.commit()
    apply_catalog_fixes(db)
    left = [(f.name, f.source, f.category) for f in db.query(Food).filter(Food.name.like(f"{PREFIX} %"))]
    assert left == [(f"{PREFIX} Milk", "usda", "Dairy")]


@pytest.mark.parametrize("name, category", [
    ("Corn Flakes Original (Kellogg's)", "Rice & Grains"),
    ("Chicken biryani", "Rice Dishes"),
    ("Sweet corn", "Vegetables"),
    ("Mango pickle", "Pickles"),
    ("Crackers, cheese", "Snacks"),
    ("Peanut butter, smooth", "Nuts & Seeds"),
    ("Toothpaste", "Packaged & Other"),
])
def test_categorize(name, category):
    assert categorize(name) == category


def test_plausible():
    assert plausible(320, 5.5, 53, 9.9)
    assert not plausible(0, 0, 0, 0)          # empty listing
    assert not plausible(1500, 10, 10, 10)    # kJ typed as kcal
    assert not plausible(145, 20, 60, 20)     # per-serving calories with per-100 g macros
