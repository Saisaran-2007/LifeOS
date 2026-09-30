from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from sqlalchemy.orm import Session
from sqlalchemy import text

from jose import JWTError

from database import engine, Base, get_db
import models
import schemas

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)


app = FastAPI(
    title="LifeOS API",
    description="Personal Life Dashboard API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# SECURITY
# ============================================================

security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = decode_access_token(token)

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        user_id = int(user_id)

    except (JWTError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():
    return {
        "message": "LifeOS API is running 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/database-test")
def database_test():
    try:
        with engine.connect() as connection:
            result = connection.execute(
                text("SELECT 1")
            )

            value = result.scalar()

        return {
            "database": "connected",
            "test_result": value
        }

    except Exception as e:
        return {
            "database": "connection failed",
            "error": str(e)
        }


# ============================================================
# AUTHENTICATION
# ============================================================

@app.post(
    "/auth/register",
    response_model=schemas.UserResponse
)
def register(
    user: schemas.UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(
        models.User
    ).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = models.User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(
            user.password
        )
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post(
    "/auth/login",
    response_model=schemas.TokenResponse
)
def login(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    existing_user = db.query(
        models.User
    ).filter(
        models.User.email == user.email
    ).first()

    if not existing_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_valid = verify_password(
        user.password,
        existing_user.password_hash
    )

    if not password_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        existing_user.id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.get(
    "/auth/me",
    response_model=schemas.UserResponse
)
def get_me(
    current_user=Depends(get_current_user)
):
    return current_user


# ============================================================
# TASKS
# ============================================================

@app.post(
    "/tasks",
    response_model=schemas.TaskResponse
)
def create_task(
    task: schemas.TaskBase,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_task = models.Task(
        user_id=current_user.id,
        title=task.title,
        description=task.description,
        priority=task.priority,
        status=task.status,
        due_date=task.due_date
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task


@app.get(
    "/tasks",
    response_model=list[schemas.TaskResponse]
)
def get_tasks(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(
        models.Task
    ).filter(
        models.Task.user_id == current_user.id
    ).order_by(
        models.Task.created_at.desc()
    ).all()

    return tasks


@app.get(
    "/tasks/{task_id}",
    response_model=schemas.TaskResponse
)
def get_task(
    task_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(
        models.Task
    ).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task


@app.put(
    "/tasks/{task_id}",
    response_model=schemas.TaskResponse
)
def update_task(
    task_id: int,
    task_data: schemas.TaskUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(
        models.Task
    ).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.priority is not None:
        task.priority = task_data.priority
    if task_data.status is not None:
        task.status = task_data.status
    if task_data.due_date is not None:
        task.due_date = task_data.due_date

    db.commit()
    db.refresh(task)

    return task


@app.delete("/tasks/{task_id}")
def delete_task(
    task_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(
        models.Task
    ).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    db.delete(task)
    db.commit()

    return {
        "message": "Task deleted successfully"
    }


# ============================================================
# GOALS
# ============================================================

@app.post(
    "/goals",
    response_model=schemas.GoalResponse
)
def create_goal(
    goal: schemas.GoalCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_goal = models.Goal(
        user_id=current_user.id,
        title=goal.title,
        description=goal.description,
        target_date=goal.target_date,
        progress=goal.progress
    )

    db.add(new_goal)
    db.commit()
    db.refresh(new_goal)

    return new_goal


@app.get(
    "/goals",
    response_model=list[schemas.GoalResponse]
)
def get_goals(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(
        models.Goal
    ).filter(
        models.Goal.user_id == current_user.id
    ).order_by(
        models.Goal.created_at.desc()
    ).all()


@app.put(
    "/goals/{goal_id}",
    response_model=schemas.GoalResponse
)
def update_goal(
    goal_id: int,
    goal_data: schemas.GoalUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(
        models.Goal
    ).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    if goal_data.title is not None:
        goal.title = goal_data.title
    if goal_data.description is not None:
        goal.description = goal_data.description
    if goal_data.target_date is not None:
        goal.target_date = goal_data.target_date
    if goal_data.progress is not None:
        goal.progress = goal_data.progress

    db.commit()
    db.refresh(goal)

    return goal


@app.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    goal = db.query(
        models.Goal
    ).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == current_user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    db.delete(goal)
    db.commit()

    return {
        "message": "Goal deleted successfully"
    }


# ============================================================
# HABITS
# ============================================================

@app.post(
    "/habits",
    response_model=schemas.HabitResponse
)
def create_habit(
    habit: schemas.HabitCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_habit = models.Habit(
        user_id=current_user.id,
        name=habit.name,
        frequency=habit.frequency,
        current_streak=habit.current_streak,
        longest_streak=habit.longest_streak
    )

    db.add(new_habit)
    db.commit()
    db.refresh(new_habit)

    return new_habit


@app.get(
    "/habits",
    response_model=list[schemas.HabitResponse]
)
def get_habits(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(
        models.Habit
    ).filter(
        models.Habit.user_id == current_user.id
    ).order_by(
        models.Habit.created_at.desc()
    ).all()


@app.put(
    "/habits/{habit_id}",
    response_model=schemas.HabitResponse
)
def update_habit(
    habit_id: int,
    habit_data: schemas.HabitUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(
        models.Habit
    ).filter(
        models.Habit.id == habit_id,
        models.Habit.user_id == current_user.id
    ).first()

    if not habit:
        raise HTTPException(
            status_code=404,
            detail="Habit not found"
        )

    if habit_data.name is not None:
        habit.name = habit_data.name
    if habit_data.frequency is not None:
        habit.frequency = habit_data.frequency
    if habit_data.current_streak is not None:
        habit.current_streak = habit_data.current_streak
        if habit.current_streak > habit.longest_streak:
            habit.longest_streak = habit.current_streak
    if habit_data.longest_streak is not None:
        habit.longest_streak = habit_data.longest_streak

    db.commit()
    db.refresh(habit)

    return habit


@app.post(
    "/habits/{habit_id}/streak",
    response_model=schemas.HabitResponse
)
def increment_habit_streak(
    habit_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(
        models.Habit
    ).filter(
        models.Habit.id == habit_id,
        models.Habit.user_id == current_user.id
    ).first()

    if not habit:
        raise HTTPException(
            status_code=404,
            detail="Habit not found"
        )

    habit.current_streak += 1
    if habit.current_streak > habit.longest_streak:
        habit.longest_streak = habit.current_streak

    db.commit()
    db.refresh(habit)

    return habit


@app.delete("/habits/{habit_id}")
def delete_habit(
    habit_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    habit = db.query(
        models.Habit
    ).filter(
        models.Habit.id == habit_id,
        models.Habit.user_id == current_user.id
    ).first()

    if not habit:
        raise HTTPException(
            status_code=404,
            detail="Habit not found"
        )

    db.delete(habit)
    db.commit()

    return {
        "message": "Habit deleted successfully"
    }


# ============================================================
# EXPENSES
# ============================================================

@app.post(
    "/expenses",
    response_model=schemas.ExpenseResponse
)
def create_expense(
    expense: schemas.ExpenseCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_expense = models.Expense(
        user_id=current_user.id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        expense_date=expense.expense_date
    )

    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)

    return new_expense


@app.get(
    "/expenses",
    response_model=list[schemas.ExpenseResponse]
)
def get_expenses(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(
        models.Expense
    ).filter(
        models.Expense.user_id == current_user.id
    ).order_by(
        models.Expense.expense_date.desc()
    ).all()


@app.put(
    "/expenses/{expense_id}",
    response_model=schemas.ExpenseResponse
)
def update_expense(
    expense_id: int,
    expense_data: schemas.ExpenseUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(
        models.Expense
    ).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    if expense_data.amount is not None:
        expense.amount = expense_data.amount
    if expense_data.category is not None:
        expense.category = expense_data.category
    if expense_data.description is not None:
        expense.description = expense_data.description
    if expense_data.expense_date is not None:
        expense.expense_date = expense_data.expense_date

    db.commit()
    db.refresh(expense)

    return expense


@app.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(
        models.Expense
    ).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()

    if not expense:
        raise HTTPException(
            status_code=404,
            detail="Expense not found"
        )

    db.delete(expense)
    db.commit()

    return {
        "message": "Expense deleted successfully"
    }


# ============================================================
# PROJECTS
# ============================================================

@app.post(
    "/projects",
    response_model=schemas.ProjectResponse
)
def create_project(
    project: schemas.ProjectCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_project = models.Project(
        user_id=current_user.id,
        name=project.name,
        description=project.description,
        status=project.status,
        progress=project.progress
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


@app.get(
    "/projects",
    response_model=list[schemas.ProjectResponse]
)
def get_projects(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(
        models.Project
    ).filter(
        models.Project.user_id == current_user.id
    ).order_by(
        models.Project.created_at.desc()
    ).all()


@app.put(
    "/projects/{project_id}",
    response_model=schemas.ProjectResponse
)
def update_project(
    project_id: int,
    project_data: schemas.ProjectUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(
        models.Project
    ).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.status is not None:
        project.status = project_data.status
    if project_data.progress is not None:
        project.progress = project_data.progress

    db.commit()
    db.refresh(project)

    return project


@app.delete("/projects/{project_id}")
def delete_project(
    project_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(
        models.Project
    ).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    db.delete(project)
    db.commit()

    return {
        "message": "Project deleted successfully"
    }


# ============================================================
# DEADLINES
# ============================================================

@app.post(
    "/deadlines",
    response_model=schemas.DeadlineResponse
)
def create_deadline(
    deadline: schemas.DeadlineCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_deadline = models.Deadline(
        user_id=current_user.id,
        title=deadline.title,
        description=deadline.description,
        deadline=deadline.deadline,
        completed=deadline.completed
    )

    db.add(new_deadline)
    db.commit()
    db.refresh(new_deadline)

    return new_deadline


@app.get(
    "/deadlines",
    response_model=list[schemas.DeadlineResponse]
)
def get_deadlines(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(
        models.Deadline
    ).filter(
        models.Deadline.user_id == current_user.id
    ).order_by(
        models.Deadline.deadline.asc()
    ).all()


@app.put(
    "/deadlines/{deadline_id}",
    response_model=schemas.DeadlineResponse
)
def update_deadline(
    deadline_id: int,
    deadline_data: schemas.DeadlineUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deadline = db.query(
        models.Deadline
    ).filter(
        models.Deadline.id == deadline_id,
        models.Deadline.user_id == current_user.id
    ).first()

    if not deadline:
        raise HTTPException(
            status_code=404,
            detail="Deadline not found"
        )

    if deadline_data.title is not None:
        deadline.title = deadline_data.title
    if deadline_data.description is not None:
        deadline.description = deadline_data.description
    if deadline_data.deadline is not None:
        deadline.deadline = deadline_data.deadline
    if deadline_data.completed is not None:
        deadline.completed = deadline_data.completed

    db.commit()
    db.refresh(deadline)

    return deadline


@app.delete("/deadlines/{deadline_id}")
def delete_deadline(
    deadline_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deadline = db.query(
        models.Deadline
    ).filter(
        models.Deadline.id == deadline_id,
        models.Deadline.user_id == current_user.id
    ).first()

    if not deadline:
        raise HTTPException(
            status_code=404,
            detail="Deadline not found"
        )

    db.delete(deadline)
    db.commit()

    return {
        "message": "Deadline deleted successfully"
    }


# ============================================================
# ANALYTICS & SUMMARY
# ============================================================

@app.get("/analytics/summary")
def get_analytics_summary(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(models.Task).filter(models.Task.user_id == current_user.id).all()
    goals = db.query(models.Goal).filter(models.Goal.user_id == current_user.id).all()
    habits = db.query(models.Habit).filter(models.Habit.user_id == current_user.id).all()
    expenses = db.query(models.Expense).filter(models.Expense.user_id == current_user.id).all()
    projects = db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
    deadlines = db.query(models.Deadline).filter(models.Deadline.user_id == current_user.id).all()

    total_tasks = len(tasks)
    completed_tasks = sum(1 for t in tasks if t.status == "completed")
    task_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0

    avg_goal_progress = round(sum(g.progress for g in goals) / len(goals), 1) if goals else 0
    max_streak = max((h.current_streak for h in habits), default=0)
    total_spent = sum(e.amount for e in expenses)

    return {
        "tasks": {"total": total_tasks, "completed": completed_tasks, "completion_rate": task_rate},
        "goals": {"total": len(goals), "avg_progress": avg_goal_progress},
        "habits": {"total": len(habits), "best_streak": max_streak},
        "expenses": {"total_spent": total_spent, "count": len(expenses)},
        "projects": {"total": len(projects)},
        "deadlines": {"total": len(deadlines)}
    }