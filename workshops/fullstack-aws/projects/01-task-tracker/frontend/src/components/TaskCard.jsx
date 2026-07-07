import { Card, CardContent, Typography, Chip, IconButton, Box, Menu, MenuItem } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import { useState } from 'react'

const PRIORITY_COLORS = { low: 'success', medium: 'warning', high: 'error' }

const STATUS_TRANSITIONS = {
  'todo':        ['in-progress'],
  'in-progress': ['todo', 'done'],
  'done':        ['in-progress'],
}

const STATUS_LABELS = {
  'todo':        'Todo',
  'in-progress': 'In Progress',
  'done':        'Done',
}

export default function TaskCard({ task, onStatusChange, onDelete }) {
  const [anchor, setAnchor] = useState(null)
  const nextStatuses = STATUS_TRANSITIONS[task.status] || []

  return (
    <Card sx={{ mb: 1.5 }} elevation={1}>
      <CardContent sx={{ pb: '12px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="subtitle2" fontWeight="bold" sx={{ flex: 1 }}>
            {task.title}
          </Typography>
          <IconButton size="small" onClick={e => setAnchor(e.currentTarget)}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {task.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1 }}>
            {task.description}
          </Typography>
        )}

        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
          <Chip
            label={task.priority}
            color={PRIORITY_COLORS[task.priority] || 'default'}
            size="small"
            variant="outlined"
          />
        </Box>

        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
          {nextStatuses.map(s => (
            <MenuItem key={s} onClick={() => { onStatusChange(task.id, s); setAnchor(null) }}>
              Move to {STATUS_LABELS[s]}
            </MenuItem>
          ))}
          <MenuItem onClick={() => { onDelete(task.id); setAnchor(null) }} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  )
}
