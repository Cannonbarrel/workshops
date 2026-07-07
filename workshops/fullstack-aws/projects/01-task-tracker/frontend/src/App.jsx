import { useState, useEffect } from 'react'
import { Container, Typography, Box, Button, CircularProgress, Alert } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import TaskBoard from './components/TaskBoard'
import TaskForm from './components/TaskForm'
import { getTasks, createTask, updateTask, deleteTask } from './api'

export default function App() {
  const [tasks, setTasks]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => { fetchTasks() }, [])

  async function fetchTasks() {
    try {
      setLoading(true)
      const data = await getTasks()
      setTasks(data.tasks || [])
    } catch (e) {
      setError('Failed to load tasks. Check your API URL.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(task) {
    try {
      const data = await createTask(task)
      if (data.task) {
        setTasks(prev => [...prev, data.task])
        setFormOpen(false)
      } else {
        setError(`Failed to create task: ${data.error || 'Unknown error'}`)
      }
    } catch (e) {
      setError(`API error: ${e.message}`)
    }
  }

  async function handleStatusChange(id, status) {
    await updateTask(id, { status })
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  async function handleDelete(id) {
    await deleteTask(id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2, px: 3, mb: 3 }}>
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">Task Tracker</Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={() => setFormOpen(true)}
          >
            Add Task
          </Button>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading
          ? <Box display="flex" justifyContent="center" mt={8}><CircularProgress /></Box>
          : <TaskBoard tasks={tasks} onStatusChange={handleStatusChange} onDelete={handleDelete} />
        }
      </Container>

      <TaskForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleCreate} />
    </Box>
  )
}
