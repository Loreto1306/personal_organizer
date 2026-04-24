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
    res.status(500).json({ status: 'error', message: 'Falha ao sincronizar fluxo de caixa.' });
  }
});

// Adicionar transação
router.post('/transactions', (req, res) => {
  const { description, amount, type, category, date } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO transactions (id, description, amount, type, category, date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, description, parseFloat(amount), type, category, date || new Date().toISOString());

    const newTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.status(201).json({ status: 'success', message: 'Transação financeira registrada.', data: newTransaction });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Erro ao processar movimentação.' });
  }
});

// Listar ativos
router.get('/assets', (req, res) => {
  try {
    const assets = db.prepare('SELECT * FROM assets ORDER BY symbol ASC').all();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Erro ao carregar custódia de ativos.' });
  }
});

// Adicionar ativo
router.post('/assets', (req, res) => {
  const { symbol, name, type, category, quantity, averagePrice, currentPrice } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO assets (id, symbol, name, type, category, quantity, averagePrice, currentPrice)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, 
      symbol, 
      name || null, 
      type || null, 
      category || 'stock', 
      parseFloat(quantity) || 0, 
      parseFloat(averagePrice) || 0,
      parseFloat(currentPrice) || null
    );

    const newAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    res.status(201).json({ status: 'success', message: `Ativo ${symbol} integrado à custódia.`, data: newAsset });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Falha ao adicionar novo ativo.' });
  }
});

// Atualizar preço de um ativo
router.patch('/assets/:id', (req, res) => {
  const { id } = req.params;
  const { currentPrice, quantity, averagePrice } = req.body;
  
  try {
    const current = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ status: 'error', message: 'Ativo não localizado.' });

    db.prepare(`
      UPDATE assets 
      SET currentPrice = ?, quantity = ?, averagePrice = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      currentPrice !== undefined ? parseFloat(currentPrice) : current.currentPrice,
      quantity !== undefined ? parseFloat(quantity) : current.quantity,
      averagePrice !== undefined ? parseFloat(averagePrice) : current.averagePrice,
      id
    );

    const updatedAsset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
    res.json({ status: 'success', message: 'Cotação atualizada.', data: updatedAsset });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Erro na atualização de preço.' });
  }
});

export default router;
