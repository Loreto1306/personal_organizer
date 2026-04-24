import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar todas as tarefas
router.get('/', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all();
    // Converter 0/1 do SQLite para boolean para o frontend
    const formattedTasks = tasks.map(t => ({ ...t, completed: !!t.completed }));
    res.json(formattedTasks);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tarefas' });
  }
});

// Criar nova tarefa
router.post('/', (req, res) => {
  const { title, description, dueDate } = req.body;
  const id = uuidv4();
  try {
    const info = db.prepare(`
      INSERT INTO tasks (id, title, description, dueDate)
      VALUES (?, ?, ?, ?)
    `).run(id, title, description || null, dueDate || null);

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.status(201).json({ ...newTask, completed: !!newTask.completed });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar tarefa' });
  }
});

// Atualizar tarefa
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, completed, dueDate } = req.body;
  
  try {
    // Busca tarefa atual
    const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Tarefa não encontrada' });

    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, completed = ?, dueDate = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title !== undefined ? title : current.title,
      description !== undefined ? description : current.description,
      completed !== undefined ? (completed ? 1 : 0) : current.completed,
      dueDate !== undefined ? dueDate : current.dueDate,
      id
    );

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json({ ...updatedTask, completed: !!updatedTask.completed });
  } catch (error) {
    res.status(400).json({ error: 'Erro ao atualizar tarefa' });
  }
});

// Deletar tarefa
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: 'Erro ao deletar tarefa' });
  }
});

export default router;
