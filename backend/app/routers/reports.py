from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
import calendar

from ..database import get_db
from ..models.diary import DiaryEntry
from ..models.goal import NutritionGoal
from ..models.user import User
from ..services.security import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# ─── Nutrient keys we track ──────────────────────────────────────────────────
NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "cholesterol",
]


def _get_goal(db: Session, user_id: int) -> NutritionGoal:
    g = db.query(NutritionGoal).filter(NutritionGoal.user_id == user_id).first()
    if not g:
        g = NutritionGoal(user_id=user_id)
    return g


def _sum_entries(entries) -> dict:
    totals = {k: 0.0 for k in NUTRIENT_KEYS}
    for e in entries:
        for k in NUTRIENT_KEYS:
            totals[k] += getattr(e, k, 0) or 0
    return totals


def _goal_percentages(totals: dict, goal: NutritionGoal) -> dict:
    pcts = {}
    for k in NUTRIENT_KEYS:
        g_val = getattr(goal, k, 0) or 1
        pcts[k] = round(min(100.0, (totals[k] / g_val) * 100), 1)
    return pcts


def _goals_dict(goal: NutritionGoal) -> dict:
    return {k: getattr(goal, k, 0) for k in NUTRIENT_KEYS}


# ─── Daily Report ────────────────────────────────────────────────────────────
@router.get("/daily/{date_str}")
def get_daily_report(
    date_str: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    entries = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == current_user.id,
        DiaryEntry.date == date_str
    ).all()
    goal = _get_goal(db, current_user.id)

    by_meal = {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
    for e in entries:
        mt = e.meal_type if e.meal_type in by_meal else "snack"
        by_meal[mt].append({
            "id": e.id,
            "food": {
                "id": e.food.id if e.food else None,
                "name": e.food.name if e.food else "Unknown",
                "category": e.food.category if e.food else "",
            },
            "quantity_display": e.quantity_display,
            "quantity_unit": e.quantity_unit,
            "quantity_g": e.quantity_g,
            "meal_type": e.meal_type,
            **{k: getattr(e, k, 0) for k in NUTRIENT_KEYS},
        })

    totals = _sum_entries(entries)

    return {
        "date": str(date_str),
        "totals": totals,
        "goals": _goals_dict(goal),
        "goal_percentages": _goal_percentages(totals, goal),
        "entries": by_meal,
        "by_meal": by_meal,
    }


# ─── Weekly Report ───────────────────────────────────────────────────────────
@router.get("/weekly")
def get_weekly_report(
    start_date: date,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = _get_goal(db, current_user.id)
    end_date = start_date + timedelta(days=6)

    entries = (
        db.query(DiaryEntry)
        .filter(
            DiaryEntry.user_id == current_user.id,
            DiaryEntry.date >= start_date,
            DiaryEntry.date <= end_date
        )
        .all()
    )

    # Group by date
    by_day: dict[date, list] = {}
    for e in entries:
        by_day.setdefault(e.date, []).append(e)

    days_data = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        day_entries = by_day.get(d, [])
        totals = _sum_entries(day_entries)
        days_data.append({
            "date": str(d),
            "totals": totals,
            "entries_count": len(day_entries),
        })

    # Averages (over days that have any entries)
    logged_days = [d for d in days_data if d["entries_count"] > 0]
    n = len(logged_days) or 1
    averages = {k: round(sum(d["totals"][k] for d in logged_days) / n, 2) for k in NUTRIENT_KEYS}

    # Goal achievement days
    g_dict = _goals_dict(goal)
    goal_achievement_days = {}
    for k in ["calories", "protein", "carbohydrates", "fat", "fiber"]:
        g_val = g_dict.get(k, 0) or 1
        days_met = sum(1 for d in logged_days if d["totals"].get(k, 0) >= g_val * 0.9)
        goal_achievement_days[k] = days_met

    return {
        "start_date": str(start_date),
        "end_date": str(end_date),
        "days": days_data,
        "averages": averages,
        "goals": g_dict,
        "goal_achievement_days": goal_achievement_days,
        "total_logged_days": len(logged_days),
    }


# ─── Monthly Report ──────────────────────────────────────────────────────────
@router.get("/monthly")
def get_monthly_report(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = _get_goal(db, current_user.id)
    _, last_day = calendar.monthrange(year, month)
    start = date(year, month, 1)
    end = date(year, month, last_day)

    entries = (
        db.query(DiaryEntry)
        .filter(
            DiaryEntry.user_id == current_user.id,
            DiaryEntry.date >= start,
            DiaryEntry.date <= end
        )
        .all()
    )

    # Group by day number
    by_day: dict[int, list] = {}
    for e in entries:
        day_num = e.date.day
        by_day.setdefault(day_num, []).append(e)

    # Calendar data (day_number -> nutrient totals)
    calendar_data = {}
    for day_num in range(1, last_day + 1):
        day_entries = by_day.get(day_num, [])
        if day_entries:
            calendar_data[str(day_num)] = _sum_entries(day_entries)
        else:
            calendar_data[str(day_num)] = {k: 0 for k in NUTRIENT_KEYS}

    logged_days = [v for v in calendar_data.values() if v.get("calories", 0) > 0]
    n = len(logged_days) or 1
    averages = {k: round(sum(d[k] for d in logged_days) / n, 2) for k in NUTRIENT_KEYS}

    # Days goal met per nutrient
    g_dict = _goals_dict(goal)
    days_goal_met = {}
    for k in ["calories", "protein", "carbohydrates", "fat", "fiber", "iron", "calcium"]:
        g_val = g_dict.get(k, 0) or 1
        days_goal_met[k] = sum(1 for d in logged_days if d.get(k, 0) >= g_val * 0.9)

    # Human-readable summary sentences
    total_days = len(logged_days)
    summary_sentences = []
    if total_days > 0:
        avg_cal = averages.get("calories", 0)
        summary_sentences.append(
            f"Your average daily calorie intake was {round(avg_cal)} kcal."
        )
        for k, label in [("protein", "protein"), ("fiber", "fiber"), ("carbohydrates", "carbohydrate")]:
            pct = g_dict.get(k, 0)
            if pct > 0:
                avg_pct = round((averages.get(k, 0) / pct) * 100)
                days_met = days_goal_met.get(k, 0)
                summary_sentences.append(
                    f"You achieved {avg_pct}% of your {label} goal on average this month."
                )
                summary_sentences.append(
                    f"You reached your {label} goal on {days_met} out of {total_days} days."
                )

    return {
        "year": year,
        "month": month,
        "total_logged_days": total_days,
        "averages": {**averages, "goal_calories": g_dict.get("calories", 2000)},
        "goals": g_dict,
        "calendar_data": calendar_data,
        "days_goal_met": days_goal_met,
        "summary_sentences": summary_sentences,
    }
