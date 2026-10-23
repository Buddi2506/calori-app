"""Workout tracking API tests.

They run against a separate database, never the real one. One-time setup:

    docker exec calori_db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE DATABASE calori_test"'
    docker exec calori_backend sh -c 'cd /app && DATABASE_URL=${DATABASE_URL%/*}/calori_test alembic upgrade head'
    docker exec calori_backend pip install --target /tmp/pytest-lib -r /app/requirements-dev.txt

Then run:

    docker exec calori_backend sh -c 'cd /app && PYTHONPATH=/tmp/pytest-lib:/app TEST_DATABASE_URL=${DATABASE_URL%/*}/calori_test python -m pytest tests -q -p no:cacheprovider'
"""
import os
from datetime import date, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL")
if not TEST_DATABASE_URL or TEST_DATABASE_URL == os.environ.get("DATABASE_URL"):
    pytest.skip("Set TEST_DATABASE_URL to a separate test database", allow_module_level=True)

from app.main import app, seed_exercises  # noqa: E402
from app.database import get_db  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.security import get_current_user  # noqa: E402

engine = create_engine(TEST_DATABASE_URL)
TestSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

TODAY = date.today()
YESTERDAY = TODAY - timedelta(days=1)


def _override_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="module", autouse=True)
def test_data():
    with engine.begin() as conn:
        conn.execute(text(
            "TRUNCATE workout_sets, workout_sessions, split_day_exercises, split_days, exercises, users "
            "RESTART IDENTITY CASCADE"
        ))
    db = TestSession()
    alice = User(username="alice", email="alice@test.local", full_name="Alice", hashed_password="x", role="member")
    bob = User(username="bob", email="bob@test.local", full_name="Bob", hashed_password="x", role="member")
    db.add_all([alice, bob])
    db.commit()
    seed_exercises(db)
    ids = {"alice": alice.id, "bob": bob.id}
    db.close()
    app.dependency_overrides[get_db] = _override_db
    yield ids
    app.dependency_overrides.clear()


def client_for(username):
    def current_user():
        db = TestSession()
        try:
            return db.query(User).filter(User.username == username).one()
        finally:
            db.close()
    app.dependency_overrides[get_current_user] = current_user
    return TestClient(app)  # not used as a context manager, so app startup (migrations, seeding) doesn't run


def exercise_id(c, name):
    found = [e for e in c.get("/api/exercises", params={"q": name}).json() if e["name"] == name]
    assert found, name
    return found[0]["id"]


# ─── Exercises ───────────────────────────────────────────────────────────────

def test_builtin_exercises_and_filters():
    c = client_for("alice")
    all_ex = c.get("/api/exercises").json()
    assert len(all_ex) == 84
    assert all(not e["is_custom"] for e in all_ex)
    assert len(c.get("/api/exercises", params={"kind": "cardio"}).json()) == 11
    lats = [e["name"] for e in c.get("/api/exercises", params={"muscle": "lats"}).json()]
    assert "Lat Pulldown (Wide Grip)" in lats and "Barbell Bench Press" not in lats
    assert "abdominals" in c.get("/api/exercises/options").json()["muscles"]


def test_custom_exercises_are_private_and_validated():
    alice, bob = client_for("alice"), None
    r = alice.post("/api/exercises", json={
        "name": "Landmine Press", "kind": "strength", "category": "push",
        "equipment": "barbell", "primary_muscles": ["shoulders"], "secondary_muscles": ["chest"],
    })
    assert r.status_code == 201 and r.json()["is_custom"] is True
    custom_id = r.json()["id"]

    assert alice.post("/api/exercises", json={"name": "landmine press", "category": "push"}).status_code == 409
    assert alice.post("/api/exercises", json={"name": "Lat Pulldown (Wide Grip)", "category": "pull"}).status_code == 409
    assert alice.post("/api/exercises", json={"name": "X", "category": "push", "primary_muscles": ["pecs"]}).status_code == 422
    assert alice.post("/api/exercises", json={"name": "Y", "category": "arms"}).status_code == 422

    builtin = exercise_id(alice, "Barbell Bench Press")
    assert alice.patch(f"/api/exercises/{builtin}", json={"name": "Bench"}).status_code == 403
    assert alice.patch(f"/api/exercises/{custom_id}", json={"equipment": "landmine"}).json()["equipment"] == "landmine"

    bob = client_for("bob")
    assert bob.get(f"/api/exercises/{custom_id}").status_code == 404
    assert all(e["id"] != custom_id for e in bob.get("/api/exercises").json())


