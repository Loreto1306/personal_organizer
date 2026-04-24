import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar objetivos com suas respectivas metas
router.get('/', (req, res) => {
  try {
    const objectives = db.prepare('SELECT * FROM objectives ORDER BY createdAt DESC').all();
    const objectivesWithGoals = objectives.map(obj => {
      const goals = db.prepare('SELECT * FROM goals WHERE objectiveId = ?').all();
      return { ...obj, goals };
    });
    res.json(objectivesWithGoals);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar objetivos' });
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
    res.status(201).json(newObjective);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar objetivo' });
  }
});

// Adicionar meta a um objetivo
router.post('/:objectiveId/goals', (req, res) => {
  const { objectiveId } = req.params;
  const { title, description, targetValue } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO goals (id, title, description, targetValue, objectiveId)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, title, description || null, parseFloat(targetValue) || 0, objectiveId);

    const newGoal = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
    res.status(201).json(newGoal);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar meta' });
  }
});

export default router;
