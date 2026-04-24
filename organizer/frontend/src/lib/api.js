const API_URL = 'http://localhost:3001/api';

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
    return res.json();
  },
  update: async (id, updates) => {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
  delete: async (id) => {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
  }
};
