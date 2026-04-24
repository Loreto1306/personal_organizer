import { useState, useEffect } from 'react'
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Dumbbell, Utensils, Briefcase, Zap, Clock, Target, X, AlertCircle, Save, Calendar, Repeat } from 'lucide-react'
import { taskService, objectiveService } from '@/lib/api'

export function TasksView() {
  const [tasks, setTasks] = useState([])
  const [objectives, setObjectives] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('fitness') 
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  
  const [taskDetails, setTaskDetails] = useState({
    category: 'fitness',
    priority: 'medium',
    objectiveId: '',
    description: '',
    type: 'event', 
    frequency: 'none',
    dueDate: new Date().toISOString(),
    startTime: '',
    recurringDays: [] // IDs dos dias: 0 (Dom) a 6 (Sáb)
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tasksData, objectivesData] = await Promise.all([
        taskService.getAll(),
        objectiveService.getAll()
      ])
      setTasks(tasksData)
      setObjectives(objectivesData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategory(prev => prev === categoryId ? null : categoryId)
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setNewTaskTitle(task.title)
    setTaskDetails({
      category: task.category || 'work',
      priority: task.priority || 'medium',
      objectiveId: task.objectiveId || '',
      description: task.description || '',
      type: task.type || 'event',
      frequency: task.frequency || 'none',
      dueDate: task.dueDate || new Date().toISOString(),
      startTime: task.startTime || '',
      recurringDays: task.recurringDays || []
    })
    setIsModalOpen(true)
  }

  const toggleRecurringDay = (dayIndex) => {
    setTaskDetails(prev => {
      const days = [...prev.recurringDays]
      if (days.includes(dayIndex)) {
        return { ...prev, recurringDays: days.filter(d => d !== dayIndex) }
      } else {
        // Limitar a 3 dias se for 3x_week
        if (prev.frequency === '3x_week' && days.length >= 3) return prev
        return { ...prev, recurringDays: [...days, dayIndex].sort() }
      }
    })
  }

  const handleSaveTask = async (e) => {
    if (e) e.preventDefault()
    if (!newTaskTitle.trim()) return
    
    const payload = {
      title: newTaskTitle,
      category: taskDetails.category,
      priority: taskDetails.priority,
      type: taskDetails.type,
      frequency: taskDetails.frequency,
      objectiveId: taskDetails.objectiveId || null,
      description: taskDetails.description || null,
      dueDate: taskDetails.dueDate,
      startTime: taskDetails.startTime || null,
      recurringDays: taskDetails.type === 'routine' ? taskDetails.recurringDays : []
    }

    try {
      if (editingTask) {
        const updated = await taskService.update(editingTask.id, payload)
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updated : t))
      } else {
        const newTask = await taskService.create(payload)
        setTasks(prev => [newTask, ...prev])
      }
      closeModal()
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingTask(null)
    setNewTaskTitle('')
    setTaskDetails({ 
      category: 'work', 
      priority: 'medium', 
      objectiveId: '', 
      description: '', 
      type: 'event', 
      frequency: 'none', 
      dueDate: new Date().toISOString(),
      startTime: '',
      recurringDays: []
    })
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
      if (editingTask?.id === id) closeModal()
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error)
    }
  }

  const weekDaysShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const presets = [
    { id: 'fitness', label: 'Treino', icon: Dumbbell, color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
    { id: 'diet', label: 'Dieta', icon: Utensils, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/10' },
    { id: 'work', label: 'Trabalho', icon: Briefcase, color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/10' },
    { id: 'focus', label: 'Foco', icon: Zap, color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/10' },
  ]

  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const filteredAndSortedTasks = tasks
    .filter(t => !selectedCategory || t.category === selectedCategory)
    .sort((a, b) => {
      const pA = priorityOrder[a.priority] ?? 1
      const pB = priorityOrder[b.priority] ?? 1
      if (pA !== pB) return pA - pB
      return new Date(b.createdAt) - new Date(a.createdAt)
    })

  return (
    <div className="max-w-5xl space-y-8 md:space-y-10 animate-in fade-in duration-700 relative">
      
      {/* MODAL DE CADASTRO / EDIÇÃO TÉCNICA */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/95 md:bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-0 md:p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-[#0c0c0c] border-0 md:border md:border-white/10 w-full h-full md:h-auto max-w-4xl p-8 md:p-12 rounded-none shadow-2xl animate-in zoom-in-95 duration-300 overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8 md:mb-10 border-b border-white/5 pb-6 md:pb-8">
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
                  {editingTask ? 'Modificação de Parâmetros' : 'Configuração de Missão'}
                </span>
                <h3 className="text-xl md:text-2xl font-bold tracking-tighter text-white mt-1 italic uppercase">
                  {editingTask ? 'Visualizar / Editar Ação' : 'Parâmetros da Ação'}
                </h3>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                {editingTask && (
                  <Button variant="ghost" size="icon" onClick={() => deleteTask(editingTask.id)} className="text-zinc-600 hover:text-rose-500">
                    <Trash2 size={20} />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={closeModal} className="rounded-none text-zinc-500 hover:text-white">
                  <X size={24} />
                </Button>
              </div>
            </div>
            
            <form onSubmit={handleSaveTask} className="space-y-6 md:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                <div className="space-y-6 md:space-y-8">
                  {/* Título e Horário */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Título da Atividade</label>
                      <Input 
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        className="bg-white/5 border-white/10 h-12 md:h-14 rounded-none px-4 md:px-6 text-base md:text-lg focus-visible:ring-white/20 font-bold"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                         <Clock size={10} /> Início
                      </label>
                      <Input 
                        type="time"
                        value={taskDetails.startTime}
                        onChange={e => setTaskDetails({...taskDetails, startTime: e.target.value})}
                        className="bg-white/5 border-white/10 h-12 md:h-14 rounded-none px-4 text-base focus-visible:ring-white/20 font-bold"
                      />
                    </div>
                  </div>

                  {/* Configuração de Recorrência */}
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Repeat size={12} /> Natureza da Ação
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTaskDetails({...taskDetails, type: 'event', frequency: 'none'})}
                        className={`flex-1 py-3 border text-[9px] font-black uppercase transition-all rounded-none ${
                          taskDetails.type === 'event' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-zinc-500'
                        }`}
                      >
                        Ação Única
                      </button>
                      <button
                        type="button"
                        onClick={() => setTaskDetails({...taskDetails, type: 'routine'})}
                        className={`flex-1 py-3 border text-[9px] font-black uppercase transition-all rounded-none ${
                          taskDetails.type === 'routine' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-zinc-500'
                        }`}
                      >
                        Rotina Recorrente
                      </button>
                    </div>
                  </div>

                  {/* Detalhes de Data / Recorrência */}
                  {taskDetails.type === 'event' ? (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                        <Calendar size={12} /> Data da Missão
                      </label>
                      <Input 
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={taskDetails.dueDate ? taskDetails.dueDate.split('T')[0] : new Date().toISOString().split('T')[0]}
                        onChange={e => setTaskDetails({...taskDetails, dueDate: new Date(e.target.value).toISOString()})}
                        className="bg-white/5 border-white/10 h-12 rounded-none px-4 text-sm focus-visible:ring-white/20 font-bold uppercase tracking-widest"
                      />
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Frequência</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'daily', label: 'Diária' },
                            { id: '3x_week', label: '3x Semana' },
                            { id: 'weekends', label: 'Fim de Semana' }
                          ].map(f => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setTaskDetails({...taskDetails, frequency: f.id, recurringDays: f.id === 'daily' ? [0,1,2,3,4,5,6] : f.id === 'weekends' ? [0,6] : []})}
                              className={`py-2 border text-[8px] font-black uppercase transition-all rounded-none ${
                                taskDetails.frequency === f.id ? 'bg-zinc-200 text-black border-zinc-200' : 'bg-white/5 border-white/5 text-zinc-600'
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {taskDetails.frequency === '3x_week' && (
                        <div className="space-y-3 animate-in slide-in-from-top-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex justify-between">
                            <span>Selecione 3 Dias</span>
                            <span className={taskDetails.recurringDays.length === 3 ? 'text-emerald-500' : 'text-rose-500'}>
                              {taskDetails.recurringDays.length}/3
                            </span>
                          </label>
                          <div className="flex gap-1.5">
                            {weekDaysShort.map((day, idx) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => toggleRecurringDay(idx)}
                                className={`flex-1 py-2 border text-[8px] font-black uppercase transition-all rounded-none ${
                                  taskDetails.recurringDays.includes(idx) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-zinc-600'
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Categoria de Elite</label>
                    <div className="grid grid-cols-2 gap-2">
                      {presets.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setTaskDetails({...taskDetails, category: preset.id})}
                          className={`p-3 border transition-all flex items-center gap-3 ${
                            taskDetails.category === preset.id 
                            ? `${preset.bg} ${preset.border} ${preset.color} border-current` 
                            : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'
                          } rounded-none`}
                        >
                          <preset.icon size={16} />
                          <span className="text-[9px] font-black uppercase tracking-widest">{preset.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 md:space-y-8">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Nível de Urgência</label>
                    <div className="flex gap-2">
                      {['low', 'medium', 'high'].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setTaskDetails({...taskDetails, priority: p})}
                          className={`flex-1 py-3 border text-[9px] font-black uppercase tracking-tighter transition-all rounded-none ${
                            taskDetails.priority === p ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-zinc-500 hover:border-white/20'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <Target size={12} /> Objetivo Mestre
                    </label>
                    <select 
                      value={taskDetails.objectiveId}
                      onChange={e => setTaskDetails({...taskDetails, objectiveId: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 h-12 md:h-14 px-4 text-[11px] font-bold text-zinc-300 rounded-none focus:outline-none appearance-none uppercase tracking-widest"
                    >
                      <option value="">Nenhum Vínculo</option>
                      {objectives.map(obj => (
                        <option key={obj.id} value={obj.id}>{obj.title}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Memória Descritiva</label>
                    <textarea 
                      value={taskDetails.description}
                      onChange={e => setTaskDetails({...taskDetails, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-4 md:p-6 text-sm font-medium text-zinc-300 rounded-none focus:outline-none h-32 md:h-48 resize-none placeholder:text-zinc-800"
                      placeholder="Especificações técnicas da missão..."
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full h-16 md:h-20 bg-white text-black font-black uppercase tracking-[0.4em] text-xs rounded-none hover:bg-zinc-200 transition-all shadow-xl mt-6">
                {editingTask ? 'ATUALIZAR REGISTRO' : 'INJETAR NO PIPELINE DE EXECUÇÃO'}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* SEÇÃO DE CAPTURA */}
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Captura de Alta Fidelidade</span>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input 
              placeholder="Próxima ação estratégica..." 
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()}
              className="bg-white/[0.02] border-white/10 h-14 md:h-16 rounded-none px-6 text-base md:text-lg focus-visible:ring-zinc-500/20 focus-visible:border-white/20 transition-all font-medium placeholder:text-zinc-700"
            />
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="h-14 md:h-16 bg-zinc-100 text-black font-black px-8 md:px-10 rounded-none hover:bg-white transition-all uppercase tracking-widest text-xs"
            >
              ADICIONAR
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleCategoryToggle(preset.id)}
              className={`p-3 md:p-4 border transition-all flex flex-col items-center justify-center gap-2 md:gap-3 group ${
                selectedCategory === preset.id 
                ? `${preset.bg} ${preset.border} ${preset.color} border-current` 
                : 'bg-white/[0.02] border-white/5 text-zinc-500 hover:border-white/10 hover:bg-white/[0.04]'
              } rounded-none`}
            >
              <div className={`p-1.5 md:p-2 border ${preset.border} ${selectedCategory === preset.id ? 'bg-white/10' : ''}`}>
                <preset.icon size={18} className={selectedCategory === preset.id ? preset.color : 'text-zinc-600'} />
              </div>
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* LISTA DE AÇÕES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100 italic">Pipeline de Execução</span>
            <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[9px] font-bold rounded-sm uppercase tracking-tighter">
              {filteredAndSortedTasks.filter(t => !t.completed).length} Pendentes
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[1px] bg-white/5 border border-white/5">
          {filteredAndSortedTasks.length === 0 ? (
            <div className="bg-[#08080a] py-20 text-center opacity-20 italic text-sm font-medium uppercase tracking-[0.3em]">Horizonte Limpo</div>
          ) : (
            filteredAndSortedTasks.map((task) => {
              const preset = presets.find(p => p.id === task.category) || { color: 'text-zinc-500', bg: 'bg-zinc-500/10', border: 'border-zinc-500/20' };
              return (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-4 md:p-5 bg-[#08080a] hover:bg-white/[0.02] transition-all group"
                >
                  <div 
                    className="flex items-center gap-4 md:gap-6 flex-1 cursor-pointer"
                    onClick={() => openEditModal(task)}
                  >
                    <Checkbox 
                      checked={task.completed} 
                      onCheckedChange={() => toggleTask(task)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 rounded-none border-zinc-700 data-[state=checked]:bg-zinc-100 data-[state=checked]:border-zinc-100"
                    />
                    <div className="flex flex-col gap-1 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <span className={`text-sm md:text-base font-bold tracking-tight transition-all truncate ${task.completed ? 'line-through text-zinc-700 opacity-50' : 'text-zinc-200'}`}>
                          {task.title}
                        </span>
                        {task.type === 'routine' && <Repeat size={12} className="text-zinc-600 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-none shrink-0 ${
                          task.priority === 'high' ? 'text-rose-500 border-rose-500/20 bg-rose-500/5' : 
                          task.priority === 'medium' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' : 
                          'text-zinc-500 border-zinc-800'
                        }`}>
                          {task.priority || 'Medium'}
                        </span>
                        <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-none shrink-0 ${preset.color} ${preset.border} ${preset.bg}`}>
                          {task.category || 'Geral'}
                        </span>
                        {task.startTime && (
                          <div className="flex items-center gap-1 text-zinc-600 text-[8px] font-black uppercase tracking-tighter">
                            <Clock size={8} /> {task.startTime}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="opacity-0 group-hover:opacity-100 text-zinc-700 hover:text-rose-400 transition-all rounded-none shrink-0"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  )
}
