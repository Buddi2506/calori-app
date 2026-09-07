from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..services.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class ChangePasswordRequest(BaseModel):
    old_password: Optional[str] = None
    new_password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    must_change_password: bool
    calorie_target: float

    model_config = {"from_attributes": True}


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/login", response_model=LoginResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    identity = req.username_or_email.strip()
    user = db.query(User).filter(
        (User.username == identity) | (User.email.ilike(identity))
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact your administrator."
        )

    # Record last login
    user.last_login_at = datetime.utcnow()
    db.commit()

    token = create_access_token(data={
        "sub": str(user.id),
        "username": user.username,
        "role": user.role
    })

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    # If password change wasn't mandatory, require old password verification
    if not current_user.must_change_password:
        if not req.old_password or not verify_password(req.old_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password does not match")

    current_user.hashed_password = hash_password(req.new_password)
    current_user.must_change_password = False
    db.commit()

    return {"ok": True, "message": "Password updated successfully"}
