import { useState, useEffect } from "react";
import axios from "axios";
import {
  LayoutDashboard,
  CheckSquare,
  Target,
  Flame,
  FolderKanban,
  CalendarClock,
  Wallet,
  BarChart3,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  Clock,
  CircleCheck,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Brain,
  CalendarDays,
  X,
  Pencil,
  Trash2,
  LogOut,
  TrendingUp,
} from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Tasks", icon: CheckSquare },
  { name: "Goals", icon: Target },
  { name: "Habits", icon: Flame },
  { name: "Projects", icon: FolderKanban },
  { name: "Deadlines", icon: CalendarClock },
  { name: "Expenses", icon: Wallet },
  { name: "Analytics", icon: BarChart3 },
];

function formatDueDate(dueDateString) {
  if (!dueDateString) return "No due date";
  const date = new Date(dueDateString);
  if (isNaN(date.getTime())) return dueDateString;

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Today, ${timeStr}`;
  return `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${timeStr}`;
}

function App({ user, onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");

  // State for all backend modules
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  // Modals state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'task' | 'goal' | 'habit' | 'expense' | 'project' | 'deadline'
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", status: "pending", due_date: "" });
  const [goalForm, setGoalForm] = useState({ title: "", description: "", target_date: "", progress: 0 });
  const [habitForm, setHabitForm] = useState({ name: "", frequency: "daily", current_streak: 0 });
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "General", description: "", expense_date: new Date().toISOString().slice(0, 10) });
  const [projectForm, setProjectForm] = useState({ name: "", description: "", status: "active", progress: 0 });
  const [deadlineForm, setDeadlineForm] = useState({ title: "", description: "", deadline: "", completed: false });

  // Filters
  const [taskFilter, setTaskFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getAuthHeader = () => {
    const token = localStorage.getItem("lifeos_token");
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchAllData = () => {
    setLoading(true);
    const authHeader = getAuthHeader();

    Promise.all([
      axios.get(`${API_URL}/tasks`, authHeader),
      axios.get(`${API_URL}/goals`, authHeader),
      axios.get(`${API_URL}/habits`, authHeader),
      axios.get(`${API_URL}/expenses`, authHeader),
      axios.get(`${API_URL}/projects`, authHeader),
      axios.get(`${API_URL}/deadlines`, authHeader),
      axios.get(`${API_URL}/analytics/summary`, authHeader),
    ])
      .then(([tasksRes, goalsRes, habitsRes, expensesRes, projectsRes, deadlinesRes, analyticsRes]) => {
        setTasks(tasksRes.data);
        setGoals(goalsRes.data);
        setHabits(habitsRes.data);
        setExpenses(expensesRes.data);
        setProjects(projectsRes.data);
        setDeadlines(deadlinesRes.data);
        setAnalytics(analyticsRes.data);
      })
      .catch((err) => console.error("Error fetching LifeOS data:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- TASK HANDLERS ---
  const handleToggleTask = (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    setTasks((current) => current.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    axios.put(`${API_URL}/tasks/${task.id}`, { status: newStatus }, getAuthHeader()).then(() => fetchAllData());
  };

  const handleDeleteTask = (taskId) => {
    setTasks((current) => current.filter((t) => t.id !== taskId));
    axios.delete(`${API_URL}/tasks/${taskId}`, getAuthHeader()).then(() => fetchAllData());
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;
    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      priority: taskForm.priority.toLowerCase(),
      status: taskForm.status,
      due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : null,
    };
    const req = editingItem
      ? axios.put(`${API_URL}/tasks/${editingItem.id}`, payload, getAuthHeader())
      : axios.post(`${API_URL}/tasks`, payload, getAuthHeader());
    req.then(() => {
      setActiveModal(null);
      fetchAllData();
    });
  };

  // --- GOAL HANDLERS ---
  const handleSaveGoal = (e) => {
    e.preventDefault();
    if (!goalForm.title.trim()) return;
    const payload = {
      title: goalForm.title.trim(),
      description: goalForm.description.trim() || null,
      target_date: goalForm.target_date || null,
      progress: parseFloat(goalForm.progress) || 0,
    };
    const req = editingItem
      ? axios.put(`${API_URL}/goals/${editingItem.id}`, payload, getAuthHeader())
      : axios.post(`${API_URL}/goals`, payload, getAuthHeader());
    req.then(() => {
      setActiveModal(null);
      fetchAllData();
    });
  };

  const handleDeleteGoal = (id) => {
    setGoals((curr) => curr.filter((g) => g.id !== id));
    axios.delete(`${API_URL}/goals/${id}`, getAuthHeader()).then(() => fetchAllData());
  };

  // --- HABIT HANDLERS ---
  const handleSaveHabit = (e) => {
    e.preventDefault();
    if (!habitForm.name.trim()) return;
    const payload = {
      name: habitForm.name.trim(),
      frequency: habitForm.frequency,
      current_streak: parseInt(habitForm.current_streak) || 0,
      longest_streak: parseInt(habitForm.current_streak) || 0,
    };
    axios.post(`${API_URL}/habits`, payload, getAuthHeader()).then(() => {
      setActiveModal(null);
      fetchAllData();
    });
  };

  const handleIncrementStreak = (habitId) => {
    axios.post(`${API_URL}/habits/${habitId}/streak`, {}, getAuthHeader()).then(() => fetchAllData());
  };

  const handleDeleteHabit = (id) => {
    setHabits((curr) => curr.filter((h) => h.id !== id));
    axios.delete(`${API_URL}/habits/${id}`, getAuthHeader()).then(() => fetchAllData());
  };

  // --- EXPENSE HANDLERS ---
  const handleSaveExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return;
    const payload = {
      amount: parseFloat(expenseForm.amount),
      category: expenseForm.category.trim(),
      description: expenseForm.description.trim() || null,
      expense_date: expenseForm.expense_date,
    };
    axios.post(`${API_URL}/expenses`, payload, getAuthHeader()).then(() => {
      setActiveModal(null);
      fetchAllData();
    });
  };

  const handleDeleteExpense = (id) => {
    setExpenses((curr) => curr.filter((e) => e.id !== id));
    axios.delete(`${API_URL}/expenses/${id}`, getAuthHeader()).then(() => fetchAllData());
  };

  // --- PROJECT HANDLERS ---
  const handleSaveProject = (e) => {
    e.preventDefault();
    if (!projectForm.name.trim()) return;
    const payload = {
      name: projectForm.name.trim(),
      description: projectForm.description.trim() || null,
      status: projectForm.status,
      progress: parseFloat(projectForm.progress) || 0,
    };
    const req = editingItem
      ? axios.put(`${API_URL}/projects/${editingItem.id}`, payload, getAuthHeader())
      : axios.post(`${API_URL}/projects`, payload, getAuthHeader());
    req.then(() => {
      setActiveModal(null);
      fetchAllData();
    });
  };

  const handleDeleteProject = (id) => {
    setProjects((curr) => curr.filter((p) => p.id !== id));
    axios.delete(`${API_URL}/projects/${id}`, getAuthHeader()).then(() => fetchAllData());
  };

  // --- DEADLINE HANDLERS ---
  const handleSaveDeadline = (e) => {
    e.preventDefault();
    if (!deadlineForm.title.trim() || !deadlineForm.deadline) return;
    const payload = {
      title: deadlineForm.title.trim(),
      description: deadlineForm.description.trim() || null,
      deadline: new Date(deadlineForm.deadline).toISOString(),
      completed: deadlineForm.completed,
    };
    axios.post(`${API_URL}/deadlines`, payload, getAuthHeader()).then(() => {
      setActiveModal(null);
      fetchAllData();
    });
  };

  const handleToggleDeadline = (deadline) => {
    const updatedStatus = !deadline.completed;
    axios.put(`${API_URL}/deadlines/${deadline.id}`, { completed: updatedStatus }, getAuthHeader()).then(() => fetchAllData());
  };

  const handleDeleteDeadline = (id) => {
    setDeadlines((curr) => curr.filter((d) => d.id !== id));
    axios.delete(`${API_URL}/deadlines/${id}`, getAuthHeader()).then(() => fetchAllData());
  };

  // Calculations
  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
  const pendingTasksCount = tasks.filter((t) => t.status !== "completed").length;
  const avgGoalProgress = goals.length > 0 ? Math.round(goals.reduce((acc, g) => acc + (g.progress || 0), 0) / goals.length) : 0;
  const maxHabitStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.current_streak || 0)) : 0;
  const totalExpenseSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const userName = user?.name || "Sai Saran";
  const userFirstName = userName.split(" ")[0];
  const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "SS";

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      taskFilter === "all" ? true : taskFilter === "completed" ? task.status === "completed" : task.status !== "completed";
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-area">
          <div className="logo-icon">
            <Sparkles size={20} />
          </div>
          <div>
            <h2>LifeOS</h2>
            <span>Personal Command Center</span>
          </div>
        </div>

        <div className="menu-label">WORKSPACE</div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;

            return (
              <button
                key={item.name}
                className={"menu-item " + (isActive ? "menu-item-active" : "")}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={18} />
                <span>{item.name}</span>
                {item.name === "Tasks" && <small className="task-count">{pendingTasksCount}</small>}
                {item.name === "Goals" && <small className="task-count">{goals.length}</small>}
                {item.name === "Habits" && <small className="task-count">{habits.length}</small>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-ai">
            <div className="sidebar-ai-icon">
              <Brain size={17} />
            </div>
            <div>
              <strong>AI Insight</strong>
              <p>Your productivity score is {analytics?.tasks?.completion_rate || 82}% today.</p>
            </div>
          </div>

          <div className="user-profile">
            <div className="avatar">{userInitials}</div>
            <div className="user-details">
              <strong>{userName}</strong>
              <span>{user?.email || "Personal Account"}</span>
            </div>
            {onLogout && (
              <button className="logout-btn" title="Sign out" onClick={onLogout}>
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="mobile-logo">
            <div className="logo-icon">
              <Sparkles size={17} />
            </div>
            <strong>LifeOS</strong>
          </div>

          <div className="current-date">
            <CalendarDays size={16} />
            Tuesday, 29 September 2026
          </div>

          <div className="topbar-right">
            <div className="search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span>⌘ K</span>
            </div>

            <button className="notification">
              <Bell size={18} />
              <i></i>
            </button>

            <button className="add-btn" onClick={() => setShowQuickAdd(true)}>
              <Plus size={17} />
              Add
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="content">
          {/* DASHBOARD PAGE */}
          {activePage === "Dashboard" && (
            <>
              <section className="page-header">
                <div>
                  <span className="section-label">TUESDAY · SEPTEMBER 29</span>
                  <h1>Good morning, {userFirstName}.</h1>
                  <p>Here's everything that needs your attention today.</p>
                </div>

                <div className="focus-status">
                  <span></span>
                  Focus mode ready
                </div>
              </section>

              {/* AI INSIGHT CARD */}
              <section className="ai-card">
                <div className="ai-icon">
                  <Sparkles size={22} />
                </div>
                <div className="ai-body">
                  <div className="ai-title">
                    <span>AI DAILY INSIGHT</span>
                    <b>LIVE</b>
                  </div>
                  <h2>
                    You have {pendingTasksCount} task{pendingTasksCount === 1 ? "" : "s"} remaining today. Your best habit streak stands at {maxHabitStreak} days.
                  </h2>
                  <p>Keep your focus high before 5 PM to maximize your productivity score.</p>
                  <div className="ai-tags">
                    <span>↗ Tasks Done: {completedTasksCount}</span>
                    <span>🔥 {maxHabitStreak} day streak</span>
                    <span>₹ Total Spent: ₹{totalExpenseSpent.toLocaleString()}</span>
                  </div>
                </div>
                <button className="ai-open">
                  <ArrowUpRight size={20} />
                </button>
              </section>

              {/* STATS */}
              <section className="stats">
                <Stat
                  icon={<CheckSquare size={18} />}
                  label="Today's Tasks"
                  value={tasks.length.toString()}
                  info={`${completedTasksCount} completed`}
                  trend="+12%"
                />
                <Stat
                  icon={<Target size={18} />}
                  label="Goals Progress"
                  value={`${avgGoalProgress}%`}
                  info={`${goals.length} active goals`}
                  trend="+8%"
                />
                <Stat
                  icon={<Flame size={18} />}
                  label="Best Streak"
                  value={`${maxHabitStreak} days`}
                  info="Top active habit"
                  trend="+3 days"
                />
                <Stat
                  icon={<Wallet size={18} />}
                  label="Spent This Month"
                  value={`₹${totalExpenseSpent.toLocaleString()}`}
                  info={`${expenses.length} transactions`}
                  trend="-6%"
                />
              </section>

              {/* DASHBOARD GRID */}
              <section className="dashboard-grid">
                {/* TASKS CARD */}
                <div className="card">
                  <CardHeader title="Today's Tasks" subtitle={`${pendingTasksCount} tasks planned`} onViewAll={() => setActivePage("Tasks")} />
                  {loading ? (
                    <div className="empty-tasks">Loading tasks...</div>
                  ) : tasks.length === 0 ? (
                    <div className="empty-tasks">
                      <CheckSquare size={28} />
                      <p>No tasks yet. Click below to add one!</p>
                    </div>
                  ) : (
                    <div className="task-list">
                      {tasks.slice(0, 5).map((task) => {
                        const isDone = task.status === "completed";
                        return (
                          <div className="task" key={task.id}>
                            <button
                              className={"task-checkbox " + (isDone ? "task-completed" : "")}
                              onClick={() => handleToggleTask(task)}
                            >
                              {isDone && <CircleCheck size={15} />}
                            </button>
                            <div className="task-content">
                              <strong className={isDone ? "task-text-done" : ""}>{task.title}</strong>
                              <div className="task-meta">
                                <span>
                                  <Clock size={11} />
                                  {formatDueDate(task.due_date)}
                                </span>
                              </div>
                            </div>
                            <span className={"priority " + (task.priority || "medium").toLowerCase()}>{task.priority || "medium"}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    className="add-task"
                    onClick={() => {
                      setEditingItem(null);
                      setTaskForm({ title: "", description: "", priority: "medium", status: "pending", due_date: "" });
                      setActiveModal("task");
                    }}
                  >
                    <Plus size={15} />
                    Add a task
                  </button>
                </div>

                {/* HABITS CARD */}
                <div className="card">
                  <CardHeader title="Habit Tracker" subtitle="Keep your momentum" onViewAll={() => setActivePage("Habits")} />
                  {habits.length === 0 ? (
                    <div className="empty-tasks">
                      <Flame size={28} />
                      <p>No habits configured. Click to add your first habit!</p>
                    </div>
                  ) : (
                    <div className="habit-list">
                      {habits.slice(0, 4).map((habit) => (
                        <div className="habit" key={habit.id}>
                          <div className="habit-icon">
                            <Flame size={16} />
                          </div>
                          <div className="habit-body">
                            <div className="habit-heading">
                              <strong>{habit.name}</strong>
                              <span>{habit.current_streak} day streak</span>
                            </div>
                            <div className="progress">
                              <div style={{ width: Math.min(100, (habit.current_streak / 30) * 100) + "%" }}></div>
                            </div>
                          </div>
                          <button className="streak-btn" onClick={() => handleIncrementStreak(habit.id)} title="+1 Day Streak">
                            +1
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DEADLINES CARD */}
                <div className="card">
                  <CardHeader title="Upcoming Deadlines" subtitle="Don't miss what matters" onViewAll={() => setActivePage("Deadlines")} />
                  {deadlines.length === 0 ? (
                    <div className="empty-tasks">
                      <CalendarClock size={28} />
                      <p>No upcoming deadlines recorded.</p>
                    </div>
                  ) : (
                    <div className="deadline-list">
                      {deadlines.slice(0, 3).map((d) => {
                        const dDate = new Date(d.deadline);
                        return (
                          <div className={"deadline " + (d.completed ? "" : "deadline-urgent")} key={d.id}>
                            <div className="deadline-date">
                              <strong>{dDate.getDate()}</strong>
                              <small>{dDate.toLocaleDateString([], { month: "short" }).toUpperCase()}</small>
                            </div>
                            <div className="deadline-info">
                              <strong>{d.title}</strong>
                              <span>
                                <Clock size={11} />
                                {formatDueDate(d.deadline)}
                              </span>
                            </div>
                            <button
                              className="task-action-btn"
                              onClick={() => handleToggleDeadline(d)}
                              title={d.completed ? "Mark pending" : "Mark completed"}
                            >
                              <CircleCheck size={16} color={d.completed ? "#34d399" : "#697284"} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* PROJECTS CARD */}
                <div className="card">
                  <CardHeader title="Active Projects" subtitle="Your work in progress" onViewAll={() => setActivePage("Projects")} />
                  {projects.length === 0 ? (
                    <div className="empty-tasks">
                      <FolderKanban size={28} />
                      <p>No projects created yet.</p>
                    </div>
                  ) : (
                    <div className="project-list">
                      {projects.slice(0, 3).map((proj) => (
                        <div className="project" key={proj.id}>
                          <div className="project-icon">
                            <FolderKanban size={16} />
                          </div>
                          <div className="project-body">
                            <div className="project-top">
                              <div>
                                <strong>{proj.name}</strong>
                                <span>{proj.description || "Active Project"}</span>
                              </div>
                              <b>{proj.progress}%</b>
                            </div>
                            <div className="progress">
                              <div style={{ width: proj.progress + "%" }}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* TASKS PAGE */}
          {activePage === "Tasks" && (
            <div>
              <section className="page-header">
                <div>
                  <span className="section-label">TASK MANAGEMENT</span>
                  <h1>Tasks & Todos</h1>
                  <p>Organize, track, and complete your tasks efficiently.</p>
                </div>
                <button
                  className="add-btn"
                  onClick={() => {
                    setEditingItem(null);
                    setTaskForm({ title: "", description: "", priority: "medium", status: "pending", due_date: "" });
                    setActiveModal("task");
                  }}
                >
                  <Plus size={17} /> Create Task
                </button>
              </section>

              <div className="card">
                <div className="tasks-toolbar">
                  <div className="filter-bar">
                    <button className={"filter-btn " + (taskFilter === "all" ? "filter-btn-active" : "")} onClick={() => setTaskFilter("all")}>
                      All ({tasks.length})
                    </button>
                    <button className={"filter-btn " + (taskFilter === "pending" ? "filter-btn-active" : "")} onClick={() => setTaskFilter("pending")}>
                      Pending ({pendingTasksCount})
                    </button>
                    <button className={"filter-btn " + (taskFilter === "completed" ? "filter-btn-active" : "")} onClick={() => setTaskFilter("completed")}>
                      Completed ({completedTasksCount})
                    </button>
                  </div>
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="empty-tasks">
                    <CheckSquare size={32} />
                    <p>No tasks found.</p>
                  </div>
                ) : (
                  <div className="task-list">
                    {filteredTasks.map((task) => {
                      const isDone = task.status === "completed";
                      return (
                        <div className="task" key={task.id}>
                          <button className={"task-checkbox " + (isDone ? "task-completed" : "")} onClick={() => handleToggleTask(task)}>
                            {isDone && <CircleCheck size={15} />}
                          </button>
                          <div className="task-content">
                            <strong className={isDone ? "task-text-done" : ""}>{task.title}</strong>
                            {task.description && <p className="task-description">{task.description}</p>}
                            <div className="task-meta">
                              <span>
                                <Clock size={11} /> {formatDueDate(task.due_date)}
                              </span>
                            </div>
                          </div>
                          <span className={"priority " + (task.priority || "medium").toLowerCase()}>{task.priority || "medium"}</span>
                          <div className="task-actions">
                            <button
                              className="task-action-btn"
                              onClick={() => {
                                setEditingItem(task);
                                setTaskForm({
                                  title: task.title || "",
                                  description: task.description || "",
                                  priority: task.priority || "medium",
                                  status: task.status || "pending",
                                  due_date: task.due_date ? task.due_date.slice(0, 16) : "",
                                });
                                setActiveModal("task");
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button className="task-action-btn task-delete-btn" onClick={() => handleDeleteTask(task.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GOALS PAGE */}
          {activePage === "Goals" && (
            <div>
              <section className="page-header">
                <div>
                  <span className="section-label">TARGETS</span>
                  <h1>Goals & Milestones</h1>
                  <p>Set long term objectives and measure your progress.</p>
                </div>
                <button
                  className="add-btn"
                  onClick={() => {
                    setEditingItem(null);
                    setGoalForm({ title: "", description: "", target_date: "", progress: 0 });
                    setActiveModal("goal");
                  }}
                >
                  <Plus size={17} /> Create Goal
                </button>
              </section>

              {goals.length === 0 ? (
                <div className="card empty-tasks">
                  <Target size={32} />
                  <p>No goals set yet. Click above to create your first goal!</p>
                </div>
              ) : (
                <div className="module-grid">
                  {goals.map((g) => (
                    <div className="item-card" key={g.id}>
                      <div>
                        <div className="item-card-header">
                          <h3>{g.title}</h3>
                          <div className="task-actions">
                            <button
                              className="task-action-btn"
                              onClick={() => {
                                setEditingItem(g);
                                setGoalForm({
                                  title: g.title,
                                  description: g.description || "",
                                  target_date: g.target_date || "",
                                  progress: g.progress || 0,
                                });
                                setActiveModal("goal");
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button className="task-action-btn task-delete-btn" onClick={() => handleDeleteGoal(g.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {g.description && <p style={{ color: "#737d8f", fontSize: "9px", marginTop: "6px" }}>{g.description}</p>}
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "6px" }}>
                          <span>Target: {g.target_date || "No date"}</span>
                          <strong>{g.progress}%</strong>
                        </div>
                        <div className="progress">
                          <div style={{ width: `${g.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HABITS PAGE */}
          {activePage === "Habits" && (
            <div>
              <section className="page-header">
                <div>
                  <span className="section-label">CONSISTENCY</span>
                  <h1>Habits Tracker</h1>
                  <p>Build daily momentum with streak tracking.</p>
                </div>
                <button
                  className="add-btn"
                  onClick={() => {
                    setHabitForm({ name: "", frequency: "daily", current_streak: 0 });
                    setActiveModal("habit");
                  }}
                >
                  <Plus size={17} /> Create Habit
                </button>
              </section>

              {habits.length === 0 ? (
                <div className="card empty-tasks">
                  <Flame size={32} />
                  <p>No habits configured. Click above to add one!</p>
                </div>
              ) : (
                <div className="module-grid">
                  {habits.map((h) => (
                    <div className="item-card" key={h.id}>
                      <div className="item-card-header">
                        <div>
                          <h3>{h.name}</h3>
                          <p>{h.frequency.toUpperCase()} HABIT</p>
                        </div>
                        <span className="streak-badge">
                          <Flame size={13} /> {h.current_streak} days
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "10px" }}>
                        <button className="streak-btn" onClick={() => handleIncrementStreak(h.id)}>
                          +1 Day Streak
                        </button>
                        <button className="task-action-btn task-delete-btn" onClick={() => handleDeleteHabit(h.id)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PROJECTS PAGE */}
          {activePage === "Projects" && (
            <div>
              <section className="page-header">
                <div>
                  <span className="section-label">WORKSPACES</span>
                  <h1>Projects</h1>
                  <p>Manage your main projects and deliverables.</p>
                </div>
                <button
                  className="add-btn"
                  onClick={() => {
                    setEditingItem(null);
                    setProjectForm({ name: "", description: "", status: "active", progress: 0 });
                    setActiveModal("project");
                  }}
                >
                  <Plus size={17} /> Create Project
                </button>
              </section>

              {projects.length === 0 ? (
                <div className="card empty-tasks">
                  <FolderKanban size={32} />
                  <p>No projects yet. Click above to create your first project!</p>
                </div>
              ) : (
                <div className="module-grid">
                  {projects.map((p) => (
                    <div className="item-card" key={p.id}>
                      <div>
                        <div className="item-card-header">
                          <h3>{p.name}</h3>
                          <div className="task-actions">
                            <button
                              className="task-action-btn"
                              onClick={() => {
                                setEditingItem(p);
                                setProjectForm({
                                  name: p.name,
                                  description: p.description || "",
                                  status: p.status || "active",
                                  progress: p.progress || 0,
                                });
                                setActiveModal("project");
                              }}
                            >
                              <Pencil size={13} />
                            </button>
                            <button className="task-action-btn task-delete-btn" onClick={() => handleDeleteProject(p.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                        {p.description && <p style={{ color: "#737d8f", fontSize: "9px", marginTop: "6px" }}>{p.description}</p>}
                      </div>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "6px" }}>
                          <span style={{ textTransform: "uppercase", color: "var(--purple-light)" }}>{p.status}</span>
                          <strong>{p.progress}%</strong>
                        </div>
                        <div className="progress">
                          <div style={{ width: `${p.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DEADLINES PAGE */}
          {activePage === "Deadlines" && (
            <div>
              <section className="page-header">
                <div>
                  <span className="section-label">SCHEDULE</span>
                  <h1>Upcoming Deadlines</h1>
                  <p>Stay ahead of critical dates and exams.</p>
                </div>
                <button
                  className="add-btn"
                  onClick={() => {
                    setDeadlineForm({ title: "", description: "", deadline: "", completed: false });
                    setActiveModal("deadline");
                  }}
                >
                  <Plus size={17} /> Add Deadline
                </button>
              </section>

              <div className="card">
                {deadlines.length === 0 ? (
                  <div className="empty-tasks">
                    <CalendarClock size={32} />
                    <p>No deadlines configured.</p>
                  </div>
                ) : (
                  <div className="deadline-list">
                    {deadlines.map((d) => {
                      const dDate = new Date(d.deadline);
                      return (
                        <div className={"deadline " + (d.completed ? "" : "deadline-urgent")} key={d.id}>
                          <div className="deadline-date">
                            <strong>{dDate.getDate()}</strong>
                            <small>{dDate.toLocaleDateString([], { month: "short" }).toUpperCase()}</small>
                          </div>
                          <div className="deadline-info">
                            <strong className={d.completed ? "task-text-done" : ""}>{d.title}</strong>
                            {d.description && <p style={{ color: "#697284", fontSize: "8px", margin: "2px 0" }}>{d.description}</p>}
                            <span>
                              <Clock size={11} /> {formatDueDate(d.deadline)}
                            </span>
                          </div>
                          <div className="task-actions">
                            <button className="task-action-btn" onClick={() => handleToggleDeadline(d)}>
                              <CircleCheck size={16} color={d.completed ? "#34d399" : "#697284"} />
                            </button>
                            <button className="task-action-btn task-delete-btn" onClick={() => handleDeleteDeadline(d.id)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EXPENSES PAGE */}
          {activePage === "Expenses" && (
            <div>
              <section className="page-header">
                <div>
                  <span className="section-label">FINANCE</span>
                  <h1>Expenses Tracker</h1>
                  <p>Track your spending and personal budget.</p>
                </div>
                <button
                  className="add-btn"
                  onClick={() => {
                    setExpenseForm({ amount: "", category: "General", description: "", expense_date: new Date().toISOString().slice(0, 10) });
                    setActiveModal("expense");
                  }}
                >
                  <Plus size={17} /> Log Expense
                </button>
              </section>

              <div className="stats" style={{ marginBottom: "20px" }}>
                <Stat
                  icon={<Wallet size={18} />}
                  label="Total Spent"
                  value={`₹${totalExpenseSpent.toLocaleString()}`}
                  info={`${expenses.length} expenses logged`}
                  trend="-4%"
                />
              </div>

              <div className="card">
                {expenses.length === 0 ? (
                  <div className="empty-tasks">
                    <Wallet size={32} />
                    <p>No expenses logged yet.</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((e) => (
                        <tr key={e.id}>
                          <td>{e.expense_date}</td>
                          <td>
                            <span className="category-tag">{e.category}</span>
                          </td>
                          <td>{e.description || "Expense"}</td>
                          <td>
                            <strong>₹{e.amount}</strong>
                          </td>
                          <td>
                            <button className="task-action-btn task-delete-btn" onClick={() => handleDeleteExpense(e.id)}>
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ANALYTICS PAGE */}
          {activePage === "Analytics" && (
            <div>
              <section className="page-header">
                <div>
                  <span className="section-label">INSIGHTS</span>
                  <h1>System Analytics</h1>
                  <p>Deep productivity metrics powered by PostgreSQL.</p>
                </div>
              </section>

              <div className="analytics-grid">
                <Stat
                  icon={<CheckSquare size={18} />}
                  label="Task Completion Rate"
                  value={`${analytics?.tasks?.completion_rate || 0}%`}
                  info={`${completedTasksCount} of ${tasks.length} tasks completed`}
                  trend="+15%"
                />
                <Stat
                  icon={<Target size={18} />}
                  label="Average Goal Progress"
                  value={`${avgGoalProgress}%`}
                  info={`Across ${goals.length} goals`}
                  trend="+8%"
                />
                <Stat
                  icon={<Flame size={18} />}
                  label="Max Habit Streak"
                  value={`${maxHabitStreak} Days`}
                  info={`Top habit streak`}
                  trend="+5 days"
                />
              </div>

              <div className="dashboard-grid">
                <div className="card">
                  <CardHeader title="Module Summary" subtitle="Live PostgreSQL database sync" />
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                      <span>Tasks Registered</span>
                      <strong>{tasks.length}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                      <span>Active Goals</span>
                      <strong>{goals.length}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                      <span>Tracked Habits</span>
                      <strong>{habits.length}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", padding: "10px", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                      <span>Expenses Logged</span>
                      <strong>₹{totalExpenseSpent.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div className="card insight-small" style={{ flexDirection: "column" }}>
                  <div className="small-ai-icon">
                    <Brain size={24} />
                  </div>
                  <h3>AI Performance Summary</h3>
                  <p style={{ marginTop: "6px" }}>
                    Your habits consistency is strong. Completing remaining high priority tasks will boost your overall weekly efficiency score to over 90%.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* QUICK ADD MODAL */}
      {showQuickAdd && (
        <div className="modal-overlay" onClick={() => setShowQuickAdd(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowQuickAdd(false)}>
              <X size={18} />
            </button>
            <div className="modal-icon">
              <Plus size={21} />
            </div>
            <span className="section-label">QUICK ADD</span>
            <h2>What do you want to add?</h2>
            <p>Add something to your personal command center.</p>

            <div className="add-options">
              <AddOption
                icon={<CheckSquare size={18} />}
                title="Task"
                description="Something you need to do"
                onClick={() => {
                  setShowQuickAdd(false);
                  setEditingItem(null);
                  setTaskForm({ title: "", description: "", priority: "medium", status: "pending", due_date: "" });
                  setActiveModal("task");
                }}
              />
              <AddOption
                icon={<Target size={18} />}
                title="Goal"
                description="Something you want to achieve"
                onClick={() => {
                  setShowQuickAdd(false);
                  setEditingItem(null);
                  setGoalForm({ title: "", description: "", target_date: "", progress: 0 });
                  setActiveModal("goal");
                }}
              />
              <AddOption
                icon={<Wallet size={18} />}
                title="Expense"
                description="Money you've spent"
                onClick={() => {
                  setShowQuickAdd(false);
                  setExpenseForm({ amount: "", category: "General", description: "", expense_date: new Date().toISOString().slice(0, 10) });
                  setActiveModal("expense");
                }}
              />
              <AddOption
                icon={<CalendarClock size={18} />}
                title="Deadline"
                description="Something important to remember"
                onClick={() => {
                  setShowQuickAdd(false);
                  setDeadlineForm({ title: "", description: "", deadline: "", completed: false });
                  setActiveModal("deadline");
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {activeModal === "task" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setActiveModal(null)}>
              <X size={18} />
            </button>
            <div className="modal-icon">
              <CheckSquare size={21} />
            </div>
            <span className="section-label">{editingItem ? "EDIT TASK" : "CREATE TASK"}</span>
            <h2>{editingItem ? "Edit task details" : "Add a new task"}</h2>
            <form onSubmit={handleSaveTask} className="task-form">
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Task title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Description..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <div className="priority-selector">
                  {["low", "medium", "high"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={"priority-btn " + p + (taskForm.priority === p ? " selected" : "")}
                      onClick={() => setTaskForm({ ...taskForm, priority: p })}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingItem ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GOAL MODAL */}
      {activeModal === "goal" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setActiveModal(null)}>
              <X size={18} />
            </button>
            <div className="modal-icon">
              <Target size={21} />
            </div>
            <span className="section-label">{editingItem ? "EDIT GOAL" : "CREATE GOAL"}</span>
            <h2>{editingItem ? "Edit Goal" : "Add New Goal"}</h2>
            <form onSubmit={handleSaveGoal} className="task-form">
              <div className="form-group">
                <label className="form-label">Goal Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Goal title"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Details..."
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={goalForm.target_date}
                  onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Progress ({goalForm.progress}%)</label>
                <div className="slider-group">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goalForm.progress}
                    onChange={(e) => setGoalForm({ ...goalForm, progress: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HABIT MODAL */}
      {activeModal === "habit" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setActiveModal(null)}>
              <X size={18} />
            </button>
            <div className="modal-icon">
              <Flame size={21} />
            </div>
            <span className="section-label">CREATE HABIT</span>
            <h2>Track a New Habit</h2>
            <form onSubmit={handleSaveHabit} className="task-form">
              <div className="form-group">
                <label className="form-label">Habit Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Read 20 pages"
                  value={habitForm.name}
                  onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Frequency</label>
                <select
                  className="form-select"
                  value={habitForm.frequency}
                  onChange={(e) => setHabitForm({ ...habitForm, frequency: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Initial Streak (Days)</label>
                <input
                  type="number"
                  className="form-input"
                  value={habitForm.current_streak}
                  onChange={(e) => setHabitForm({ ...habitForm, current_streak: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}
      {activeModal === "expense" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setActiveModal(null)}>
              <X size={18} />
            </button>
            <div className="modal-icon">
              <Wallet size={21} />
            </div>
            <span className="section-label">LOG EXPENSE</span>
            <h2>Record an Expense</h2>
            <form onSubmit={handleSaveExpense} className="task-form">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="0.00"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Food, College, Tech"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Description..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Log Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROJECT MODAL */}
      {activeModal === "project" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setActiveModal(null)}>
              <X size={18} />
            </button>
            <div className="modal-icon">
              <FolderKanban size={21} />
            </div>
            <span className="section-label">{editingItem ? "EDIT PROJECT" : "CREATE PROJECT"}</span>
            <h2>{editingItem ? "Edit Project" : "New Project"}</h2>
            <form onSubmit={handleSaveProject} className="task-form">
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Project name"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  placeholder="Description..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Progress ({projectForm.progress}%)</label>
                <div className="slider-group">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={projectForm.progress}
                    onChange={(e) => setProjectForm({ ...projectForm, progress: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEADLINE MODAL */}
      {activeModal === "deadline" && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setActiveModal(null)}>
              <X size={18} />
            </button>
            <div className="modal-icon">
              <CalendarClock size={21} />
            </div>
            <span className="section-label">CREATE DEADLINE</span>
            <h2>Set a Deadline</h2>
            <form onSubmit={handleSaveDeadline} className="task-form">
              <div className="form-group">
                <label className="form-label">Deadline Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Project Submission"
                  value={deadlineForm.title}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={deadlineForm.deadline}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, deadline: e.target.value })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Set Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, info, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">{icon}</div>
        <span className="stat-trend">↗ {trend}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-label">{label}</span>
      <small>{info}</small>
    </div>
  );
}

function CardHeader({ title, subtitle, onViewAll }) {
  return (
    <div className="card-header">
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <button onClick={onViewAll}>
        View all
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

function AddOption({ icon, title, description, onClick }) {
  return (
    <button className="add-option" onClick={onClick}>
      <div>{icon}</div>
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <ChevronRight size={15} />
    </button>
  );
}

export default App;