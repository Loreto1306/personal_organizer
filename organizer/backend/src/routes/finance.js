import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Listar transações
router.get('/transactions', (req, res) => {
  try {
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC').all();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// Criar transação
router.post('/transactions', (req, res) => {
  const { description, amount, type, category, date } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO transactions (id, description, amount, type, category, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, description, parseFloat(amount), type, category || null, date || new Date().toISOString());

    const newTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.status(201).json(newTransaction);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao criar transação' });
  }
});

// Listar ativos (investimentos)
router.get('/assets', (req, res) => {
  try {
    const assets = db.prepare('SELECT * FROM assets').all();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar ativos' });
  }
});

// Adicionar ativo
router.post('/assets', (req, res) => {
  const { symbol, name, type, quantity, averagePrice } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO assets (id, symbol, name, type, quantity, averagePrice)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, symbol, name || null, type || null, parseFloat(quantity) || 0, parseFloat(averagePrice) || 0);

    const newAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    res.status(201).json(newAsset);
  } catch (error) {
    res.status(400).json({ error: 'Erro ao adicionar ativo' });
  }
});

export default router;
