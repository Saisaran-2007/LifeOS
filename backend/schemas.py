from datetime import datetime, date
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional


# ─────────────────────────────────────────────
# TASK SCHEMAS
# ─────────────────────────────────────────────

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    status: str = "pending"
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None


class TaskResponse(TaskBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# GOAL SCHEMAS
# ─────────────────────────────────────────────

class GoalBase(BaseModel):
    title: str
    description: Optional[str] = None
    target_date: Optional[date] = None
    progress: float = 0.0


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    target_date: Optional[date] = None
    progress: Optional[float] = None


class GoalResponse(GoalBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# HABIT SCHEMAS
# ─────────────────────────────────────────────

class HabitBase(BaseModel):
    name: str
    frequency: str = "daily"
    current_streak: int = 0
    longest_streak: int = 0


class HabitCreate(HabitBase):
    pass


class HabitUpdate(BaseModel):
    name: Optional[str] = None
    frequency: Optional[str] = None
    current_streak: Optional[int] = None
    longest_streak: Optional[int] = None


class HabitResponse(HabitBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# EXPENSE SCHEMAS
# ─────────────────────────────────────────────

class ExpenseBase(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None
    expense_date: date


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[str] = None
    description: Optional[str] = None
    expense_date: Optional[date] = None


class ExpenseResponse(ExpenseBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# PROJECT SCHEMAS
# ─────────────────────────────────────────────

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "active"
    progress: float = 0.0


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[float] = None


class ProjectResponse(ProjectBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# DEADLINE SCHEMAS
# ─────────────────────────────────────────────

class DeadlineBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: datetime
    completed: bool = False


class DeadlineCreate(DeadlineBase):
    pass


class DeadlineUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    completed: Optional[bool] = None


class DeadlineResponse(DeadlineBase):
    id: int
    user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ─────────────────────────────────────────────
# USER / AUTH SCHEMAS
# ─────────────────────────────────────────────

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"