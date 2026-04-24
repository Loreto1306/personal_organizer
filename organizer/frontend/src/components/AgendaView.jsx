import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, ChevronLeft, ChevronRight, Zap, Target, Activity, Repeat, Clock, BarChart3 } from 'lucide-react'
import { taskService, objectiveService } from '@/lib/api'

export function AgendaView() {
  const [tasks, setTasks] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [metricMode, setMetricMode] = useState('week') // 'today' ou 'week'
  const [criticalPriority, setCriticalPriority] = useState('high') // Filtro do widget de foco

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const tasksData = await taskService.getAll()
      setTasks(tasksData)
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    }
  }

  const toggleTask = async (task, date) => {
    try {
      if (task.type === 'routine') {
        const dateStr = date.toISOString().split('T')[0]
        await taskService.toggleTaskDate(task.id, dateStr)
        setTasks(tasks.map(t => {
          if (t.id === task.id) {
            const hasDate = t.completions.includes(dateStr)
            return {
              ...t,
              completions: hasDate 
                ? t.completions.filter(d => d !== dateStr) 
                : [...t.completions, dateStr]
            }
          }
          return t
        }))
      } else {
        const updated = await taskService.update(task.id, { completed: !task.completed })
        setTasks(tasks.map(t => t.id === task.id ? updated : t))
      }
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error)
    }
  }

  const getWeekDays = (date) => {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      return day
    })
  }

  const weekDays = getWeekDays(currentDate)

  const getTasksForDay = (day) => {
    const dayOfWeek = day.getDay()
    const dateStr = day.toISOString().split('T')[0]

    const dayTasks = tasks.filter(t => {
      if (t.type === 'event') {
        if (!t.dueDate) return false
        const taskDate = new Date(t.dueDate).toISOString().split('T')[0]
        return taskDate === dateStr
      }
      if (t.type === 'routine') {
        if (t.recurringDays && t.recurringDays.length > 0) {
          return t.recurringDays.includes(dayOfWeek)
        }
        if (t.frequency === 'daily') return true
        if (t.frequency === 'weekends') return dayOfWeek === 0 || dayOfWeek === 6
        if (t.frequency === '3x_week') return [1, 3, 5].includes(dayOfWeek)
      }
      return false
    })

    return dayTasks.sort((a, b) => {
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return a.startTime.localeCompare(b.startTime)
    })
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const getMetrics = () => {
    const todayStr = new Date().toISOString().split('T')[0]
    if (metricMode === 'today') {
      const dayTasks = getTasksForDay(new Date())
      const done = dayTasks.filter(t => 
        t.type === 'routine' ? t.completions.includes(todayStr) : t.completed
      ).length
      return { total: dayTasks.length, done }
    } else {
      let total = 0
      let done = 0
      weekDays.forEach(day => {
        const dayTasks = getTasksForDay(day)
        const dStr = day.toISOString().split('T')[0]
        total += dayTasks.length
        done += dayTasks.filter(t => 
          t.type === 'routine' ? t.completions.includes(dStr) : t.completed
        ).length
      })
      return { total, done }
    }
  }

  const { total, done } = getMetrics()

  // Função para calcular urgência baseada no tempo
  const getUrgencyTag = (startTime) => {
    if (!startTime) return { label: 'Pendente', color: 'text-zinc-500' };
    
    const now = new Date();
    const [hours, minutes] = startTime.split(':').map(Number);
    const taskTime = new Date();
    taskTime.setHours(hours, minutes, 0, 0);

    const diffMs = taskTime - now;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return { label: 'Atrasado', color: 'text-rose-500 font-black' };
    if (diffMins <= 60) return { label: 'Imediato', color: 'text-rose-500 animate-pulse font-black' };
    if (diffMins <= 180) return { label: 'Próximo', color: 'text-amber-500 font-bold' };
    return { label: 'Agendado', color: 'text-zinc-500' };
  };
  
  const criticalMissions = tasks.filter(t => {
    if (t.priority !== criticalPriority) return false;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date().getDay();

    if (t.type === 'routine') {
      const isForToday = t.recurringDays && t.recurringDays.length > 0 
        ? t.recurringDays.includes(dayOfWeek)
        : (t.frequency === 'daily' || (t.frequency === 'weekends' && [0,6].includes(dayOfWeek)) || (t.frequency === '3x_week' && [1,3,5].includes(dayOfWeek)));
      return isForToday && !t.completions.includes(todayStr);
    }
    
    if (t.type === 'event' && t.dueDate) {
      const taskDate = new Date(t.dueDate).toISOString().split('T')[0];
      return taskDate === todayStr && !t.completed;
    }
    return false;
  }).sort((a, b) => {
    if (!a.startTime) return 1;
    if (!b.startTime) return -1;
    return a.startTime.localeCompare(b.startTime);
  }).slice(0, 3);

  const categories = {
    fitness: { color: 'border-emerald-500/50', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    diet: { color: 'border-amber-500/50', bg: 'bg-amber-500/10', text: 'text-amber-400' },
    work: { color: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-400' },
    focus: { color: 'border-purple-500/50', bg: 'bg-purple-500/10', text: 'text-purple-400' },
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between glass-bento p-4 rounded-2xl border-white/5 shadow-sm">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)} className="rounded-full text-zinc-500 hover:text-zinc-100 transition-all">
            <ChevronLeft size={22} />
          </Button>
          <span className="text-sm font-bold tracking-tight text-zinc-300 uppercase tracking-[0.2em]">
            {weekDays[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {weekDays[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)} className="rounded-full text-zinc-500 hover:text-zinc-100 transition-all">
            <ChevronRight size={22} />
          </Button>
        </div>
        <Button className="bg-zinc-100 text-black font-black rounded-none px-8 hover:bg-white transition-all shadow-xl text-[10px] uppercase tracking-widest">
          Agendar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 md:gap-3">
        {weekDays.map((day, i) => {
          const isToday = day.toDateString() === new Date().toDateString()
          const dayTasks = getTasksForDay(day)
          const dStr = day.toISOString().split('T')[0]
          
          return (
            <div key={i} className={`flex flex-col gap-3 group transition-all duration-700 ${isToday ? 'md:scale-105 z-10' : ''}`}>
              <div className={`p-4 md:p-3 lg:p-4 rounded-2xl border transition-all ${
                isToday 
                ? 'bg-zinc-100 text-black border-zinc-100 shadow-lg' 
                : 'bg-white/[0.02] border-white/5 text-zinc-500 group-hover:border-white/10 group-hover:text-zinc-300'
              }`}>
                <div className="flex md:flex-col items-center md:items-center justify-between md:justify-center gap-2 md:gap-0">
                  <p className="text-[10px] md:text-[9px] font-bold uppercase tracking-widest opacity-60">
                    {day.toLocaleDateString('pt-BR', { weekday: 'long' })}
                    <span className="md:hidden">, {day.getDate()}</span>
                  </p>
                  <p className="hidden md:block text-xl font-black tracking-tighter italic">{day.getDate()}</p>
                  {isToday && <span className="md:hidden text-[9px] font-black bg-black text-white px-2 py-0.5 rounded-full uppercase">Hoje</span>}
                </div>
              </div>
              
              <div className={`flex-1 glass-bento rounded-2xl p-3 md:p-2.5 min-h-[100px] md:min-h-[280px] space-y-2 border-white/5 ${isToday ? 'bg-white/[0.04] border-white/10' : ''}`}>
                {dayTasks.length === 0 ? (
                  <div className="hidden md:flex flex-col items-center justify-center h-full opacity-5 py-8">
                    <Zap size={24} />
                  </div>
                ) : (
                  dayTasks.map(task => {
                    const isDone = task.type === 'routine' ? task.completions.includes(dStr) : task.completed;
                    const cat = categories[task.category] || { color: 'border-zinc-800', bg: 'bg-zinc-900/50', text: 'text-zinc-500' };

                    return (
                      <div key={`${task.id}-${dStr}`} className={`p-3 md:p-2.5 rounded-none border-l-2 bg-white/[0.02] flex flex-col gap-2 transition-all animate-in slide-in-from-left-1 ${cat.color} ${isDone ? 'opacity-30' : ''}`}>
                        <div className="flex items-start gap-3 overflow-hidden">
                          <Checkbox checked={isDone} onCheckedChange={() => toggleTask(task, day)} className="h-4 w-4 md:h-3.5 md:w-3.5 shrink-0 rounded-none border-zinc-700 data-[state=checked]:bg-zinc-200 data-[state=checked]:border-zinc-200" />
                          <div className="flex flex-col overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs md:text-[10px] font-bold md:font-bold leading-tight truncate ${isDone ? 'line-through text-zinc-600' : 'text-zinc-200'}`}>{task.title}</span>
                              {task.startTime && <span className="text-[8px] font-black text-zinc-500 shrink-0">{task.startTime}</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {task.type === 'routine' ? <Repeat size={8} className="text-zinc-600" /> : <Clock size={8} className="text-zinc-600" />}
                              <span className="text-[8px] md:text-[7px] font-black uppercase tracking-tighter text-zinc-500">{task.category}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                {dayTasks.length === 0 && (
                  <p className="md:hidden text-[10px] text-zinc-700 italic text-center py-2 uppercase tracking-widest font-black">Livre</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-bento rounded-3xl p-8 border-white/5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h3 className="font-black text-[10px] tracking-[0.3em] text-zinc-400 uppercase text-white/40">Foco Crítico / Dia</h3>
              <div className="flex bg-white/5 rounded-none p-0.5 border border-white/10 w-fit mt-2">
                {['high', 'medium', 'low'].map(p => (
                  <button 
                    key={p}
                    onClick={() => setCriticalPriority(p)}
                    className={`px-3 py-1 text-[7px] font-black uppercase transition-all ${criticalPriority === p ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {p === 'high' ? 'Alta' : p === 'medium' ? 'Média' : 'Baixa'}
                  </button>
                ))}
              </div>
            </div>
            <div className={`w-2 h-2 rounded-full animate-pulse ${criticalPriority === 'high' ? 'bg-rose-500' : criticalPriority === 'medium' ? 'bg-blue-400' : 'bg-zinc-500'}`}></div>
          </div>
          <div className="space-y-4">
            {criticalMissions.length === 0 ? (
              <p className="text-zinc-600 text-[10px] font-bold italic py-4 text-center opacity-40">Nenhuma missão pendente para esta categoria.</p>
            ) : (
              criticalMissions.map(mission => {
                const urgency = getUrgencyTag(mission.startTime);
                return (
                  <div key={mission.id} className="p-4 bg-white/[0.02] border border-white/5 rounded-none flex items-center justify-between group hover:border-white/10 transition-all">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-zinc-200 tracking-tight">{mission.title}</span>
                         {mission.startTime && <span className="text-[9px] font-black text-zinc-500">{mission.startTime}</span>}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-widest mt-1 ${urgency.color}`}>
                        {urgency.label}
                      </span>
                    </div>
                    <Target size={14} className={`transition-colors ${urgency.label === 'Imediato' || urgency.label === 'Atrasado' ? 'text-rose-500' : 'text-zinc-800 group-hover:text-zinc-400'}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="glass-bento rounded-3xl p-8 flex flex-col justify-between border-white/5 group">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-[10px] tracking-[0.3em] text-zinc-400 uppercase text-white/40">Eficiência</h3>
            <div className="flex bg-white/5 rounded-none p-0.5 border border-white/10">
              <button 
                onClick={() => setMetricMode('today')}
                className={`px-3 py-1 text-[8px] font-black uppercase transition-all ${metricMode === 'today' ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >Hoje</button>
              <button 
                onClick={() => setMetricMode('week')}
                className={`px-3 py-1 text-[8px] font-black uppercase transition-all ${metricMode === 'week' ? 'bg-zinc-100 text-black' : 'text-zinc-500 hover:text-zinc-300'}`}
              >Semana</button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-end justify-between border-b border-white/5 pb-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-zinc-500">{metricMode === 'today' ? 'Realizadas Hoje' : 'Ciclo Semanal'}</span>
                <span className="text-5xl font-black tracking-tighter text-zinc-100 italic">{done}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase text-zinc-500">Pipeline Total</span>
                <span className="text-2xl font-bold tracking-tighter text-zinc-500 italic">/ {total}</span>
              </div>
            </div>
            
            <div className="relative h-1 w-full bg-white/5 rounded-none overflow-hidden border border-white/5">
              <div 
                className="absolute h-full bg-zinc-100 transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.2)]" 
                style={{ width: `${(done / (total || 1)) * 100}%` }}
              ></div>
            </div>

            <div className="p-3 bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-center text-zinc-400 group-hover:border-zinc-500 transition-all">
              {total === 0 ? 'Aguardando Atividades' : `${Math.round((done / total) * 100)}% de Consistência`}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
