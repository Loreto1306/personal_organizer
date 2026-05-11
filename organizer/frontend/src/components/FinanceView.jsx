import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, Calendar, Tag, Trash2, X, DollarSign, Edit2 } from 'lucide-react'
import { financeService } from '@/lib/api'

export function FinanceView() {
  const [transactions, setTransactions] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'Geral',
    paymentMethod: 'debit',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    try {
      const data = await financeService.getTransactions()
      setTransactions(data)
    } catch (error) {
      console.error("Erro ao carregar transações:", error)
    }
  }

  const handleEditClick = (t) => {
    setEditingId(t.id)
    setNewTransaction({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      paymentMethod: t.paymentMethod || 'debit',
      date: t.date
    })
    setIsModalOpen(true)
  }

  const handleOpenModal = () => {
    setEditingId(null)
    setNewTransaction({
      description: '',
      amount: '',
      type: 'expense',
      category: 'Geral',
      paymentMethod: 'debit',
      date: new Date().toISOString().split('T')[0]
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newTransaction.description || !newTransaction.amount) return

    try {
      const payload = {
        ...newTransaction,
        amount: parseFloat(newTransaction.amount)
      }

      if (editingId) {
        await financeService.updateTransaction(editingId, payload)
      } else {
        await financeService.createTransaction(payload)
      }

      loadTransactions()
      setIsModalOpen(false)
      setEditingId(null)
      setNewTransaction({
        description: '',
        amount: '',
        type: 'expense',
        category: 'Geral',
        paymentMethod: 'debit',
        date: new Date().toISOString().split('T')[0]
      })
    } catch (error) {
      console.error("Erro ao processar transação:", error)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const calculateTotals = () => {
    const incomes = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0)
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0)
    return { balance: incomes - expenses, incomes, expenses }
  }

  const { balance, incomes, expenses } = calculateTotals()

  const categories = ['Geral', 'Alimentação', 'Transporte', 'Lazer', 'Trabalho', 'Saúde', 'Educação']
  const paymentMethods = [
    { id: 'debit', label: 'Débito / PIX' },
    { id: 'credit', label: 'Cartão de Crédito' },
    { id: 'cash', label: 'Dinheiro' }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Header Financeiro */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/80">
            <Wallet size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white">Fluxo de Caixa</h2>
            <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/20">Gestão de Liquidez</p>
          </div>
        </div>
        <Button 
          onClick={handleOpenModal}
          className="w-full sm:w-auto bg-white text-black font-black rounded-none px-10 py-6 hover:bg-zinc-200 transition-all text-[10px] uppercase tracking-widest"
        >
          <Plus size={16} className="mr-2" /> Registrar Movimentação
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border-white/10 relative overflow-hidden group min-h-[140px] md:min-h-0">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all rotate-12">
            <Wallet size={80} />
          </div>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Saldo Disponível</span>
          <p className={`text-2xl md:text-4xl font-black tracking-tighter italic mt-4 ${balance >= 0 ? 'text-white' : 'text-rose-500'}`}>
            {formatCurrency(balance)}
          </p>
        </div>

        <div className="glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border-emerald-500/10 flex flex-col justify-between min-h-[120px] md:min-h-0">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/30">Entradas</span>
          <p className="text-xl md:text-2xl font-black tracking-tighter italic text-emerald-400 mt-4">
            {formatCurrency(incomes)}
          </p>
        </div>

        <div className="glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border-rose-500/10 flex flex-col justify-between min-h-[120px] md:min-h-0">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-rose-500/30">Saídas</span>
          <p className="text-xl md:text-2xl font-black tracking-tighter italic text-rose-400 mt-4">
            {formatCurrency(expenses)}
          </p>
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="glass-minimal rounded-[2rem] md:rounded-[3rem] border-white/5 overflow-hidden shadow-2xl">
        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-white/5 bg-white/[0.01]">
          <h3 className="text-base md:text-lg font-black italic uppercase tracking-tighter text-white">Pipeline de Lançamentos</h3>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="hover:bg-transparent border-white/5 h-12">
                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Data / Método</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Descrição</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Categoria</TableHead>
                <TableHead className="text-right px-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Valor / Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-white/10 font-black uppercase tracking-widest text-xl italic">
                    Horizonte Limpo
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id} className="border-white/5 hover:bg-white/[0.02] transition-all group h-16">
                    <TableCell className="px-10">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-white/20" />
                          <span className="text-xs font-bold text-white/40 italic">
                            {new Date(t.date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <span className="text-[8px] font-black uppercase text-white/10 mt-1">
                          {paymentMethods.find(m => m.id === t.paymentMethod)?.label || t.paymentMethod}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-white/80">{t.description}</TableCell>
                    <TableCell>
                      <span className="text-[9px] font-black uppercase px-3 py-1 bg-white/5 border border-white/10 text-white/40 rounded-full">
                        {t.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right px-10">
                      <div className="flex items-center justify-end gap-4">
                        <div className={`font-black italic text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <div className="flex items-center justify-end gap-2">
                            {t.type === 'income' ? <Plus size={12} /> : <X size={12} className="rotate-45" />}
                            {formatCurrency(t.amount)}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleEditClick(t)}
                          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/20 hover:text-white hover:border-white/40 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-lg p-10 rounded-none shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600">Registro Financeiro</span>
                <h3 className="text-xl font-bold tracking-tighter text-white mt-1 italic uppercase">
                  {editingId ? 'Editar Lançamento' : 'Nova Movimentação'}
                </h3>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X size={24} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Tipo de Fluxo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewTransaction({...newTransaction, type: 'income'})}
                    className={`flex-1 py-3 border text-[9px] font-black uppercase transition-all rounded-none ${
                      newTransaction.type === 'income' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white/5 border-white/5 text-zinc-500'
                    }`}
                  >
                    Receita (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransaction({...newTransaction, type: 'expense'})}
                    className={`flex-1 py-3 border text-[9px] font-black uppercase transition-all rounded-none ${
                      newTransaction.type === 'expense' ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/5 border-white/5 text-zinc-500'
                    }`}
                  >
                    Despesa (-)
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Descrição</label>
                <Input 
                  value={newTransaction.description}
                  onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="bg-white/5 border-white/10 h-14 rounded-none px-6 text-sm font-bold focus-visible:ring-white/20"
                  placeholder="Ex: Assinatura Cloud"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Valor (R$)</label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={newTransaction.amount}
                    onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                    className="bg-white/5 border-white/10 h-14 rounded-none px-6 text-sm font-bold focus-visible:ring-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Data</label>
                  <Input 
                    type="date"
                    value={newTransaction.date}
                    onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                    className="bg-white/5 border-white/10 h-14 rounded-none px-6 text-sm font-bold focus-visible:ring-white/20 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Categoria</label>
                  <select 
                    value={newTransaction.category}
                    onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 h-14 px-6 text-[10px] font-black text-zinc-300 rounded-none focus:outline-none appearance-none uppercase tracking-widest"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Método de Pagto</label>
                  <select 
                    value={newTransaction.paymentMethod}
                    onChange={e => setNewTransaction({...newTransaction, paymentMethod: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 h-14 px-6 text-[10px] font-black text-zinc-300 rounded-none focus:outline-none appearance-none uppercase tracking-widest"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.id} value={method.id}>{method.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full h-16 bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-none hover:bg-zinc-200 transition-all shadow-xl mt-4">
                {editingId ? 'Salvar Alterações' : 'Confirmar Lançamento'}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
