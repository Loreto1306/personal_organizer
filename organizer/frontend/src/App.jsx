import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, Trash2, LayoutDashboard, ListTodo, Wallet, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { taskService } from '@/lib/api'

function App() {
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [activeTab, setActiveTab] = useState('tasks')

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      const data = await taskService.getAll()
      setTasks(data)
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    try {
      const newTask = await taskService.create({ title: newTaskTitle })
      setTasks([newTask, ...tasks])
      setNewTaskTitle('')
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error)
    }
  }

  const toggleTask = async (task) => {
    try {
      const updated = await taskService.update(task.id, { completed: !task.completed })
      setTasks(tasks.map(t => t.id === task.id ? updated : t))
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error)
    }
  }

  const deleteTask = async (id) => {
    try {
      await taskService.delete(id)
      setTasks(tasks.filter(t => t.id !== id))
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {/* Sidebar Lateral */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col gap-8">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">O</div>
          <span className="text-xl font-bold tracking-tight">Organizer</span>
        </div>

        <nav className="flex flex-col gap-2">
          <Button 
            variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} 
            className="justify-start gap-3"
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={20} /> Dashboard
          </Button>
          <Button 
            variant={activeTab === 'tasks' ? 'secondary' : 'ghost'} 
            className="justify-start gap-3"
            onClick={() => setActiveTab('tasks')}
          >
            <ListTodo size={20} /> Tarefas
          </Button>
          <Button 
            variant={activeTab === 'finance' ? 'secondary' : 'ghost'} 
            className="justify-start gap-3"
            onClick={() => setActiveTab('finance')}
          >
            <Wallet size={20} /> Finanças
          </Button>
          <Button 
            variant={activeTab === 'investments' ? 'secondary' : 'ghost'} 
            className="justify-start gap-3"
            onClick={() => setActiveTab('investments')}
          >
            <TrendingUp size={20} /> Investimentos
          </Button>
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold capitalize">{activeTab === 'tasks' ? 'Minhas Tarefas' : activeTab}</h1>
          <p className="text-slate-400">Gerencie seu dia e alcance seus objetivos.</p>
        </header>

        {activeTab === 'tasks' && (
          <div className="max-w-4xl space-y-6">
            {/* Input de Nova Tarefa */}
            <form onSubmit={handleAddTask} className="flex gap-2">
              <Input 
                placeholder="O que precisa ser feito hoje?" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="bg-slate-900 border-slate-800 focus-visible:ring-blue-500"
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Plus size={20} className="mr-2" /> Adicionar
              </Button>
            </form>

            {/* Lista de Tarefas */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-100">Pendentes</CardTitle>
                <CardDescription className="text-slate-400">
                  Você tem {tasks.filter(t => !t.completed).length} tarefas para concluir.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {tasks.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">Nenhuma tarefa encontrada. Comece adicionando uma!</p>
                ) : (
                  tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox 
                          checked={task.completed} 
                          onCheckedChange={() => toggleTask(task)}
                          className="border-slate-700 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <span className={`${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.title}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab !== 'tasks' && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-500">
            <LayoutDashboard size={48} className="mb-4 opacity-20" />
            <p>Seção {activeTab} em desenvolvimento...</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
