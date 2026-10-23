from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_
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
        "is_rest": day.is_rest,
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


def session_out(s: WorkoutSession, records: Optional[dict[int, list[str]]] = None) -> dict:
    """A session with its sets grouped by exercise, in the order they were done.
    Each set carries the personal records it set (see record_flags)."""
    records = records or {}
    groups: dict[int, dict] = {}
    for st in s.sets:
        g = groups.setdefault(st.exercise_order, {"exercise": exercise_out(st.exercise), "exercise_order": st.exercise_order, "sets": []})
        g["sets"].append({**set_out(st), "records": records.get(st.id, [])})
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


def record_flags(db: Session, user: User, session: WorkoutSession) -> dict[int, list[str]]:
    """Personal records set in this workout, by set id.

    A working set is a record when it beats every earlier working set of that exercise:
    those in earlier workouts and those logged before it in this one. The very first
    time an exercise is done sets no records.
    """
    by_exercise: dict[int, list[WorkoutSet]] = {}
    for st in session.sets:
        if st.set_type == "working" and st.exercise.kind in ("strength", "timed"):
            by_exercise.setdefault(st.exercise_id, []).append(st)
    if not by_exercise:
        return {}

    prior = (
        db.query(WorkoutSet)
        .join(WorkoutSession, WorkoutSet.session_id == WorkoutSession.id)
        .filter(
            WorkoutSession.user_id == user.id,
            WorkoutSet.exercise_id.in_(by_exercise.keys()),
            WorkoutSet.set_type == "working",
            or_(
                WorkoutSession.date < session.date,
                and_(WorkoutSession.date == session.date, WorkoutSession.id < session.id),
            ),
        )
        .all()
    )
    prior_by_exercise: dict[int, list[WorkoutSet]] = {}
    for st in prior:
        prior_by_exercise.setdefault(st.exercise_id, []).append(st)

    flags: dict[int, list[str]] = {}
    for exercise_id, sets in by_exercise.items():
        before = prior_by_exercise.get(exercise_id)
        if not before:
            continue
        best_weight = max((x.weight_kg or 0) for x in before)
        best_e1rm = max((estimated_1rm(x.weight_kg, x.reps) or 0) for x in before)
        bodyweight = [x.reps or 0 for x in before if not x.weight_kg]
        best_bw_reps = max(bodyweight) if bodyweight else None
        best_hold = max((x.duration_seconds or 0) for x in before)
        for st in sorted(sets, key=lambda x: x.id):
            found = []
            if st.exercise.kind == "timed":
                if (st.duration_seconds or 0) > best_hold:
                    found.append("hold")
                best_hold = max(best_hold, st.duration_seconds or 0)
            elif st.reps:
                if (st.weight_kg or 0) > best_weight:
                    found.append("weight")
                e1rm = estimated_1rm(st.weight_kg, st.reps)
                if e1rm and e1rm > best_e1rm:
                    found.append("est_1rm")
                if not st.weight_kg and best_bw_reps is not None and st.reps > best_bw_reps:
                    found.append("reps")
                best_weight = max(best_weight, st.weight_kg or 0)
                best_e1rm = max(best_e1rm, e1rm or 0)
                if not st.weight_kg:
                    best_bw_reps = max(best_bw_reps or 0, st.reps)
            if found:
                flags[st.id] = found
    return flags


def renumber_sets(session: WorkoutSession, exercise_order: int) -> None:
    for i, st in enumerate(sorted((s for s in session.sets if s.exercise_order == exercise_order), key=lambda s: s.set_number), start=1):
        st.set_number = i


def next_training_index(days: list[SplitDay], after: int) -> int:
    """Index of the first training (non-rest) day after position `after`, wrapping round."""
    for step in range(1, len(days) + 1):
        i = (after + step) % len(days)
        if not days[i].is_rest:
            return i
    return (after + 1) % len(days)


def rotation_index(days: list[SplitDay], last_index: int, last_date: date, target: date) -> int:
    """Which split day comes up on `target`, given the last day trained.

    The day after a workout moves to the next day in the rotation. Rest days are used up
    by calendar days passing; a training day waits until it's actually done, so a missed
    gym day doesn't skip it.
    """
    pos = (last_index + 1) % len(days)
    day = last_date + timedelta(days=1)
    steps = 0
    while day < target and days[pos].is_rest and steps < len(days):
        pos = (pos + 1) % len(days)
        day += timedelta(days=1)
        steps += 1
    return pos


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
    names = [d.name.strip().lower() for d in data.days if not d.is_rest]
    if len(names) != len(set(names)):
        raise HTTPException(status_code=422, detail="Each split day needs a different name")
    if data.days and all(d.is_rest for d in data.days):
        raise HTTPException(status_code=422, detail="A split needs at least one training day")
    for d in data.days:
        if d.is_rest:
            continue
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
        day.is_rest = d.is_rest
        day.exercises = [] if d.is_rest else [
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

    suggested = next_training = None
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
            pos = next_training_index(days, len(days) - 1)  # nothing done yet: first training day
        elif last.date == target:
            pos = ids.index(last.split_day_id)  # already training this day today
        else:
            pos = rotation_index(days, ids.index(last.split_day_id), last.date, target)
        suggested = days[pos]
        if suggested.is_rest:
            next_training = days[next_training_index(days, pos)]

    return {
        "date": str(target),
        "suggested_day": split_day_out(suggested) if suggested else None,
        # on a rest day, the training day that comes after it
        "next_training_day": split_day_out(next_training) if next_training else None,
        "sessions": [session_out(s, record_flags(db, current_user, s)) for s in sessions],
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

@router.get("/progress/exercises")
def exercises_done(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Every exercise the user has logged, most recent first, with its personal records."""
    rows = (
        db.query(WorkoutSet, WorkoutSession)
        .join(WorkoutSession, WorkoutSet.session_id == WorkoutSession.id)
        .filter(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.date, WorkoutSession.id, WorkoutSet.set_number)
        .all()
    )
    by_exercise: dict[int, dict] = {}
    for st, sess in rows:
        e = by_exercise.setdefault(st.exercise_id, {"exercise": st.exercise, "sessions": {}})
        e["sessions"].setdefault(sess.id, {"date": sess.date, "sets": []})["sets"].append(st)

    result = []
    for e in by_exercise.values():
        ex = e["exercise"]
        points = []
        for g in e["sessions"].values():
            m = metrics_for(ex.kind, g["sets"])
            if m:
                points.append({"date": str(g["date"]), **m})
        result.append({
            "exercise": exercise_out(ex),
            "workouts": len(e["sessions"]),
            "last_date": str(max(g["date"] for g in e["sessions"].values())),
            "last": points[-1] if points else None,
            "records": records_from(ex.kind, points),
        })
    result.sort(key=lambda r: (r["last_date"], r["workouts"]), reverse=True)
    return result


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
        if day.is_rest:
            raise HTTPException(status_code=422, detail="That's a rest day; pick a training day or log cardio")
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
    s = get_own_session(db, current_user, session_id)
    return session_out(s, record_flags(db, current_user, s))


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
    return session_out(s, record_flags(db, current_user, s))


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
    return {**set_out(st), "records": record_flags(db, current_user, s).get(st.id, [])}


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
    return {**set_out(st), "records": record_flags(db, current_user, s).get(st.id, [])}


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
