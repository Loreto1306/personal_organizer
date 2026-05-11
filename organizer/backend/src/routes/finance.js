import express from 'express';
import db from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import yahooFinance from 'yahoo-finance2';

const router = express.Router();

// Sincronizar preços de ativos via Yahoo Finance e cálculo de CDI
router.post('/sync-prices', async (req, res) => {
  try {
    const assets = db.prepare('SELECT * FROM assets').all();
    const results = [];

    // Valor base do CDI anual (aproximado - em um cenário real buscaríamos de uma API como HG Brasil ou BCB)
    const ANNUAL_CDI = 0.1125; // 11.25% ao ano
    const DAILY_CDI = Math.pow(1 + ANNUAL_CDI, 1/252) - 1; // CDI diário (252 dias úteis)

    for (const asset of assets) {
      try {
        if (asset.category === 'fixed_income') {
          // Cálculo de Renda Fixa (CDI + IR regressivo)
          const purchaseDate = new Date(asset.purchaseDate || asset.updatedAt);
          const now = new Date();
          const diffTime = Math.abs(now - purchaseDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Estimativa de dias úteis (aproximado 21 dias por mês)
          const businessDays = Math.floor(diffDays * (252/365));
          
          // Montante Bruto: Principal * (1 + CDI_diario)^dias_uteis
          const grossValue = asset.averagePrice * Math.pow(1 + DAILY_CDI, businessDays);
          const profit = grossValue - asset.averagePrice;

          // Tabela regressiva de IR
          let irRate = 0.225;
          if (diffDays > 720) irRate = 0.15;
          else if (diffDays > 360) irRate = 0.175;
          else if (diffDays > 180) irRate = 0.20;

          const netProfit = profit * (1 - irRate);
          const currentPrice = asset.averagePrice + netProfit;

          db.prepare(`
            UPDATE assets 
            SET currentPrice = ?, dailyChange = ?, changePercent = ?, updatedAt = CURRENT_TIMESTAMP 
            WHERE id = ?
          `).run(currentPrice, (currentPrice - (asset.currentPrice || currentPrice)), (netProfit / asset.averagePrice) * 100, asset.id);

          results.push({ symbol: asset.symbol, category: 'fixed_income', newPrice: currentPrice });
        } else {
          // Ações e Cripto via Yahoo Finance
          const symbol = (asset.category === 'stock' && !asset.symbol.includes('.')) 
            ? `${asset.symbol}.SA` 
            : asset.symbol;

          const quote = await yahooFinance.quote(symbol);
          const currentPrice = quote.regularMarketPrice;
          const dailyChange = quote.regularMarketChange;
          const changePercent = quote.regularMarketChangePercent;

          if (currentPrice) {
            db.prepare(`
              UPDATE assets 
              SET currentPrice = ?, dailyChange = ?, changePercent = ?, updatedAt = CURRENT_TIMESTAMP 
              WHERE id = ?
            `).run(currentPrice, dailyChange, changePercent, asset.id);
            
            results.push({ 
              symbol: asset.symbol, 
              oldPrice: asset.currentPrice, 
              newPrice: currentPrice,
              changePercent
            });
          }
        }
      } catch (assetError) {
        console.error(`Erro ao sincronizar ${asset.symbol}:`, assetError.message);
      }
    }

    res.json({ status: 'success', message: 'Sincronização de mercado e CDI concluída.', updated: results });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ status: 'error', message: 'Falha crítica na sincronização de preços.' });
  }
});

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
  const { description, amount, type, category, paymentMethod, date } = req.body;
  const id = uuidv4();
  try {
    db.prepare(`
      INSERT INTO transactions (id, description, amount, type, category, paymentMethod, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, description, parseFloat(amount), type, category, paymentMethod || 'cash', date || new Date().toISOString());

    const newTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.status(201).json({ status: 'success', message: 'Transação financeira registrada.', data: newTransaction });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Erro ao processar movimentação.' });
  }
});

// Atualizar transação
router.patch('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { description, amount, type, category, paymentMethod, date } = req.body;
  
  try {
    const current = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ status: 'error', message: 'Transação não localizada.' });

    db.prepare(`
      UPDATE transactions 
      SET description = ?, amount = ?, type = ?, category = ?, paymentMethod = ?, date = ?
      WHERE id = ?
    `).run(
      description !== undefined ? description : current.description,
      amount !== undefined ? parseFloat(amount) : current.amount,
      type !== undefined ? type : current.type,
      category !== undefined ? category : current.category,
      paymentMethod !== undefined ? paymentMethod : current.paymentMethod,
      date !== undefined ? date : current.date,
      id
    );

    const updatedTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);
    res.json({ status: 'success', message: 'Lançamento atualizado.', data: updatedTransaction });
  } catch (error) {
    res.status(400).json({ status: 'error', message: 'Erro na atualização do lançamento.' });
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
