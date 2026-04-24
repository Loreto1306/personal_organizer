import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Target, Activity, Zap, Wallet, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react'
import { taskService, financeService, objectiveService } from '@/lib/api'

export function DashboardView() {
  const [data, setData] = useState({
    tasks: [],
    assets: [],
    objectives: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [tasks, assets, objectives] = await Promise.all([
        taskService.getAll(),
        financeService.getAssets(),
        objectiveService.getAll()
      ])
      setData({ tasks, assets, objectives })
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error)
    }
  }

  const calculateTotalFinance = () => {
    return data.assets.reduce((acc, asset) => acc + (asset.quantity * (asset.currentPrice || asset.averagePrice)), 0)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const completedToday = data.tasks.filter(t => {
    const today = new Date().toISOString().split('T')[0]
    return t.type === 'routine' ? t.completions.includes(today) : t.completed
  }).length

  const pendingCritical = data.tasks.filter(t => t.priority === 'high' && !t.completed).slice(0, 2)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in fade-in duration-1000">
      
      {/* 1. Métrica de Performance Principal */}
      <div className="sm:col-span-2 lg:col-span-2 glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-all">
          <Zap size={120} />
        </div>
        <div className="space-y-2">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Nível de Execução</span>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic">Status: Ativo</h2>
        </div>
        <div className="mt-8 md:mt-12 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 sm:gap-0">
          <div className="flex flex-col">
            <span className="text-3xl md:text-4xl font-black tracking-tighter">{completedToday}</span>
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/40">Ações hoje</span>
          </div>
          <div className="hidden sm:block h-12 w-[1px] bg-white/10 mx-8"></div>
          <div className="flex flex-col flex-1 w-full sm:w-auto">
            <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase mb-2">
              <span>Consistência Semanal</span>
              <span>85%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-none overflow-hidden border border-white/5">
              <div className="h-full bg-white w-[85%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Resumo Financeiro Rápido */}
      <div className="glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between border-white/5 min-h-[160px]">
        <div className="flex items-center justify-between">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <Wallet size={20} className="text-white/60" />
          </div>
          <ArrowUpRight size={20} className="text-emerald-500" />
        </div>
        <div className="mt-4 md:mt-8">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/30">Patrimônio Global</span>
          <p className="text-xl md:text-2xl font-black tracking-tighter mt-1">{formatCurrency(calculateTotalFinance())}</p>
        </div>
      </div>

      {/* 3. Próximo Objetivo */}
      <div className="glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between border-white/5 min-h-[160px]">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 w-fit">
          <Target size={20} className="text-white/60" />
        </div>
        <div className="mt-4 md:mt-8">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/30">Evolução Mestre</span>
          <p className="text-xs md:text-sm font-bold tracking-tight mt-1 leading-tight uppercase italic truncate">
            {data.objectives[0]?.title || 'Definir Meta'}
          </p>
          <div className="flex items-center gap-2 mt-3">
             <div className="h-1 w-12 bg-white/20 rounded-none overflow-hidden">
                <div className="h-full bg-white w-[75%]"></div>
             </div>
             <span className="text-[8px] font-black">75%</span>
          </div>
        </div>
      </div>

      {/* 4. Pipeline de Foco (Ações Críticas) */}
      <div className="sm:col-span-2 lg:col-span-2 glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-white/5 relative overflow-hidden">
        <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-6 md:mb-8">Pipeline de Foco</h3>
        <div className="space-y-3 md:space-y-4">
          {pendingCritical.map(task => (
            <div key={task.id} className="p-4 md:p-5 bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:border-white/20 transition-all">
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-1.5 h-1.5 shrink-0 rounded-full bg-rose-500"></div>
                <span className="text-xs md:text-sm font-bold text-white/80 truncate">{task.title}</span>
              </div>
              <span className="text-[7px] md:text-[8px] font-black uppercase px-2 py-1 border border-white/10 text-white/40 shrink-0 ml-2">Imediato</span>
            </div>
          ))}
          {pendingCritical.length === 0 && (
            <p className="text-zinc-600 text-[10px] md:text-xs italic py-4">Nenhuma ação crítica pendente.</p>
          )}
        </div>
      </div>

      {/* 5. Health Check (Atividade) */}
      <div className="sm:col-span-2 lg:col-span-2 glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 sm:gap-0">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Consistência de Saúde</span>
          <p className="text-xl md:text-2xl font-black italic tracking-tighter uppercase">Volume de Treino: 42km</p>
        </div>
        <div className="flex gap-1.5">
          {[1,2,3,4,5,6,7].map(i => (
            <div key={i} className={`w-2 md:w-1.5 h-8 md:h-10 ${i < 6 ? 'bg-white' : 'bg-white/5'}`}></div>
          ))}
        </div>
      </div>

    </div>
  )
}