# ─── Split and today's suggestion ────────────────────────────────────────────

def test_split_save_and_rotation():
    c = client_for("alice")
    bench, pulldown, squat = (exercise_id(c, n) for n in ("Barbell Bench Press", "Lat Pulldown (Wide Grip)", "Barbell Back Squat"))
    days = c.put("/api/workouts/split", json={"days": [
        {"name": "Push", "exercises": [{"exercise_id": bench, "target_sets": 3, "target_reps_min": 8, "target_reps_max": 12}]},
        {"name": "Pull", "exercises": [{"exercise_id": pulldown, "target_sets": 3}]},
        {"name": "Legs", "exercises": [{"exercise_id": squat}]},
    ]}).json()
    assert [d["name"] for d in days] == ["Push", "Pull", "Legs"]
    assert days[0]["exercises"][0]["exercise"]["name"] == "Barbell Bench Press"
    push, pull, legs = (d["id"] for d in days)

    assert c.put("/api/workouts/split", json={"days": [{"name": "Push"}, {"name": "push"}]}).status_code == 422
    assert c.put("/api/workouts/split", json={"days": [{"name": "Push", "exercises": [
        {"exercise_id": bench, "target_reps_min": 12, "target_reps_max": 8}]}]}).status_code == 422
    assert client_for("bob").get("/api/workouts/split").json() == []

    c = client_for("alice")
    assert c.get("/api/workouts/today").json()["suggested_day"]["name"] == "Push"

    # Pushed yesterday → Pull today; once Pull is started today it stays Pull
    c.post("/api/workouts", json={"date": str(YESTERDAY), "split_day_id": push})
    assert c.get("/api/workouts/today").json()["suggested_day"]["name"] == "Pull"
    started = c.post("/api/workouts", json={"date": str(TODAY), "split_day_id": pull}).json()
    assert started["name"] == "Pull"
    today = c.get("/api/workouts/today", params={"date": str(TODAY)}).json()
    assert today["suggested_day"]["name"] == "Pull" and len(today["sessions"]) == 1
    # Tomorrow's suggestion follows on to Legs, and after Legs it wraps back to Push
    assert c.get("/api/workouts/today", params={"date": str(TODAY + timedelta(days=1))}).json()["suggested_day"]["name"] == "Legs"
    legs_session = c.post("/api/workouts", json={"date": str(TODAY + timedelta(days=1)), "split_day_id": legs}).json()
    assert c.get("/api/workouts/today", params={"date": str(TODAY + timedelta(days=2))}).json()["suggested_day"]["name"] == "Push"
    c.delete(f"/api/workouts/{legs_session['id']}")

    # Renaming keeps the day id; dropping Legs keeps old sessions, unlinked
    saved = c.put("/api/workouts/split", json={"days": [
        {"id": push, "name": "Push A", "exercises": [{"exercise_id": bench}]},
        {"id": pull, "name": "Pull", "exercises": [{"exercise_id": pulldown}]},
    ]}).json()
    assert [(d["id"], d["name"]) for d in saved] == [(push, "Push A"), (pull, "Pull")]
    assert c.get(f"/api/workouts/{started['id']}").json()["split_day_id"] == pull


# ─── Sessions and sets ───────────────────────────────────────────────────────

