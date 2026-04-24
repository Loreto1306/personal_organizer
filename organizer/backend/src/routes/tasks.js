import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar todas as tarefas e suas conclusões
router.get('/', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC').all();
    const completions = db.prepare('SELECT * FROM task_completions').all();
    
    const formattedTasks = tasks.map(t => ({ 
      ...t, 
      completed: !!t.completed,
      recurringDays: t.recurringDays ? JSON.parse(t.recurringDays) : [],
      completions: completions.filter(c => c.taskId === t.id).map(c => c.date)
    }));
    
    res.json(formattedTasks);
  } catch (error) {
    console.error("GET /tasks error:", error);
    res.status(500).json({ status: 'error', message: 'Erro crítico ao sincronizar pipeline.' });
  }
});

// Criar nova tarefa
router.post('/', (req, res) => {
  const { title, description, dueDate, startTime, category, priority, objectiveId, type, frequency, recurringDays } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO tasks (id, title, description, dueDate, startTime, category, priority, objectiveId, type, frequency, recurringDays)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      title, 
      description || null, 
      dueDate || null, 
      startTime || null,
      category || 'work', 
      priority || 'medium', 
      objectiveId || null,
      type || 'event',
      frequency || 'none',
      recurringDays ? JSON.stringify(recurringDays) : null
    );

    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.status(201).json({ 
      status: 'success', 
      message: 'Ação capturada com sucesso.', 
      data: { 
        ...newTask, 
        completed: !!newTask.completed, 
        completions: [],
        recurringDays: newTask.recurringDays ? JSON.parse(newTask.recurringDays) : []
      } 
    });
  } catch (error) {
    console.error("POST /tasks error:", error);
    res.status(400).json({ status: 'error', message: 'Falha na captura: Parâmetros inválidos.' });
  }
});

// Alternar conclusão em uma data específica
router.post('/:id/toggle-date', (req, res) => {
  const { id } = req.params;
  const { date } = req.body;
  
  try {
    const existing = db.prepare('SELECT id FROM task_completions WHERE taskId = ? AND date = ?').get(id, date);
    
    if (existing) {
      db.prepare('DELETE FROM task_completions WHERE id = ?').run(existing.id);
      res.json({ status: 'success', message: 'Registro de rotina removido.', action: 'removed' });
    } else {
      const completionId = uuidv4();
      db.prepare('INSERT INTO task_completions (id, taskId, date) VALUES (?, ?, ?)').run(completionId, id, date);
      res.json({ status: 'success', message: 'Rotina concluída com sucesso.', action: 'added' });
    }
  } catch (error) {
    console.error("POST /toggle-date error:", error);
    res.status(400).json({ status: 'error', message: 'Falha ao processar registro de rotina.' });
  }
});

// Atualizar tarefa
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, completed, dueDate, startTime, category, priority, objectiveId, type, frequency, recurringDays } = req.body;
  
  try {
    const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ status: 'error', message: 'Ação não encontrada no sistema.' });

    db.prepare(`
      UPDATE tasks 
      SET title = ?, description = ?, completed = ?, dueDate = ?, startTime = ?, category = ?, priority = ?, objectiveId = ?, type = ?, frequency = ?, recurringDays = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title !== undefined ? title : current.title,
      description !== undefined ? description : current.description,
      completed !== undefined ? (completed ? 1 : 0) : current.completed,
      dueDate !== undefined ? dueDate : current.dueDate,
      startTime !== undefined ? startTime : current.startTime,
      category !== undefined ? category : current.category,
      priority !== undefined ? priority : current.priority,
      objectiveId !== undefined ? objectiveId : current.objectiveId,
      type !== undefined ? type : current.type,
      frequency !== undefined ? frequency : current.frequency,
      recurringDays !== undefined ? JSON.stringify(recurringDays) : current.recurringDays,
      id
    );

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    const completions = db.prepare('SELECT date FROM task_completions WHERE taskId = ?').all(id);
    
    res.json({ 
      status: 'success', 
      message: 'Parâmetros atualizados com sucesso.', 
      data: { 
        ...updatedTask, 
        completed: !!updatedTask.completed, 
        completions: completions.map(c => c.date),
        recurringDays: updatedTask.recurringDays ? JSON.parse(updatedTask.recurringDays) : []
      } 
    });
  } catch (error) {
    console.error("PATCH /tasks error:", error);
    res.status(400).json({ status: 'error', message: 'Erro ao processar atualização técnica.' });
  }
});

// Deletar tarefa
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM task_completions WHERE taskId = ?').run(id);
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ status: 'success', message: 'Ação removida do pipeline.' });
  } catch (error) {
    console.error("DELETE /tasks error:", error);
    res.status(400).json({ status: 'error', message: 'Falha ao deletar registro.' });
  }
});

export default router;
