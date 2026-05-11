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
  if (crypto.randomUUID) {
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
  const [tasks, setTasks] = useState(loadTasks)
  const [completions, setCompletions] = useState(loadCompletions)
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
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

  const totalTasksCount = todayTasks.length

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) {
      return null
    }

    return tasks.find((task) => task.id === selectedTaskId) ?? null
  }, [selectedTaskId, tasks])

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

  function openCreateTaskModal() {
    setSelectedTaskId(null)
    setTaskForm(initialTaskForm)
    setFormError('')
    setIsCreateModalOpen(true)
  }

  function closeCreateTaskModal() {
    setIsCreateModalOpen(false)
    setTaskForm(initialTaskForm)
    setFormError('')
  }

  function updateTaskForm(field, value) {
    setTaskForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }))
  }

  function createTask(event) {
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

    const now = new Date().toISOString()

    const newTask = {
      id: createId('task'),
      title,
      description,
      points: Math.round(points),
      isDaily: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    }

    setTasks((currentTasks) => [...currentTasks, newTask])
    closeCreateTaskModal()
  }

  function closeTaskDetails() {
    setSelectedTaskId(null)
  }

  return (
    <main className="app">
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
              <span>Статус сегодня</span>
              <strong>
                {isTaskCompletedToday(selectedTask.id) ? 'Выполнена' : 'Не выполнена'}
              </strong>
            </div>

            <button
              className="modal-action-button"
              type="button"
              onClick={() => toggleTask(selectedTask)}
            >
              {isTaskCompletedToday(selectedTask.id)
                ? 'Отменить выполнение'
                : 'Выполнить задачу'}
            </button>
          </section>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={closeCreateTaskModal}>
          <section className="task-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Новая задача</h2>

              <button className="close-button" type="button" onClick={closeCreateTaskModal}>
                ×
              </button>
            </div>

            <form className="task-form" onSubmit={createTask}>
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
                Создать задачу
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

export default App