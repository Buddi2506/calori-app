from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional

from ..database import get_db
from ..models.user import User
from ..models.workout import SplitDay, SplitDayExercise, WorkoutSession, WorkoutSet
from ..schemas.workout import (
    SplitIn, WorkoutSessionCreate, WorkoutSessionUpdate, WorkoutSetIn, WorkoutSetUpdate,
)
from ..services.security import get_current_user
from ..services.workout_stats import metrics_for, records_from, estimated_1rm, working_sets
from .exercises import exercise_out, set_out, get_visible_exercise

router = APIRouter(prefix="/api/workouts", tags=["Workouts"])

MAX_RANGE_DAYS = 366


# ─── Helpers ─────────────────────────────────────────────────────────────────

def split_day_out(day: SplitDay) -> dict:
    return {
        "id": day.id,
        "name": day.name,
        "position": day.position,
        "exercises": [
            {
                "id": item.id,
                "position": item.position,
                "target_sets": item.target_sets,
                "target_reps_min": item.target_reps_min,
                "target_reps_max": item.target_reps_max,
                "exercise": exercise_out(item.exercise),
            }
            for item in day.exercises
        ],
    }


def session_out(s: WorkoutSession) -> dict:
    """A session with its sets grouped by exercise, in the order they were done."""
    groups: dict[int, dict] = {}
    for st in s.sets:
        g = groups.setdefault(st.exercise_order, {"exercise": exercise_out(st.exercise), "exercise_order": st.exercise_order, "sets": []})
        g["sets"].append(set_out(st))
    return {
        "id": s.id,
        "date": str(s.date),
        "split_day_id": s.split_day_id,
        "name": s.name,
        "notes": s.notes,
        "finished_at": s.finished_at.isoformat() if s.finished_at else None,
        "exercises": [groups[k] for k in sorted(groups)],
    }


def session_summary(s: WorkoutSession) -> dict:
    """Totals for history lists and calendars."""
    strength = [st for st in s.sets if st.exercise.kind == "strength"]
    work = working_sets(strength) if strength else []
    cardio_seconds = sum(st.duration_seconds or 0 for st in s.sets if st.exercise.kind == "cardio")
    return {
        "id": s.id,
        "date": str(s.date),
        "name": s.name,
        "split_day_id": s.split_day_id,
        "finished": s.finished_at is not None,
        "exercise_count": len({st.exercise_order for st in s.sets}),
        "working_sets": len([st for st in s.sets if st.set_type == "working"]),
        "volume_kg": round(sum((st.weight_kg or 0) * (st.reps or 0) for st in work), 1),
        "cardio_minutes": round(cardio_seconds / 60, 1),
    }


