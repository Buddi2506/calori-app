from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, JSON, Boolean, false
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

# Muscle names follow the free-exercise-db vocabulary so its pictures can be matched later.
MUSCLES = [
    "chest", "lats", "middle back", "lower back", "traps", "shoulders", "biceps", "triceps",
    "forearms", "abdominals", "quadriceps", "hamstrings", "glutes", "calves", "abductors",
    "adductors", "neck",
]
# strength: weight × reps · timed: holds like planks (seconds, optional weight) · cardio: time, distance, level
EXERCISE_KINDS = ["strength", "timed", "cardio"]
# Rough split each exercise belongs to; used to suggest exercises when building a split.
EXERCISE_CATEGORIES = ["push", "pull", "legs", "core", "cardio"]
SET_TYPES = ["working", "warmup"]


class Exercise(Base):
    """A strength or cardio exercise. Built-in ones have no user_id."""
    __tablename__ = "exercises"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String, nullable=False, index=True)
    kind = Column(String, nullable=False, default="strength")
    category = Column(String, nullable=False)
    equipment = Column(String, nullable=True)
    primary_muscles = Column(JSON, nullable=False, default=list)
    secondary_muscles = Column(JSON, nullable=False, default=list)
    instructions = Column(JSON, nullable=False, default=list)  # list of short steps
    image_urls = Column(JSON, nullable=False, default=list)  # start / end position pictures
    created_at = Column(DateTime, default=datetime.utcnow)


class SplitDay(Base):
    """One day of a user's workout split, e.g. Push, Pull, Legs, or a rest day in the rotation."""
    __tablename__ = "split_days"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    position = Column(Integer, nullable=False, default=0)
    is_rest = Column(Boolean, nullable=False, default=False, server_default=false())
    created_at = Column(DateTime, default=datetime.utcnow)

    exercises = relationship(
        "SplitDayExercise", back_populates="split_day",
        cascade="all, delete-orphan", order_by="SplitDayExercise.position",
    )


class SplitDayExercise(Base):
    """An exercise planned for a split day, with its target sets and reps."""
    __tablename__ = "split_day_exercises"
    id = Column(Integer, primary_key=True, index=True)
    split_day_id = Column(Integer, ForeignKey("split_days.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False, index=True)
    position = Column(Integer, nullable=False, default=0)
    target_sets = Column(Integer, nullable=True)
    target_reps_min = Column(Integer, nullable=True)
    target_reps_max = Column(Integer, nullable=True)

    split_day = relationship("SplitDay", back_populates="exercises")
    exercise = relationship("Exercise")


class WorkoutSession(Base):
    """One workout on one day. `name` keeps the split day's name even if that day is later deleted."""
    __tablename__ = "workout_sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    split_day_id = Column(Integer, ForeignKey("split_days.id", ondelete="SET NULL"), nullable=True, index=True)
    name = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    sets = relationship(
        "WorkoutSet", back_populates="session",
        cascade="all, delete-orphan", order_by="[WorkoutSet.exercise_order, WorkoutSet.set_number]",
    )


class WorkoutSet(Base):
    """One logged set. Strength sets use weight_kg and reps; cardio uses duration, distance and level."""
    __tablename__ = "workout_sets"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False, index=True)
    exercise_order = Column(Integer, nullable=False, default=0)  # position of the exercise in the session
    set_number = Column(Integer, nullable=False, default=1)
    set_type = Column(String, nullable=False, default="working")
    weight_kg = Column(Float, nullable=True)
    reps = Column(Integer, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    distance_km = Column(Float, nullable=True)
    level = Column(Float, nullable=True)  # machine level, speed or incline
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("WorkoutSession", back_populates="sets")
    exercise = relationship("Exercise")
