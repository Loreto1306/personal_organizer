import { useState, useEffect } from 'react'
import { LayoutDashboard, ListTodo, Wallet, TrendingUp, Calendar, Menu, X as CloseIcon, MessageSquare } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { taskService } from '@/lib/api'
import { AgendaView } from '@/components/AgendaView'
import { InvestmentsView } from '@/components/InvestmentsView'
import { TasksView } from '@/components/TasksView'
import { DashboardView } from '@/components/DashboardView'
import { FinanceView } from '@/components/FinanceView'
import { ChatView } from '@/components/ChatView'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Visão Estratégica'
      case 'tasks': return 'Ações & Foco'
      case 'agenda': return 'Meu Cronograma'
      case 'investments': return 'Investimentos'
      case 'finance': return 'Fluxo de Caixa'
      case 'chat': return 'Lux AI Co-Pilot'
      default: return 'Dashboard'
    }
  }

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Painel' },
    { id: 'agenda', icon: Calendar, label: 'Cronograma' },
    { id: 'tasks', icon: ListTodo, label: 'Tarefas' },
    { id: 'finance', icon: Wallet, label: 'Finanças' },
    { id: 'investments', icon: TrendingUp, label: 'Ativos' },
    { id: 'chat', icon: MessageSquare, label: 'Co-Pilot' },
  ]

  return (
    <div className="min-h-screen text-white flex flex-col md:flex-row font-sans selection:bg-white/10 relative overflow-hidden">
      
      {/* Botão Mobile Menu */}
      <div className="md:hidden flex items-center justify-between p-6 sidebar-frosted z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-black text-[10px] italic">LS</div>
          <span className="text-sm font-bold tracking-tight">SYSTEM</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Sidebar - Desktop & Mobile */}
      <aside className={`
        fixed md:relative inset-0 md:inset-auto z-40 w-full md:w-72 sidebar-frosted p-8 flex flex-col gap-10 transition-transform duration-500
        ${isMobileMenuOpen ? 'translate-x-0 mt-10' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="hidden md:flex items-center gap-3 px-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-black text-[14px] italic shadow-lg shadow-white/10">LS</div>
          <div className="flex flex-col">

            <span className="text-sm font-bold tracking-tight leading-none">LOR.S</span>
            <span className="text-[8px] font-black tracking-[0.3em] text-white/40 uppercase">System</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1 mt-4">
          {menuItems.map((item) => (
            <Button 
              key={item.id}
              variant="ghost" 
              className={`justify-start gap-3 rounded-xl px-4 py-7 text-sm transition-all duration-300 ${
                activeTab === item.id 
                ? 'nav-active-glass' 
                : 'text-white/40 hover:text-white/80 hover:bg-white/5'
              }`}
              onClick={() => {
                setActiveTab(item.id)
                setIsMobileMenuOpen(false)
              } }
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'opacity-40'} /> 
              {item.label}
            </Button>
          ))}
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 md:p-12 overflow-y-auto w-full relative">
        <div className="max-w-6xl mx-auto w-full">
          <header className="mb-12 mt-4 md:mt-0">
            <h1 className="text-3xl md:text-clean-title">{getTitle()}</h1>
            <p className="text-xs md:text-sm text-white/40 mt-1 font-medium italic">Foco e clareza no processo.</p>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 w-full">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'agenda' && <AgendaView />}
            {activeTab === 'investments' && <InvestmentsView />}
            {activeTab === 'tasks' && <TasksView />}
            {activeTab === 'finance' && <FinanceView />}
            {activeTab === 'chat' && <ChatView />}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