def get_own_session(db: Session, user: User, session_id: int) -> WorkoutSession:
    s = db.query(WorkoutSession).filter(WorkoutSession.id == session_id, WorkoutSession.user_id == user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Workout not found")
    return s


def user_split(db: Session, user: User) -> list[SplitDay]:
    return db.query(SplitDay).filter(SplitDay.user_id == user.id).order_by(SplitDay.position, SplitDay.id).all()


def clean_set_values(kind: str, values: dict) -> dict:
    """Keep only the fields that make sense for the exercise kind, and require the essential one."""
    if kind == "cardio":
        if not values.get("duration_seconds"):
            raise HTTPException(status_code=422, detail="Cardio needs a time (duration_seconds)")
        return {**values, "weight_kg": None, "reps": None}
    if kind == "timed":
        if not values.get("duration_seconds"):
            raise HTTPException(status_code=422, detail="Timed exercises need a time (duration_seconds)")
        return {**values, "reps": None, "distance_km": None, "level": None}
    if not values.get("reps"):
        raise HTTPException(status_code=422, detail="Strength sets need reps")
    return {**values, "duration_seconds": None, "distance_km": None, "level": None}


def new_records(db: Session, user: User, st: WorkoutSet) -> list[str]:
    """Which personal records this strength set beats, compared with earlier sessions."""
    if st.exercise.kind != "strength" or st.set_type != "working" or not st.reps:
        return []
    earlier = (
        db.query(WorkoutSet)
        .join(WorkoutSession, WorkoutSet.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.user_id == user.id,
            WorkoutSet.exercise_id == st.exercise_id,
            WorkoutSet.set_type == "working",
            WorkoutSet.session_id != st.session_id,
            WorkoutSession.date <= st.session.date,
        )
        .all()
    )
    if not earlier:
        return []  # the first time isn't a record yet
    records = []
    if (st.weight_kg or 0) > max((s.weight_kg or 0) for s in earlier):
        records.append("weight")
    this_e1rm = estimated_1rm(st.weight_kg, st.reps)
    best_e1rm = max((estimated_1rm(s.weight_kg, s.reps) or 0) for s in earlier)
    if this_e1rm and this_e1rm > best_e1rm:
        records.append("est_1rm")
    bodyweight_reps = [s.reps or 0 for s in earlier if not s.weight_kg]
    if not st.weight_kg and bodyweight_reps and st.reps > max(bodyweight_reps):
        records.append("reps")
    return records


def renumber_sets(session: WorkoutSession, exercise_order: int) -> None:
    for i, st in enumerate(sorted((s for s in session.sets if s.exercise_order == exercise_order), key=lambda s: s.set_number), start=1):
        st.set_number = i


# ─── Split ───────────────────────────────────────────────────────────────────

@router.get("/split")
def get_split(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return [split_day_out(d) for d in user_split(db, current_user)]


@router.put("/split")
def save_split(data: SplitIn, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Replace the whole split. Days sent with an id are kept (so past workouts stay linked)."""
    existing = {d.id: d for d in user_split(db, current_user)}
    unknown = [d.id for d in data.days if d.id is not None and d.id not in existing]
    if unknown:
        raise HTTPException(status_code=404, detail=f"Split day(s) not found: {unknown}")
    names = [d.name.strip().lower() for d in data.days]
    if len(names) != len(set(names)):
        raise HTTPException(status_code=422, detail="Each split day needs a different name")
    for d in data.days:
        for item in d.exercises:
            get_visible_exercise(db, current_user, item.exercise_id)
            if item.target_reps_min and item.target_reps_max and item.target_reps_min > item.target_reps_max:
                raise HTTPException(status_code=422, detail="Rep range minimum is above the maximum")

    kept = {d.id for d in data.days if d.id is not None}
    for day_id, day in existing.items():
        if day_id not in kept:
            db.delete(day)  # sessions keep their name; their split_day_id becomes NULL

    for position, d in enumerate(data.days):
        day = existing.get(d.id) if d.id else None
        if day is None:
            day = SplitDay(user_id=current_user.id)
            db.add(day)
        day.name = d.name.strip()
        day.position = position
        day.exercises = [
            SplitDayExercise(
                exercise_id=item.exercise_id,
                position=i,
                target_sets=item.target_sets,
                target_reps_min=item.target_reps_min,
                target_reps_max=item.target_reps_max,
            )
            for i, item in enumerate(d.exercises)
        ]
    db.commit()
    return [split_day_out(d) for d in user_split(db, current_user)]


# ─── Today and history ───────────────────────────────────────────────────────

@router.get("/today")
def today(
    on: Optional[date] = Query(None, alias="date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The split day to do on a date (next in rotation after the last one done) and that date's workouts."""
    target = on or date.today()
    days = user_split(db, current_user)
    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == current_user.id, WorkoutSession.date == target)
        .order_by(WorkoutSession.id)
        .all()
    )

    suggested = None
    if days:
        last = (
            db.query(WorkoutSession)
            .filter(
                WorkoutSession.user_id == current_user.id,
                WorkoutSession.split_day_id.isnot(None),
                WorkoutSession.date <= target,
            )
            .order_by(WorkoutSession.date.desc(), WorkoutSession.id.desc())
            .first()
        )
        ids = [d.id for d in days]
        if last is None or last.split_day_id not in ids:
            suggested = days[0]
        elif last.date == target:
            suggested = days[ids.index(last.split_day_id)]  # already training this day today
        else:
            suggested = days[(ids.index(last.split_day_id) + 1) % len(days)]

    return {
        "date": str(target),
        "suggested_day": split_day_out(suggested) if suggested else None,
        "sessions": [session_out(s) for s in sessions],
    }


@router.get("")
def list_workouts(
    start: date,
    end: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if end < start:
        raise HTTPException(status_code=422, detail="end must be on or after start")
    if (end - start).days > MAX_RANGE_DAYS:
        raise HTTPException(status_code=422, detail=f"Range can be at most {MAX_RANGE_DAYS} days")
    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == current_user.id, WorkoutSession.date >= start, WorkoutSession.date <= end)
        .order_by(WorkoutSession.date, WorkoutSession.id)
        .all()
    )
    return [session_summary(s) for s in sessions]


