from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.goal import NutritionGoal
from ..models.user import User
from ..schemas.goal import NutritionGoalRead, NutritionGoalUpdate
from ..services.security import get_current_user

router = APIRouter(prefix="/api/goals", tags=["Goals"])


@router.get("/", response_model=NutritionGoalRead)
def get_goals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    g = db.query(NutritionGoal).filter(NutritionGoal.user_id == current_user.id).first()
    if not g:
        g = NutritionGoal(user_id=current_user.id, calories=current_user.calorie_target or 2000.0)
        db.add(g)
        db.commit()
        db.refresh(g)
    return g


@router.put("/", response_model=NutritionGoalRead)
def update_goals(
    goal: NutritionGoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    g = db.query(NutritionGoal).filter(NutritionGoal.user_id == current_user.id).first()
    if not g:
        g = NutritionGoal(user_id=current_user.id)
        db.add(g)
        db.flush()

    # Only update fields that were explicitly provided (not None)
    update_data = goal.model_dump(exclude_none=True)
    for k, v in update_data.items():
        if hasattr(g, k):
            setattr(g, k, v)

    if "calories" in update_data and update_data["calories"]:
        current_user.calorie_target = update_data["calories"]

    db.commit()
    db.refresh(g)
    return g