def test_sets_order_validation_and_ownership():
    c = client_for("alice")
    s = c.post("/api/workouts", json={"date": str(TODAY - timedelta(days=10)), "name": "Upper"}).json()
    sid = s["id"]
    assert s["name"] == "Upper" and s["split_day_id"] is None
    bench, curl, plank, run = (exercise_id(c, n) for n in ("Barbell Bench Press", "Barbell Curl", "Plank", "Treadmill Run"))

    a = c.post(f"/api/workouts/{sid}/sets", json={"exercise_id": bench, "weight_kg": 60, "reps": 10, "set_type": "warmup"}).json()
    b = c.post(f"/api/workouts/{sid}/sets", json={"exercise_id": bench, "weight_kg": 80, "reps": 8}).json()
    d = c.post(f"/api/workouts/{sid}/sets", json={"exercise_id": curl, "weight_kg": 30, "reps": 12}).json()
    e = c.post(f"/api/workouts/{sid}/sets", json={"exercise_id": bench, "weight_kg": 80, "reps": 7}).json()
    assert [(x["exercise_order"], x["set_number"]) for x in (a, b, d, e)] == [(0, 1), (0, 2), (1, 1), (0, 3)]

    # Each kind needs its own measurement, and unrelated fields are dropped
    assert c.post(f"/api/workouts/{sid}/sets", json={"exercise_id": bench, "weight_kg": 80}).status_code == 422
    assert c.post(f"/api/workouts/{sid}/sets", json={"exercise_id": run, "distance_km": 3}).status_code == 422
    cardio = c.post(f"/api/workouts/{sid}/sets", json={
        "exercise_id": run, "duration_seconds": 1200, "distance_km": 3.2, "level": 9.5, "weight_kg": 20, "reps": 5,
    }).json()
    assert cardio["weight_kg"] is None and cardio["reps"] is None and cardio["distance_km"] == 3.2
    hold = c.post(f"/api/workouts/{sid}/sets", json={"exercise_id": plank, "duration_seconds": 60, "reps": 3}).json()
    assert hold["duration_seconds"] == 60 and hold["reps"] is None
    assert c.post(f"/api/workouts/{sid}/sets", json={"exercise_id": bench, "reps": 5, "set_type": "drop"}).status_code == 422

    # Deleting a set renumbers the rest of that exercise
    c.delete(f"/api/workouts/{sid}/sets/{b['id']}")
    bench_sets = c.get(f"/api/workouts/{sid}").json()["exercises"][0]["sets"]
    assert [(x["set_number"], x["reps"]) for x in bench_sets] == [(1, 10), (2, 7)]

    # Editing re-checks the kind's rules
    assert c.patch(f"/api/workouts/{sid}/sets/{e['id']}", json={"reps": 0}).status_code == 422
    assert c.patch(f"/api/workouts/{sid}/sets/{e['id']}", json={"weight_kg": 82.5}).json()["weight_kg"] == 82.5

    finished = c.patch(f"/api/workouts/{sid}", json={"finished": True, "notes": "Felt strong"}).json()
    assert finished["finished_at"] and finished["notes"] == "Felt strong"

    bob = client_for("bob")
    assert bob.get(f"/api/workouts/{sid}").status_code == 404
    assert bob.post(f"/api/workouts/{sid}/sets", json={"exercise_id": bench, "reps": 5}).status_code == 404
    assert bob.delete(f"/api/workouts/{sid}").status_code == 404


