from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import date as Date

from ..models.workout import MUSCLES, EXERCISE_KINDS, EXERCISE_CATEGORIES, SET_TYPES


def _check_muscles(muscles: List[str]) -> List[str]:
    unknown = [m for m in muscles if m not in MUSCLES]
    if unknown:
        raise ValueError(f"Unknown muscle(s): {', '.join(unknown)}. Use one of: {', '.join(MUSCLES)}")
    return muscles


# ─── Exercises ───────────────────────────────────────────────────────────────

class ExerciseBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    kind: str = "strength"
    category: str
    equipment: Optional[str] = None
    primary_muscles: List[str] = []
    secondary_muscles: List[str] = []
    instructions: List[str] = []

    @field_validator("kind")
    @classmethod
    def check_kind(cls, v):
        if v not in EXERCISE_KINDS:
            raise ValueError(f"kind must be one of: {', '.join(EXERCISE_KINDS)}")
        return v

    @field_validator("category")
    @classmethod
    def check_category(cls, v):
        if v not in EXERCISE_CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(EXERCISE_CATEGORIES)}")
        return v

    @field_validator("primary_muscles", "secondary_muscles")
    @classmethod
    def check_muscles(cls, v):
        return _check_muscles(v)


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    equipment: Optional[str] = None
    primary_muscles: Optional[List[str]] = None
    secondary_muscles: Optional[List[str]] = None
    instructions: Optional[List[str]] = None

    @field_validator("primary_muscles", "secondary_muscles")
    @classmethod
    def check_muscles(cls, v):
        return v if v is None else _check_muscles(v)


# ─── Split ───────────────────────────────────────────────────────────────────

class SplitDayExerciseIn(BaseModel):
    exercise_id: int
    target_sets: Optional[int] = Field(default=None, ge=1, le=20)
    target_reps_min: Optional[int] = Field(default=None, ge=1, le=100)
    target_reps_max: Optional[int] = Field(default=None, ge=1, le=100)


class SplitDayIn(BaseModel):
    id: Optional[int] = None  # keep an existing day (and its workout history link)
    name: str = Field(min_length=1, max_length=60)
    exercises: List[SplitDayExerciseIn] = []


class SplitIn(BaseModel):
    days: List[SplitDayIn] = Field(max_length=14)


# ─── Sessions and sets ───────────────────────────────────────────────────────

class WorkoutSetIn(BaseModel):
    exercise_id: int
    set_type: str = "working"
    weight_kg: Optional[float] = Field(default=None, ge=0, le=1000)
    reps: Optional[int] = Field(default=None, ge=0, le=1000)
    duration_seconds: Optional[int] = Field(default=None, ge=0, le=24 * 3600)
    distance_km: Optional[float] = Field(default=None, ge=0, le=500)
    level: Optional[float] = Field(default=None, ge=0, le=100)

    @field_validator("set_type")
    @classmethod
    def check_set_type(cls, v):
        if v not in SET_TYPES:
            raise ValueError(f"set_type must be one of: {', '.join(SET_TYPES)}")
        return v


class WorkoutSetUpdate(BaseModel):
    set_type: Optional[str] = None
    weight_kg: Optional[float] = Field(default=None, ge=0, le=1000)
    reps: Optional[int] = Field(default=None, ge=0, le=1000)
    duration_seconds: Optional[int] = Field(default=None, ge=0, le=24 * 3600)
    distance_km: Optional[float] = Field(default=None, ge=0, le=500)
    level: Optional[float] = Field(default=None, ge=0, le=100)

    @field_validator("set_type")
    @classmethod
    def check_set_type(cls, v):
        if v is not None and v not in SET_TYPES:
            raise ValueError(f"set_type must be one of: {', '.join(SET_TYPES)}")
        return v


class WorkoutSessionCreate(BaseModel):
    date: Date
    split_day_id: Optional[int] = None
    name: Optional[str] = Field(default=None, max_length=60)  # defaults to the split day's name, or "Workout"
    notes: Optional[str] = Field(default=None, max_length=2000)


class WorkoutSessionUpdate(BaseModel):
    date: Optional[Date] = None
    name: Optional[str] = Field(default=None, min_length=1, max_length=60)
    notes: Optional[str] = Field(default=None, max_length=2000)
    finished: Optional[bool] = None
