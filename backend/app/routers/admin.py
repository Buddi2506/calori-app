from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

from ..database import get_db
from ..models.user import User
from ..models.diary import DiaryEntry
from ..models.goal import NutritionGoal
from ..services.security import require_admin, hash_password

router = APIRouter(prefix="/api/admin", tags=["Admin"])

MAX_ALLOWED_USERS = 10

NUTRIENT_KEYS = [
    "calories", "protein", "carbohydrates", "fat", "fiber", "sugar",
    "sodium", "potassium", "iron", "calcium", "vitamin_c", "vitamin_d",
    "vitamin_b12", "magnesium", "zinc", "saturated_fat", "cholesterol",
]


class CreateUserRequest(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    calorie_target: Optional[float] = 2000.0
    role: Optional[str] = "member"


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    is_active: Optional[bool] = None
    calorie_target: Optional[float] = None
    role: Optional[str] = None
    reset_password: Optional[str] = None


@router.get("/users")
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    today_str = date.today()

    user_list = []
    for u in users:
        total_entries = db.query(DiaryEntry).filter(DiaryEntry.user_id == u.id).count()
        distinct_days = db.query(distinct(DiaryEntry.date)).filter(DiaryEntry.user_id == u.id).count()

        # Today's calories
        today_cal_row = db.query(func.coalesce(func.sum(DiaryEntry.calories), 0.0)).filter(
            DiaryEntry.user_id == u.id,
            DiaryEntry.date == today_str
        ).first()
        today_cal = round(today_cal_row[0], 1) if today_cal_row else 0.0

        user_list.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "is_active": u.is_active,
            "must_change_password": u.must_change_password,
            "calorie_target": u.calorie_target,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
            "stats": {
                "total_entries": total_entries,
                "total_days_logged": distinct_days,
                "today_calories": today_cal,
            }
        })

    return {
        "total_users": len(users),
        "max_allowed": MAX_ALLOWED_USERS,
        "users": user_list
    }


@router.post("/users")
def create_user(req: CreateUserRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    # 1. Enforce 10-user capacity
    total = db.query(User).count()
    if total >= MAX_ALLOWED_USERS:
        raise HTTPException(
            status_code=400,
            detail=f"User limit reached. A maximum of {MAX_ALLOWED_USERS} accounts is allowed."
        )

    # 2. Check for username or email collisions
    clean_username = req.username.strip()
    clean_email = req.email.strip().lower()

    if db.query(User).filter(User.username == clean_username).first():
        raise HTTPException(status_code=400, detail="Username already exists")

    if db.query(User).filter(User.email.ilike(clean_email)).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Initial password must be at least 6 characters")

    # 3. Create user with mandatory first-login password change
    new_user = User(
        username=clean_username,
        email=clean_email,
        full_name=req.full_name.strip(),
        hashed_password=hash_password(req.password),
        role=req.role if req.role in ("admin", "member") else "member",
        is_active=True,
        must_change_password=True,  # Mandatory password change on first login!
        admin_id=admin.id,
        calorie_target=req.calorie_target or 2000.0
    )
    db.add(new_user)
    db.flush()

    # 4. Generate default NutritionGoal for user
    default_goal = NutritionGoal(
        user_id=new_user.id,
        calories=req.calorie_target or 2000.0,
        protein=round((req.calorie_target or 2000.0) * 0.25 / 4),  # 25% protein
        carbohydrates=round((req.calorie_target or 2000.0) * 0.50 / 4),  # 50% carbs
        fat=round((req.calorie_target or 2000.0) * 0.25 / 9),  # 25% fat
        fiber=30.0
    )
    db.add(default_goal)
    db.commit()
    db.refresh(new_user)

    return {
        "ok": True,
        "message": f"User '{new_user.username}' created successfully.",
        "user_id": new_user.id
    }


@router.put("/users/{user_id}")
def update_user(user_id: int, req: UpdateUserRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    if req.full_name is not None:
        u.full_name = req.full_name.strip()
    if req.email is not None:
        u.email = req.email.strip().lower()
    if req.is_active is not None:
        if u.id == admin.id and not req.is_active:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own admin account")
        u.is_active = req.is_active
    if req.role is not None and req.role in ("admin", "member"):
        u.role = req.role
    if req.calorie_target is not None:
        u.calorie_target = req.calorie_target
        # Sync to goal
        goal = db.query(NutritionGoal).filter(NutritionGoal.user_id == u.id).first()
        if goal:
            goal.calories = req.calorie_target

    if req.reset_password is not None and len(req.reset_password) >= 6:
        u.hashed_password = hash_password(req.reset_password)
        u.must_change_password = True  # Must change reset password on login

    db.commit()
    return {"ok": True, "message": "User updated successfully"}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(u)
    db.commit()
    return {"ok": True, "message": f"User '{u.username}' deleted successfully"}


@router.get("/users/{user_id}/diary")
def get_user_diary(
    user_id: int,
    date: Optional[date] = None,
    date_str: Optional[date] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Allows Super Admin to inspect any member's food diary and nutrient totals."""
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")

    target_date = date or date_str or datetime.utcnow().date()

    entries = db.query(DiaryEntry).filter(
        DiaryEntry.user_id == user_id,
        DiaryEntry.date == target_date
    ).all()

    by_meal = {"breakfast": [], "lunch": [], "dinner": [], "snack": []}
    totals = {k: 0.0 for k in NUTRIENT_KEYS}

    for e in entries:
        mt = e.meal_type if e.meal_type in by_meal else "snack"
        food_title = e.food.name if e.food else "Unknown"
        entry_data = {
            "id": e.id,
            "food_name": food_title,
            "food": {"name": food_title, "category": e.food.category if e.food else ""},
            "quantity_display": e.quantity_display,
            "quantity_unit": e.quantity_unit,
            "quantity_g": e.quantity_g,
            "calories": e.calories,
            "protein": e.protein,
            "carbohydrates": e.carbohydrates,
            "fat": e.fat,
        }
        by_meal[mt].append(entry_data)
        for k in NUTRIENT_KEYS:
            totals[k] += getattr(e, k, 0.0) or 0.0

    goal = db.query(NutritionGoal).filter(NutritionGoal.user_id == user_id).first()
    goal_cal = goal.calories if goal else u.calorie_target

    return {
        "user": {
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name
        },
        "date": str(target_date),
        "totals": totals,
        "calorie_target": goal_cal,
        "entries": by_meal
    }
