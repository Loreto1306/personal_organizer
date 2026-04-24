import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar objetivos com suas respectivas metas
router.get('/', (req, res) => {
  try {
    const objectives = db.prepare('SELECT * FROM objectives ORDER BY createdAt DESC').all();
    const objectivesWithGoals = objectives.map(obj => {
      const goals = db.prepare('SELECT * FROM goals WHERE objectiveId = ?').all(obj.id);
      return { ...obj, goals };
    });
    res.json(objectivesWithGoals);
  } catch (error) {
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

export default router;