# ─── Progress ────────────────────────────────────────────────────────────────
# Declared before "/{session_id}" so "progress" isn't parsed as an id.

@router.get("/progress/exercise/{exercise_id}")
def exercise_progress(
    exercise_id: int,
    days: int = 365,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """One point per session the exercise was done in, plus personal records."""
    ex = get_visible_exercise(db, current_user, exercise_id)
    since = date.today() - timedelta(days=max(1, min(days, 3650)))
    rows = (
        db.query(WorkoutSet, WorkoutSession)
        .join(WorkoutSession, WorkoutSet.session_id == WorkoutSession.id)
        .filter(WorkoutSession.user_id == current_user.id, WorkoutSet.exercise_id == ex.id, WorkoutSession.date >= since)
        .order_by(WorkoutSession.date, WorkoutSession.id, WorkoutSet.set_number)
        .all()
    )
    by_session: dict[int, dict] = {}
    for st, sess in rows:
        by_session.setdefault(sess.id, {"date": sess.date, "sets": []})["sets"].append(st)

    points = []
    for session_id, g in by_session.items():
        m = metrics_for(ex.kind, g["sets"])
        if m:
            points.append({"date": str(g["date"]), "session_id": session_id, **m})
    return {"exercise": exercise_out(ex), "points": points, "records": records_from(ex.kind, points)}


@router.get("/progress/summary")
def progress_summary(
    weeks: int = 8,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Week-by-week totals, workouts per split day, and working sets per muscle."""
    weeks = max(1, min(weeks, 52))
    this_monday = date.today() - timedelta(days=date.today().weekday())
    start = this_monday - timedelta(weeks=weeks - 1)
    sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.date >= start,
            WorkoutSession.date < this_monday + timedelta(weeks=1),  # ignore anything logged ahead
        )
        .all()
    )

    week_rows = {start + timedelta(weeks=i): {"week_start": str(start + timedelta(weeks=i)), "workouts": 0,
                                               "working_sets": 0, "volume_kg": 0.0, "cardio_minutes": 0.0}
                 for i in range(weeks)}
    by_day: dict[str, int] = {}
    muscle_sets: dict[str, int] = {}
    for s in sessions:
        summary = session_summary(s)
        w = week_rows[s.date - timedelta(days=s.date.weekday())]
        w["workouts"] += 1
        w["working_sets"] += summary["working_sets"]
        w["volume_kg"] = round(w["volume_kg"] + summary["volume_kg"], 1)
        w["cardio_minutes"] = round(w["cardio_minutes"] + summary["cardio_minutes"], 1)
        by_day[s.name] = by_day.get(s.name, 0) + 1
        for st in s.sets:
            if st.set_type == "working" and st.exercise.kind != "cardio":
                for m in st.exercise.primary_muscles or []:
                    muscle_sets[m] = muscle_sets.get(m, 0) + 1

    return {
        "weeks": list(week_rows.values()),
        "by_split_day": [{"name": k, "workouts": v} for k, v in sorted(by_day.items(), key=lambda kv: -kv[1])],
        "muscle_sets": dict(sorted(muscle_sets.items(), key=lambda kv: -kv[1])),
    }


# ─── Sessions ────────────────────────────────────────────────────────────────

@router.post("", status_code=201)
def create_workout(data: WorkoutSessionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    name = (data.name or "").strip()
    if data.split_day_id is not None:
        day = db.query(SplitDay).filter(SplitDay.id == data.split_day_id, SplitDay.user_id == current_user.id).first()
        if not day:
            raise HTTPException(status_code=404, detail="Split day not found")
        name = name or day.name
    s = WorkoutSession(
        user_id=current_user.id,
        date=data.date,
        split_day_id=data.split_day_id,
        name=name or "Workout",
        notes=data.notes,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return session_out(s)


@router.get("/{session_id}")
def get_workout(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return session_out(get_own_session(db, current_user, session_id))


@router.patch("/{session_id}")
def update_workout(
    session_id: int,
    data: WorkoutSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = get_own_session(db, current_user, session_id)
    changes = data.model_dump(exclude_unset=True)
    if "finished" in changes:
        s.finished_at = datetime.utcnow() if changes.pop("finished") else None
    if "name" in changes:
        changes["name"] = changes["name"].strip()
    for k, v in changes.items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return session_out(s)


@router.delete("/{session_id}")
def delete_workout(session_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    s = get_own_session(db, current_user, session_id)
    db.delete(s)
    db.commit()
    return {"deleted": session_id}


# ─── Sets ────────────────────────────────────────────────────────────────────

@router.post("/{session_id}/sets", status_code=201)
def add_set(
    session_id: int,
    data: WorkoutSetIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = get_own_session(db, current_user, session_id)
    ex = get_visible_exercise(db, current_user, data.exercise_id)
    values = clean_set_values(ex.kind, data.model_dump(exclude={"exercise_id"}))

    # Same exercise again → next set in its group; a new exercise → goes to the end
    same = [st for st in s.sets if st.exercise_id == ex.id]
    if same:
        order = same[0].exercise_order
        number = max(st.set_number for st in same) + 1
    else:
        order = max((st.exercise_order for st in s.sets), default=-1) + 1
        number = 1

    st = WorkoutSet(session_id=s.id, exercise_id=ex.id, exercise_order=order, set_number=number, **values)
    db.add(st)
    db.commit()
    db.refresh(st)
    return {**set_out(st), "records": new_records(db, current_user, st)}


@router.patch("/{session_id}/sets/{set_id}")
def update_set(
    session_id: int,
    set_id: int,
    data: WorkoutSetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = get_own_session(db, current_user, session_id)
    st = next((x for x in s.sets if x.id == set_id), None)
    if not st:
        raise HTTPException(status_code=404, detail="Set not found")
    current = {k: getattr(st, k) for k in ("set_type", "weight_kg", "reps", "duration_seconds", "distance_km", "level")}
    merged = clean_set_values(st.exercise.kind, {**current, **data.model_dump(exclude_unset=True)})
    for k, v in merged.items():
        setattr(st, k, v)
    db.commit()
    db.refresh(st)
    return {**set_out(st), "records": new_records(db, current_user, st)}


@router.delete("/{session_id}/sets/{set_id}")
def delete_set(
    session_id: int,
    set_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    s = get_own_session(db, current_user, session_id)
    st = next((x for x in s.sets if x.id == set_id), None)
    if not st:
        raise HTTPException(status_code=404, detail="Set not found")
    order = st.exercise_order
    s.sets.remove(st)  # delete-orphan removes the row
    renumber_sets(s, order)
    db.commit()
    return {"deleted": set_id}
