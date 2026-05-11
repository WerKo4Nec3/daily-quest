import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEYS = {
  tasks: 'dailyQuest.tasks',
  completions: 'dailyQuest.completions'
}

const defaultTasks = [
  {
    id: 'task-1',
    title: 'Учить японский',
    description: 'Повторить слова, сделать несколько предложений и прочитать короткий текст.',
    points: 10,
    isDaily: true,
    isActive: true,
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z'
  },
  {
    id: 'task-2',
    title: 'Сделать зарядку',
    description: 'Лёгкая разминка, упражнения для спины, плеч и рук.',
    points: 5,
    isDaily: true,
    isActive: true,
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z'
  },
  {
    id: 'task-3',
    title: 'Работать над проектом',
    description: 'Сделать хотя бы один небольшой шаг по своему проекту.',
    points: 20,
    isDaily: true,
    isActive: true,
    createdAt: '2026-05-11T00:00:00.000Z',
    updatedAt: '2026-05-11T00:00:00.000Z'
  }
]

const initialTaskForm = {
  title: '',
  description: '',
  points: '10'
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function createId(prefix) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeTask(task) {
  return {
    id: task.id ?? createId('task'),
    title: task.title ?? 'Без названия',
    description: task.description ?? '',
    points: Number(task.points) || 1,
    isDaily: task.isDaily ?? true,
    isActive: task.isActive ?? true,
    createdAt: task.createdAt ?? new Date().toISOString(),
    updatedAt: task.updatedAt ?? new Date().toISOString()
  }
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.tasks)

    if (!savedTasks) {
      return defaultTasks
    }

    const parsedTasks = JSON.parse(savedTasks)

    if (!Array.isArray(parsedTasks)) {
      return defaultTasks
    }

    return parsedTasks.map(normalizeTask)
  } catch (error) {
    console.error('Не удалось загрузить задачи:', error)
    return defaultTasks
  }
}

function loadCompletions() {
  try {
    const savedCompletions = localStorage.getItem(STORAGE_KEYS.completions)

    if (!savedCompletions) {
      return []
    }

    const parsedCompletions = JSON.parse(savedCompletions)

    if (!Array.isArray(parsedCompletions)) {
      return []
    }

    return parsedCompletions
  } catch (error) {
    console.error('Не удалось загрузить выполнения:', error)
    return []
  }
}