def test_records_progress_and_last_sets():
    c = client_for("alice")
    squat = exercise_id(c, "Barbell Back Squat")
    first = c.post("/api/workouts", json={"date": str(TODAY - timedelta(days=7)), "name": "Legs"}).json()
    r1 = c.post(f"/api/workouts/{first['id']}/sets", json={"exercise_id": squat, "weight_kg": 100, "reps": 5}).json()
    assert r1["records"] == []  # nothing to beat yet
    c.post(f"/api/workouts/{first['id']}/sets", json={"exercise_id": squat, "weight_kg": 100, "reps": 5})

    second = c.post("/api/workouts", json={"date": str(TODAY - timedelta(days=3)), "name": "Legs"}).json()
    r2 = c.post(f"/api/workouts/{second['id']}/sets", json={"exercise_id": squat, "weight_kg": 105, "reps": 3}).json()
    assert r2["records"] == ["weight"]  # heavier, but 105×3 (115.5) doesn't beat 100×5 (116.7)
    r3 = c.post(f"/api/workouts/{second['id']}/sets", json={"exercise_id": squat, "weight_kg": 100, "reps": 7}).json()
    assert r3["records"] == ["est_1rm"]

    p = c.get(f"/api/workouts/progress/exercise/{squat}").json()
    assert [pt["date"] for pt in p["points"]] == [str(TODAY - timedelta(days=7)), str(TODAY - timedelta(days=3))]
    assert p["points"][0]["est_1rm_kg"] == 116.7 and p["points"][0]["volume_kg"] == 1000
    assert p["records"]["heaviest_kg"] == {"value": 105, "date": str(TODAY - timedelta(days=3))}
    assert p["records"]["best_est_1rm_kg"]["value"] == 123.3

    last = c.get("/api/exercises/last-sets", params={"ids": f"{squat},999999"}).json()
    assert list(last) == [str(squat)] and last[str(squat)]["session_id"] == second["id"]
    assert [s["weight_kg"] for s in last[str(squat)]["sets"]] == [105, 100]


def test_cardio_progress_history_and_summary():
    c = client_for("alice")
    run = exercise_id(c, "Outdoor Run")
    s = c.post("/api/workouts", json={"date": str(TODAY - timedelta(days=2)), "name": "Cardio"}).json()
    c.post(f"/api/workouts/{s['id']}/sets", json={"exercise_id": run, "duration_seconds": 1800, "distance_km": 5})
    p = c.get(f"/api/workouts/progress/exercise/{run}").json()
    assert p["points"][-1]["pace_min_per_km"] == 6.0 and p["records"]["longest_distance_km"]["value"] == 5

    history = c.get("/api/workouts", params={"start": str(TODAY - timedelta(days=30)), "end": str(TODAY)}).json()
    cardio_day = next(h for h in history if h["id"] == s["id"])
    assert cardio_day["cardio_minutes"] == 30 and cardio_day["working_sets"] == 1
    assert c.get("/api/workouts", params={"start": str(TODAY), "end": str(YESTERDAY)}).status_code == 422
    assert c.get("/api/workouts", params={"start": "2020-01-01", "end": str(TODAY)}).status_code == 422

    summary = c.get("/api/workouts/progress/summary", params={"weeks": 4}).json()
    assert len(summary["weeks"]) == 4
    assert sum(w["workouts"] for w in summary["weeks"]) >= 4
    assert summary["muscle_sets"]["quadriceps"] >= 4  # squat sets count; cardio doesn't


def test_exercise_in_use_cannot_be_deleted():
    c = client_for("alice")
    ex = c.post("/api/exercises", json={"name": "Sled Push", "category": "legs", "primary_muscles": ["quadriceps"]}).json()
    unused = c.post("/api/exercises", json={"name": "Temp Exercise", "category": "core"}).json()
    s = c.post("/api/workouts", json={"date": str(TODAY), "name": "Extra"}).json()
    c.post(f"/api/workouts/{s['id']}/sets", json={"exercise_id": ex["id"], "weight_kg": 40, "reps": 10})
    assert c.delete(f"/api/exercises/{ex['id']}").status_code == 409
    assert c.delete(f"/api/exercises/{unused['id']}").status_code == 200
    builtin = exercise_id(c, "Plank")
    assert c.delete(f"/api/exercises/{builtin}").status_code == 403
