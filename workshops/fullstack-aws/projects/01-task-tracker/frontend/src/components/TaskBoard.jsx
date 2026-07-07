import { Grid, Typography, Box, Paper } from '@mui/material'
import { useMediaQuery } from 'react-responsive'
import TaskCard from './TaskCard'

const COLUMNS = [
  { key: 'todo',        label: 'Todo',        color: '#1976d2' },
  { key: 'in-progress', label: 'In Progress', color: '#ed6c02' },
  { key: 'done',        label: 'Done',        color: '#2e7d32' },
]

export default function TaskBoard({ tasks, onStatusChange, onDelete }) {
  const isMobile = useMediaQuery({ maxWidth: 768 })

  return (
    <Grid container spacing={2} direction={isMobile ? 'column' : 'row'}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key)
        return (
          <Grid item xs={12} md={4} key={col.key}>
            <Paper elevation={2} sx={{ p: 2, minHeight: 400, bgcolor: '#fafafa' }}>
              <Box display="flex" alignItems="center" mb={2} gap={1}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: col.color }} />
                <Typography variant="subtitle1" fontWeight="bold">{col.label}</Typography>
                <Typography variant="caption" color="text.secondary">({colTasks.length})</Typography>
              </Box>

              {colTasks.length === 0
                ? <Typography variant="body2" color="text.secondary" textAlign="center" mt={4}>No tasks</Typography>
                : colTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={onStatusChange}
                      onDelete={onDelete}
                    />
                  ))
              }
            </Paper>
          </Grid>
        )
      })}
    </Grid>
  )
}
