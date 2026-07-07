import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Stack
} from '@mui/material'
import { useState } from 'react'

const DEFAULT = { title: '', description: '', priority: 'medium' }

export default function TaskForm({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(DEFAULT)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit() {
    if (!form.title.trim()) return
    onSubmit(form)
    setForm(DEFAULT)
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>New Task</DialogTitle>
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            fullWidth
            autoFocus
          />
          <TextField
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label="Priority"
            name="priority"
            value={form.priority}
            onChange={handleChange}
            select
            fullWidth
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!form.title.trim()}>
          Create Task
        </Button>
      </DialogActions>
    </Dialog>
  )
}
