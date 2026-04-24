import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, TrendingDown, DollarSign, Wallet, PieChart, Plus, ArrowUpRight, Coins, Landmark } from 'lucide-react'
import { financeService } from '@/lib/api'

export function InvestmentsView() {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      const data = await financeService.getAssets()
      setAssets(data)
    } catch (error) {
      console.error("Erro ao carregar ativos:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTotal = () => {
    return assets.reduce((acc, asset) => acc + (asset.quantity * (asset.currentPrice || asset.averagePrice)), 0)
  }

  const calculateGain = () => {
    return assets.reduce((acc, asset) => {
      if (!asset.currentPrice) return acc
      return acc + (asset.quantity * (asset.currentPrice - asset.averagePrice))
    }, 0)
  }

  const getAssetsByCategory = (category) => {
    return assets.filter(a => a.category === category)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const total = calculateTotal()
  const gain = calculateGain()
  const isGainPositive = gain >= 0

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center gap-4">
          <div className="p-3 md:p-4 rounded-2xl bg-white/5 border border-white/10 text-white/80">
            <PieChart size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase text-white">Arquitetura de Ativos</h2>
            <p className="text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase text-white/20">Monitoramento Ativo</p>
          </div>
        </div>
        <Button className="w-full sm:w-auto bg-white text-black font-black italic rounded-xl px-8 md:px-10 py-5 md:py-6 hover:bg-white/90 shadow-2xl transition-all text-xs uppercase tracking-widest">
          <Plus size={18} className="mr-2" /> Novo Ativo
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border-white/10 relative overflow-hidden group min-h-[160px] md:min-h-0">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all rotate-12">
            <Wallet size={80} />
          </div>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Patrimônio Líquido</span>
          <p className="text-3xl md:text-5xl font-black tracking-tighter italic mt-4 text-white">{formatCurrency(total)}</p>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] md:text-[10px] font-black mt-4 border ${isGainPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
            {isGainPositive ? <ArrowUpRight size={12} /> : <TrendingDown size={12} />}
            <span>{formatCurrency(gain)} (+{((gain / (total - gain || 1)) * 100).toFixed(2)}%)</span>
          </div>
        </div>

        <div className="glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border-white/5 flex flex-col justify-between min-h-[140px] md:min-h-0">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Renda Variável</span>
          <p className="text-2xl md:text-3xl font-black tracking-tighter italic text-white/80 mt-2 md:mt-0">
            {formatCurrency(getAssetsByCategory('stock').reduce((acc, a) => acc + (a.quantity * (a.currentPrice || a.averagePrice)), 0))}
          </p>
        </div>

        <div className="glass-minimal rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 border-white/5 flex flex-col justify-between min-h-[140px] md:min-h-0">
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Ativos Digitais</span>
          <p className="text-2xl md:text-3xl font-black tracking-tighter italic text-white/80 mt-2 md:mt-0">
            {formatCurrency(getAssetsByCategory('crypto').reduce((acc, a) => acc + (a.quantity * (a.currentPrice || a.averagePrice)), 0))}
          </p>
        </div>
      </div>

      <div className="glass-minimal rounded-[2rem] md:rounded-[3rem] border-white/5 overflow-hidden shadow-2xl">
        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-white/5 bg-white/[0.01]">
          <h3 className="text-base md:text-lg font-black italic uppercase tracking-tighter text-white">Composição do Pipeline</h3>
        </div>
        
        {/* Tabela Desktop */}
        <div className="hidden md:block">
          <Table>
            <TableHeader className="bg-white/[0.01]">
              <TableRow className="hover:bg-transparent border-white/5 h-12">
                <TableHead className="px-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Ativo</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Quantidade</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Preço Médio</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Preço Atual</TableHead>
                <TableHead className="text-right px-10 text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-28 text-white/10 italic font-black uppercase tracking-widest text-2xl">
                    Horizonte Vazio
                  </TableCell>
                </TableRow>
              ) : (
                assets.map((asset) => {
                  const assetGain = asset.currentPrice ? (asset.currentPrice - asset.averagePrice) * asset.quantity : 0;
                  return (
                    <TableRow key={asset.id} className="border-white/5 hover:bg-white/[0.02] transition-all h-16 group">
                      <TableCell className="px-10">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-[10px] text-white/40 group-hover:border-white/40 group-hover:text-white transition-all">
                            {asset.symbol.substring(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight text-white">{asset.symbol}</span>
                            <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">{asset.category}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-xs text-white/60">{asset.quantity}</TableCell>
                      <TableCell className="text-right font-medium text-xs text-white/40">{formatCurrency(asset.averagePrice)}</TableCell>
                      <TableCell className="text-right font-bold text-xs text-white">
                        {asset.currentPrice ? formatCurrency(asset.currentPrice) : '—'}
                      </TableCell>
                      <TableCell className={`text-right px-8 font-bold text-sm ${assetGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {assetGain !== 0 ? formatCurrency(assetGain) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Lista Mobile */}
        <div className="md:hidden divide-y divide-white/5">
          {assets.length === 0 ? (
            <div className="py-20 text-center text-white/10 font-black uppercase text-xl">Vazio</div>
          ) : (
            assets.map((asset) => {
              const assetTotal = asset.quantity * (asset.currentPrice || asset.averagePrice);
              const assetGain = asset.currentPrice ? (asset.currentPrice - asset.averagePrice) * asset.quantity : 0;
              return (
                <div key={asset.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-[10px] text-white/40">
                        {asset.symbol.substring(0, 2)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-base italic tracking-tighter text-white">{asset.symbol}</span>
                        <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">{asset.category}</span>
                      </div>
                    </div>
                    <div className={`text-right font-black italic ${assetGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {assetGain !== 0 ? formatCurrency(assetGain) : '—'}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-white/20">Quantidade</span>
                      <span className="text-xs font-bold text-white/60">{asset.quantity}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[8px] font-black uppercase text-white/20">Valor Total</span>
                      <span className="text-xs font-black text-white">{formatCurrency(assetTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  )
}
