from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models.user import User
from ..models.workout import (
    Exercise, SplitDayExercise, WorkoutSession, WorkoutSet,
    MUSCLES, EXERCISE_KINDS, EXERCISE_CATEGORIES,
)
from ..schemas.workout import ExerciseCreate, ExerciseUpdate
from ..services.security import get_current_user

router = APIRouter(prefix="/api/exercises", tags=["Exercises"])


def exercise_out(ex: Exercise) -> dict:
    return {
        "id": ex.id,
        "name": ex.name,
        "kind": ex.kind,
        "category": ex.category,
        "equipment": ex.equipment,
        "primary_muscles": ex.primary_muscles or [],
        "secondary_muscles": ex.secondary_muscles or [],
        "instructions": ex.instructions or [],
        "image_urls": ex.image_urls or [],
        "is_custom": ex.user_id is not None,
    }


def set_out(s: WorkoutSet) -> dict:
    return {
        "id": s.id,
        "exercise_id": s.exercise_id,
        "exercise_order": s.exercise_order,
        "set_number": s.set_number,
        "set_type": s.set_type,
        "weight_kg": s.weight_kg,
        "reps": s.reps,
        "duration_seconds": s.duration_seconds,
        "distance_km": s.distance_km,
        "level": s.level,
    }


def visible_exercises(db: Session, user: User):
    """Built-in exercises plus the user's own."""
    return db.query(Exercise).filter(or_(Exercise.user_id.is_(None), Exercise.user_id == user.id))


def get_visible_exercise(db: Session, user: User, exercise_id: int) -> Exercise:
    ex = visible_exercises(db, user).filter(Exercise.id == exercise_id).first()
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return ex


def get_own_exercise(db: Session, user: User, exercise_id: int) -> Exercise:
    ex = get_visible_exercise(db, user, exercise_id)
    if ex.user_id is None:
        raise HTTPException(status_code=403, detail="Built-in exercises can't be changed")
    return ex


def _name_taken(db: Session, user: User, name: str, exclude_id: Optional[int] = None) -> bool:
    q = visible_exercises(db, user).filter(func.lower(Exercise.name) == name.strip().lower())
    if exclude_id:
        q = q.filter(Exercise.id != exclude_id)
    return db.query(q.exists()).scalar()


@router.get("")
def list_exercises(
    q: Optional[str] = None,
    kind: Optional[str] = None,
    category: Optional[str] = None,
    muscle: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = visible_exercises(db, current_user)
    if q and q.strip():
        query = query.filter(Exercise.name.ilike(f"%{q.strip()}%"))
    if kind:
        query = query.filter(Exercise.kind == kind)
    if category:
        query = query.filter(Exercise.category == category)
    exercises = query.order_by(Exercise.name.asc()).all()
    if muscle:
        # JSON lists; the whole list is small, so filter here rather than in SQL
        exercises = [e for e in exercises if muscle in (e.primary_muscles or []) + (e.secondary_muscles or [])]
    return [exercise_out(e) for e in exercises]


# Declared before "/{exercise_id}" so these paths aren't parsed as ids.
@router.get("/options")
def exercise_options(current_user: User = Depends(get_current_user)):
    """Allowed values for the exercise form."""
    return {"kinds": EXERCISE_KINDS, "categories": EXERCISE_CATEGORIES, "muscles": MUSCLES}


@router.get("/last-sets")
def last_sets(
    ids: str = Query(..., description="Comma-separated exercise ids"),
    exclude_session: Optional[int] = Query(None, description="Ignore this workout, e.g. the one being logged now"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """For each exercise, the sets from the most recent session it was done in (used to prefill)."""
    try:
        wanted = [int(i) for i in ids.split(",") if i.strip()][:50]
    except ValueError:
        raise HTTPException(status_code=422, detail="ids must be comma-separated numbers")

    result = {}
    for exercise_id in wanted:
        query = (
            db.query(WorkoutSession)
            .join(WorkoutSet, WorkoutSet.session_id == WorkoutSession.id)
            .filter(WorkoutSession.user_id == current_user.id, WorkoutSet.exercise_id == exercise_id)
        )
        if exclude_session:
            query = query.filter(WorkoutSession.id != exclude_session)
        latest = query.order_by(WorkoutSession.date.desc(), WorkoutSession.id.desc()).first()
        if latest:
            result[str(exercise_id)] = {
                "date": str(latest.date),
                "session_id": latest.id,
                "sets": [set_out(s) for s in latest.sets if s.exercise_id == exercise_id],
            }
    return result


@router.get("/{exercise_id}")
def get_exercise(exercise_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return exercise_out(get_visible_exercise(db, current_user, exercise_id))


@router.post("", status_code=201)
def create_exercise(data: ExerciseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if _name_taken(db, current_user, data.name):
        raise HTTPException(status_code=409, detail=f"An exercise named '{data.name.strip()}' already exists")
    ex = Exercise(user_id=current_user.id, **{**data.model_dump(), "name": data.name.strip()}, image_urls=[])
    db.add(ex)
    db.commit()
    db.refresh(ex)
    return exercise_out(ex)


@router.patch("/{exercise_id}")
def update_exercise(
    exercise_id: int,
    data: ExerciseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ex = get_own_exercise(db, current_user, exercise_id)
    changes = data.model_dump(exclude_unset=True)
    if "name" in changes:
        changes["name"] = changes["name"].strip()
        if _name_taken(db, current_user, changes["name"], exclude_id=ex.id):
            raise HTTPException(status_code=409, detail=f"An exercise named '{changes['name']}' already exists")
    for k, v in changes.items():
        setattr(ex, k, v)
    db.commit()
    db.refresh(ex)
    return exercise_out(ex)


@router.delete("/{exercise_id}")
def delete_exercise(exercise_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ex = get_own_exercise(db, current_user, exercise_id)
    in_sets = db.query(WorkoutSet.id).filter(WorkoutSet.exercise_id == ex.id).first()
    in_split = db.query(SplitDayExercise.id).filter(SplitDayExercise.exercise_id == ex.id).first()
    if in_sets or in_split:
        raise HTTPException(
            status_code=409,
            detail="This exercise is used in your workouts or split, so it can't be deleted",
        )
    db.delete(ex)
    db.commit()
    return {"deleted": exercise_id}
