const API_URL = 'http://localhost:3001/api';

// Sistema de eventos simples para os Toasts
let toastHandler = null;
export const registerToastHandler = (handler) => {
  toastHandler = handler;
};

const handleResponse = async (res) => {
  const data = await res.json();
  
  // Se a API retornar uma mensagem estruturada, dispara o Toast
  if (data.status && data.message && toastHandler) {
    toastHandler(data.message, data.status);
  }
  
  // Se for sucesso, devolve apenas o 'data' interno ou o objeto completo se não houver 'data'
  if (res.ok) {
    return data.data !== undefined ? data.data : data;
  }
  
  // Em caso de erro HTTP (ex: 400, 404, 500)
  throw new Error(data.message || 'Erro na comunicação técnica.');
};

export const taskService = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/tasks`);
    return res.json();
  },
  create: async (task) => {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    return handleResponse(res);
  },
  update: async (id, updates) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },
  delete: async (id) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
    return handleResponse(res);
  },
  toggleTaskDate: async (id, date) => {
    const res = await fetch(`${API_URL}/tasks/${id}/toggle-date`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    });
    return handleResponse(res);
  }
};

export const financeService = {
  getTransactions: async () => {
    const res = await fetch(`${API_URL}/finance/transactions`);
    return res.json();
  },
  createTransaction: async (data) => {
    const res = await fetch(`${API_URL}/finance/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  getAssets: async () => {
    const res = await fetch(`${API_URL}/finance/assets`);
    return res.json();
  },
  createAsset: async (data) => {
    const res = await fetch(`${API_URL}/finance/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  updateAsset: async (id, updates) => {
    const res = await fetch(`${API_URL}/finance/assets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  }
};

export const objectiveService = {
  getAll: async () => {
    const res = await fetch(`${API_URL}/objectives`);
    return res.json();
  },
  create: async (data) => {
    const res = await fetch(`${API_URL}/objectives`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
  createGoal: async (objectiveId, data) => {
    const res = await fetch(`${API_URL}/objectives/${objectiveId}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  }
};
