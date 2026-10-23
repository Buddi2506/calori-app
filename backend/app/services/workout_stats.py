"""Numbers for workout progress: estimated max, volume, pace and personal records."""
from typing import Iterable, Optional

# Epley's estimate gets unreliable past ~15 reps, so higher-rep sets don't count toward it.
E1RM_MAX_REPS = 15


def estimated_1rm(weight_kg: Optional[float], reps: Optional[int]) -> Optional[float]:
    """Epley: weight × (1 + reps / 30). One rep is the weight itself."""
    if not weight_kg or not reps or reps > E1RM_MAX_REPS:
        return None
    if reps == 1:
        return round(weight_kg, 1)
    return round(weight_kg * (1 + reps / 30), 1)


def working_sets(sets: Iterable) -> list:
    """Working sets, or every set if all of them were marked warm-up."""
    sets = list(sets)
    working = [s for s in sets if s.set_type == "working"]
    return working or sets


def strength_metrics(sets: Iterable) -> dict:
    """Best set, estimated max, volume and reps for one exercise in one session."""
    sets = working_sets(sets)
    with_reps = [s for s in sets if s.reps]
    if not with_reps:
        return {}
    top = max(with_reps, key=lambda s: ((s.weight_kg or 0), s.reps))
    e1rms = [v for v in (estimated_1rm(s.weight_kg, s.reps) for s in with_reps) if v]
    return {
        "top_weight_kg": top.weight_kg or 0,
        "top_reps": top.reps,
        "est_1rm_kg": max(e1rms) if e1rms else None,
        "volume_kg": round(sum((s.weight_kg or 0) * s.reps for s in with_reps), 1),
        "total_reps": sum(s.reps for s in with_reps),
        "max_reps": max(s.reps for s in with_reps),
        "sets": len(with_reps),
    }


def timed_metrics(sets: Iterable) -> dict:
    sets = [s for s in working_sets(sets) if s.duration_seconds]
    if not sets:
        return {}
    return {
        "best_seconds": max(s.duration_seconds for s in sets),
        "total_seconds": sum(s.duration_seconds for s in sets),
        "sets": len(sets),
    }


def cardio_metrics(sets: Iterable) -> dict:
    sets = [s for s in sets if s.duration_seconds]
    if not sets:
        return {}
    seconds = sum(s.duration_seconds for s in sets)
    distance = sum(s.distance_km or 0 for s in sets)
    levels = [s.level for s in sets if s.level is not None]
    return {
        "minutes": round(seconds / 60, 1),
        "distance_km": round(distance, 2) if distance else None,
        # minutes per km, only when a distance was logged
        "pace_min_per_km": round((seconds / 60) / distance, 2) if distance else None,
        "avg_level": round(sum(levels) / len(levels), 1) if levels else None,
    }


def metrics_for(kind: str, sets: Iterable) -> dict:
    if kind == "cardio":
        return cardio_metrics(sets)
    if kind == "timed":
        return timed_metrics(sets)
    return strength_metrics(sets)


def records_from(kind: str, points: list) -> dict:
    """Personal records across per-session points (each has `date` plus metrics_for output)."""
    def best(key, lowest=False):
        candidates = [p for p in points if p.get(key)]
        if not candidates:
            return None
        pick = min if lowest else max
        p = pick(candidates, key=lambda p: p[key])
        return {"value": p[key], "date": p["date"]}

    if kind == "cardio":
        return {
            "longest_minutes": best("minutes"),
            "longest_distance_km": best("distance_km"),
            "best_pace_min_per_km": best("pace_min_per_km", lowest=True),
        }
    if kind == "timed":
        return {"longest_hold_seconds": best("best_seconds")}
    return {
        "heaviest_kg": best("top_weight_kg"),
        "best_est_1rm_kg": best("est_1rm_kg"),
        "best_volume_kg": best("volume_kg"),
        "most_reps": best("max_reps"),
    }
