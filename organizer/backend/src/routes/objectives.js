import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar objetivos com progresso calculado e metas
router.get('/', (req, res) => {
  try {
    const objectives = db.prepare('SELECT * FROM objectives ORDER BY createdAt DESC').all();
    
    const objectivesWithStats = objectives.map(obj => {
      const goals = db.prepare('SELECT * FROM goals WHERE objectiveId = ?').all(obj.id);
      
      // Cálculo de progresso baseado nas tarefas vinculadas
      const taskStats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
        FROM tasks 
        WHERE objectiveId = ?
      `).get(obj.id);

      const progress = taskStats.total > 0 
        ? Math.round((taskStats.completed / taskStats.total) * 100) 
        : 0;

      return { 
        ...obj, 
        goals, 
        progress,
        stats: {
          totalTasks: taskStats.total,
          completedTasks: taskStats.completed
        }
      };
    });
    
    res.json(objectivesWithStats);
  } catch (error) {
    console.error("Erro ao carregar objetivos:", error);
    res.status(500).json({ status: 'error', message: 'Falha ao sincronizar objetivos estratégicos.' });
  }
});

// Criar objetivo
router.post('/', (req, res) => {
  const { title, description, deadline } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO objectives (id, title, description, deadline)
      VALUES (?, ?, ?, ?)
    `).run(id, title, description || null, deadline || null);

    const newObjective = db.prepare('SELECT * FROM objectives WHERE id = ?').get(id);
    res.status(201).json({ status: 'success', message: 'Objetivo de Elite estabelecido.', data: { ...newObjective, goals: [] } });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Erro ao registrar nova diretriz estratégica.' });
  }
});

// Atualizar objetivo
router.patch('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, deadline } = req.body;
  try {
    db.prepare(`
      UPDATE objectives 
      SET title = COALESCE(?, title), 
          description = COALESCE(?, description), 
          deadline = COALESCE(?, deadline)
      WHERE id = ?
    `).run(title, description, deadline, id);

    const updated = db.prepare('SELECT * FROM objectives WHERE id = ?').get(id);
    res.json({ status: 'success', message: 'Diretriz atualizada.', data: updated });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Falha ao atualizar objetivo.' });
  }
});

// Deletar objetivo
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM goals WHERE objectiveId = ?').run(id);
    db.prepare('UPDATE tasks SET objectiveId = NULL WHERE objectiveId = ?').run(id);
    db.prepare('DELETE FROM objectives WHERE id = ?').run(id);
    res.json({ status: 'success', message: 'Objetivo removido do pipeline.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Erro ao deletar objetivo.' });
  }
});

// Criar meta vinculada a um objetivo
router.post('/:objectiveId/goals', (req, res) => {
  const { objectiveId } = req.params;
  const { title, description, targetValue } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO goals (id, title, description, targetValue, objectiveId)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, title, description || null, parseFloat(targetValue), objectiveId);

    const newGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    res.status(201).json({ status: 'success', message: 'Meta vinculada ao objetivo mestre.', data: newGoal });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Falha ao criar meta secundária.' });
  }
});

// Atualizar meta
router.patch('/:objectiveId/goals/:goalId', (req, res) => {
  const { goalId } = req.params;
  const { title, description, targetValue, currentValue } = req.body;
  try {
    db.prepare(`
      UPDATE goals 
      SET title = COALESCE(?, title), 
          description = COALESCE(?, description), 
          targetValue = COALESCE(?, targetValue),
          currentValue = COALESCE(?, currentValue)
      WHERE id = ?
    `).run(title, description, targetValue, currentValue, goalId);

    const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId);
    res.json({ status: 'success', message: 'Meta atualizada.', data: updated });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Falha ao atualizar meta.' });
  }
});

// Deletar meta
router.delete('/:objectiveId/goals/:goalId', (req, res) => {
  const { goalId } = req.params;
  try {
    db.prepare('DELETE FROM goals WHERE id = ?').run(goalId);
    res.json({ status: 'success', message: 'Meta removida.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Erro ao deletar meta.' });
  }
});

export default router;