function App() {
  const [activePage, setActivePage] = useState('today')

  const [tasks, setTasks] = useState(loadTasks)
  const [completions, setCompletions] = useState(loadCompletions)

  const [selectedTaskId, setSelectedTaskId] = useState(null)

  const [taskFormMode, setTaskFormMode] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [taskForm, setTaskForm] = useState(initialTaskForm)
  const [formError, setFormError] = useState('')

  const todayDateKey = getLocalDateKey()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.completions, JSON.stringify(completions))
  }, [completions])

  const todayText = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date())

  const todayTasks = useMemo(() => {
    return tasks.filter((task) => task.isDaily && task.isActive)
  }, [tasks])

  const todayCompletions = useMemo(() => {
    return completions.filter((completion) => completion.date === todayDateKey)
  }, [completions, todayDateKey])

  const completedTaskIdsToday = useMemo(() => {
    return new Set(todayCompletions.map((completion) => completion.taskId))
  }, [todayCompletions])

  const completedTasksCount = useMemo(() => {
    return todayTasks.filter((task) => completedTaskIdsToday.has(task.id)).length
  }, [todayTasks, completedTaskIdsToday])

  const todayPoints = useMemo(() => {
    return todayCompletions.reduce((sum, completion) => sum + completion.points, 0)
  }, [todayCompletions])

  const totalPoints = useMemo(() => {
    return completions.reduce((sum, completion) => sum + completion.points, 0)
  }, [completions])

  const activeTasksCount = useMemo(() => {
    return tasks.filter((task) => task.isActive).length
  }, [tasks])

  const inactiveTasksCount = tasks.length - activeTasksCount
  const totalTasksCount = todayTasks.length
  const totalCompletionsCount = completions.length

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) {
      return null
    }

    return tasks.find((task) => task.id === selectedTaskId) ?? null
  }, [selectedTaskId, tasks])

  const editingTask = useMemo(() => {
    if (!editingTaskId) {
      return null
    }

    return tasks.find((task) => task.id === editingTaskId) ?? null
  }, [editingTaskId, tasks])

  const isTaskFormOpen = taskFormMode !== null

  function isTaskCompletedToday(taskId) {
    return completedTaskIdsToday.has(taskId)
  }

  function toggleTask(task) {
    const alreadyCompleted = isTaskCompletedToday(task.id)

    if (alreadyCompleted) {
      setCompletions((currentCompletions) =>
        currentCompletions.filter(
          (completion) => !(completion.taskId === task.id && completion.date === todayDateKey)
        )
      )

      return
    }

    const newCompletion = {
      id: createId('completion'),
      taskId: task.id,
      date: todayDateKey,
      points: task.points,
      completedAt: new Date().toISOString()
    }

    setCompletions((currentCompletions) => [...currentCompletions, newCompletion])
  }

  function toggleTaskActive(taskId) {
    const now = new Date().toISOString()

    setTasks((currentTasks) =>
      currentTasks.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        return {
          ...task,
          isActive: !task.isActive,
          updatedAt: now
        }
      })
    )
  }

  function openCreateTaskModal() {
    setSelectedTaskId(null)
    setEditingTaskId(null)
    setTaskForm(initialTaskForm)
    setFormError('')
    setTaskFormMode('create')
  }

  function openEditTaskModal(task) {
    setSelectedTaskId(null)
    setEditingTaskId(task.id)
    setTaskForm({
      title: task.title,
      description: task.description,
      points: String(task.points)
    })
    setFormError('')
    setTaskFormMode('edit')
  }

  function closeTaskFormModal() {
    setTaskFormMode(null)
    setEditingTaskId(null)
    setTaskForm(initialTaskForm)
    setFormError('')
  }

  function updateTaskForm(field, value) {
    setTaskForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }))
  }

  function saveTask(event) {
    event.preventDefault()

    const title = taskForm.title.trim()
    const description = taskForm.description.trim()
    const points = Number(taskForm.points)

    if (!title) {
      setFormError('Введите название задачи.')
      return
    }

    if (!Number.isFinite(points) || points <= 0) {
      setFormError('Баллы должны быть числом больше 0.')
      return
    }

    const roundedPoints = Math.round(points)
    const now = new Date().toISOString()

    if (taskFormMode === 'create') {
      const newTask = {
        id: createId('task'),
        title,
        description,
        points: roundedPoints,
        isDaily: true,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }

      setTasks((currentTasks) => [...currentTasks, newTask])
      closeTaskFormModal()
      return
    }

    if (taskFormMode === 'edit') {
      if (!editingTask) {
        setFormError('Не удалось найти задачу для редактирования.')
        return
      }

      setTasks((currentTasks) =>
        currentTasks.map((task) => {
          if (task.id !== editingTask.id) {
            return task
          }

          return {
            ...task,
            title,
            description,
            points: roundedPoints,
            updatedAt: now
          }
        })
      )

      setCompletions((currentCompletions) =>
        currentCompletions.map((completion) => {
          const isTodayCompletion =
            completion.taskId === editingTask.id && completion.date === todayDateKey

          if (!isTodayCompletion) {
            return completion
          }

          return {
            ...completion,
            points: roundedPoints
          }
        })
      )

      closeTaskFormModal()
    }
  }

  function deleteTask(taskId) {
    const shouldDelete = window.confirm(
      'Удалить задачу? Все выполнения этой задачи тоже будут удалены.'
    )

    if (!shouldDelete) {
      return
    }

    setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId))
    setCompletions((currentCompletions) =>
      currentCompletions.filter((completion) => completion.taskId !== taskId)
    )
    setSelectedTaskId(null)
  }

  function closeTaskDetails() {
    setSelectedTaskId(null)
  }

  return (
    <main className="app">
      <section className="content-shell">
        {activePage === 'today' && (
          <section className="today-page">
            <header className="page-header">
              <div>
                <p className="date-label">{todayText}</p>
                <h1>Сегодня</h1>
              </div>

              <button className="add-button" type="button" onClick={openCreateTaskModal}>
                +
              </button>
            </header>

            <section className="summary-card">
              <div>
                <p className="summary-label">Баллы сегодня</p>
                <p className="summary-value">{todayPoints}</p>
              </div>

              <div>
                <p className="summary-label">Выполнено</p>
                <p className="summary-value">
                  {completedTasksCount} / {totalTasksCount}
                </p>
              </div>
            </section>

            <section className="task-list">
              {todayTasks.length === 0 && (
                <div className="empty-card">
                  <h2>На сегодня задач нет</h2>
                  <p>Нажмите на кнопку “+”, чтобы создать первую ежедневную задачу.</p>
                </div>
              )}

              {todayTasks.map((task) => {
                const completed = isTaskCompletedToday(task.id)

                return (
                  <article
                    className={`task-card ${completed ? 'task-card-completed' : ''}`}
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <button
                      className="task-checkbox"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleTask(task)
                      }}
                      aria-label={completed ? 'Отменить выполнение' : 'Выполнить задачу'}
                    >
                      {completed ? '✓' : ''}
                    </button>

                    <div className="task-info">
                      <h2>{task.title}</h2>
                      <p>{task.description || 'Описание не добавлено'}</p>
                    </div>

                    <div className="task-points">+{task.points}</div>
                  </article>
                )
              })}
            </section>
          </section>
        )}

        {activePage === 'tasks' && (
          <section className="tasks-page">
            <header className="page-header">
              <div>
                <p className="date-label">Управление задачами</p>
                <h1>Все задачи</h1>
              </div>

              <button className="add-button" type="button" onClick={openCreateTaskModal}>
                +
              </button>
            </header>

            <section className="task-list">
              {tasks.length === 0 && (
                <div className="empty-card">
                  <h2>Задач пока нет</h2>
                  <p>Создайте первую задачу, и она появится на экране “Сегодня”.</p>
                </div>
              )}

              {tasks.map((task) => (
                <article className="management-card" key={task.id}>
                  <div className="management-main">
                    <div>
                      <div className="management-title-row">
                        <h2>{task.title}</h2>

                        <span className={`status-pill ${task.isActive ? 'active' : 'inactive'}`}>
                          {task.isActive ? 'Активна' : 'Отключена'}
                        </span>
                      </div>

                      <p>{task.description || 'Описание не добавлено'}</p>
                    </div>

                    <div className="task-points">+{task.points}</div>
                  </div>

                  <div className="management-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      Подробнее
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => openEditTaskModal(task)}
                    >
                      Редактировать
                    </button>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => toggleTaskActive(task.id)}
                    >
                      {task.isActive ? 'Отключить' : 'Включить'}
                    </button>

                    <button
                      className="danger-button"
                      type="button"
                      onClick={() => deleteTask(task.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </section>
        )}

        {activePage === 'stats' && (
          <section className="stats-page">
            <header className="page-header">
              <div>
                <p className="date-label">Прогресс и история</p>
                <h1>Статистика</h1>
              </div>
            </header>

            <section className="stats-grid">
              <article className="stat-card">
                <p className="summary-label">Баллы сегодня</p>
                <p className="summary-value">{todayPoints}</p>
              </article>

              <article className="stat-card">
                <p className="summary-label">Всего баллов</p>
                <p className="summary-value">{totalPoints}</p>
              </article>

              <article className="stat-card">
                <p className="summary-label">Выполнено сегодня</p>
                <p className="summary-value">
                  {completedTasksCount} / {totalTasksCount}
                </p>
              </article>

              <article className="stat-card">
                <p className="summary-label">Всего выполнений</p>
                <p className="summary-value">{totalCompletionsCount}</p>
              </article>

              <article className="stat-card">
                <p className="summary-label">Активные задачи</p>
                <p className="summary-value">{activeTasksCount}</p>
              </article>

              <article className="stat-card">
                <p className="summary-label">Отключённые задачи</p>
                <p className="summary-value">{inactiveTasksCount}</p>
              </article>
            </section>

            <div className="empty-card stats-note">
              <h2>Позже добавим графики</h2>
              <p>
                Здесь можно будет показать серию дней, календарь активности, уровни и прогресс по
                каждой задаче.
              </p>
            </div>
          </section>
        )}
      </section>

      <nav className="bottom-nav" aria-label="Главная навигация">
        <button
          className={`nav-button ${activePage === 'today' ? 'nav-button-active' : ''}`}
          type="button"
          onClick={() => setActivePage('today')}
        >
          <span>Сегодня</span>
        </button>

        <button
          className={`nav-button ${activePage === 'tasks' ? 'nav-button-active' : ''}`}
          type="button"
          onClick={() => setActivePage('tasks')}
        >
          <span>Задачи</span>
        </button>

        <button
          className={`nav-button ${activePage === 'stats' ? 'nav-button-active' : ''}`}
          type="button"
          onClick={() => setActivePage('stats')}
        >
          <span>Статистика</span>
        </button>
      </nav>

      {selectedTask && (
        <div className="modal-overlay" onClick={closeTaskDetails}>
          <section className="task-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedTask.title}</h2>

              <button className="close-button" type="button" onClick={closeTaskDetails}>
                ×
              </button>
            </div>

            <p className="modal-description">
              {selectedTask.description || 'Описание для этой задачи пока не добавлено.'}
            </p>

            <div className="modal-info-row">
              <span>Баллы</span>
              <strong>+{selectedTask.points}</strong>
            </div>

            <div className="modal-info-row">
              <span>Тип</span>
              <strong>{selectedTask.isDaily ? 'Ежедневная' : 'Обычная'}</strong>
            </div>

            <div className="modal-info-row">
              <span>Активность</span>
              <strong>{selectedTask.isActive ? 'Активна' : 'Отключена'}</strong>
            </div>

            <div className="modal-info-row">
              <span>Статус сегодня</span>
              <strong>
                {isTaskCompletedToday(selectedTask.id) ? 'Выполнена' : 'Не выполнена'}
              </strong>
            </div>

            {selectedTask.isActive && (
              <button
                className="modal-action-button"
                type="button"
                onClick={() => toggleTask(selectedTask)}
              >
                {isTaskCompletedToday(selectedTask.id)
                  ? 'Отменить выполнение'
                  : 'Выполнить задачу'}
              </button>
            )}

            <div className="modal-actions-grid">
              <button
                className="secondary-button"
                type="button"
                onClick={() => openEditTaskModal(selectedTask)}
              >
                Редактировать
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() => toggleTaskActive(selectedTask.id)}
              >
                {selectedTask.isActive ? 'Отключить' : 'Включить'}
              </button>

              <button
                className="danger-button modal-wide-button"
                type="button"
                onClick={() => deleteTask(selectedTask.id)}
              >
                Удалить
              </button>
            </div>
          </section>
        </div>
      )}

      {isTaskFormOpen && (
        <div className="modal-overlay" onClick={closeTaskFormModal}>
          <section className="task-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>{taskFormMode === 'create' ? 'Новая задача' : 'Редактирование задачи'}</h2>

              <button className="close-button" type="button" onClick={closeTaskFormModal}>
                ×
              </button>
            </div>

            <form className="task-form" onSubmit={saveTask}>
              <label className="form-field">
                <span>Название</span>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(event) => updateTaskForm('title', event.target.value)}
                  placeholder="Например: Учить японский"
                  autoFocus
                />
              </label>

              <label className="form-field">
                <span>Описание</span>
                <textarea
                  value={taskForm.description}
                  onChange={(event) => updateTaskForm('description', event.target.value)}
                  placeholder="Что именно нужно сделать?"
                  rows="4"
                />
              </label>

              <label className="form-field">
                <span>Баллы</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={taskForm.points}
                  onChange={(event) => updateTaskForm('points', event.target.value)}
                />
              </label>

              <div className="daily-note">
                Эта задача будет появляться каждый день без привязки ко времени.
              </div>

              {formError && <p className="form-error">{formError}</p>}

              <button className="modal-action-button" type="submit">
                {taskFormMode === 'create' ? 'Создать задачу' : 'Сохранить изменения'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default App