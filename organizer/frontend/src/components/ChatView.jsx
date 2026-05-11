import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Terminal, Send, Bot, User, AlertCircle, Cpu, Bug, ChevronRight, Paperclip, X, FileText } from 'lucide-react'
import { agentService } from '@/lib/api'

export function ChatView() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugMode, setDebugMode] = useState(true)
  const [lastDebugData, setLastDebugData] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [csvSymbol, setCsvSymbol] = useState('')
  const fileInputRef = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if ((!input.trim() && !csvFile) || loading) return

    const userContent = csvFile
      ? `[CSV: ${csvFile.name}${csvSymbol ? ` | ${csvSymbol}` : ''}] ${input || 'Analise este gráfico.'}`
      : input

    setMessages(prev => [...prev, { role: 'user', content: userContent }])
    setInput('')
    setLoading(true)

    try {
      let data
      if (csvFile) {
        data = await agentService.analyzeCSV(
          csvFile,
          csvSymbol || 'UNKNOWN',
          input || 'Analise este gráfico e me dê sua interpretação técnica.'
        )
        setCsvFile(null)
        setCsvSymbol('')
      } else {
        data = await agentService.chat(input)
      }

      setLastDebugData(data)

      if (data.status === 'success') {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setMessages(prev => [...prev, {
          role: 'system',
          content: `ERRO AGENTE: ${data.message || 'Falha na resposta'}`,
          isError: true
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'ERRO CONEXÃO: Não foi possível conectar ao serviço Python na porta 8000.',
        isError: true
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-12rem)] animate-in fade-in duration-1000">
      
      {/* Coluna do Chat (8 Colunas) */}
      <div className="lg:col-span-8 flex flex-col glass-minimal rounded-[2rem] border-white/10 overflow-hidden relative">
        
        {/* Header do Chat */}
        <div className="px-8 py-6 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black italic uppercase tracking-tighter text-white">Lux AI Co-Pilot</h2>
              <p className="text-[9px] font-black tracking-[0.3em] uppercase text-emerald-500/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Motor Local Ativo
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setDebugMode(!debugMode)}
            className={`text-[9px] font-black uppercase tracking-widest ${debugMode ? 'text-rose-400' : 'text-white/20'}`}
          >
            <Bug size={14} className="mr-2" /> Debug: {debugMode ? 'ON' : 'OFF'}
          </Button>
        </div>

        {/* Área de Mensagens */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-20">
              <Terminal size={48} />
              <p className="text-xs font-black uppercase tracking-[0.4em]">Aguardando Prompt de Comando...</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-white/5 border-white/10 text-white/40' : 
                  msg.isError ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' : 'bg-white text-black border-white'
                }`}>
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                  msg.role === 'user' ? 'bg-white/5 text-white/80 rounded-tr-none' : 
                  msg.isError ? 'bg-rose-500/5 text-rose-400 border border-rose-500/10 rounded-tl-none' : 'bg-white/5 text-white border border-white/5 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start animate-pulse">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                  <Cpu size={14} className="animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 text-white/20 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  Processando Redes Neurais...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input de Comando */}
        <form onSubmit={handleSendMessage} className="p-6 bg-black/40 border-t border-white/5 space-y-3">

          {/* Preview do CSV selecionado */}
          {csvFile && (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl animate-in fade-in">
              <FileText size={14} className="text-emerald-400 shrink-0" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex-1 truncate">{csvFile.name}</span>
              <Input
                value={csvSymbol}
                onChange={e => setCsvSymbol(e.target.value.toUpperCase())}
                placeholder="SÍMBOLO (ex: BTCUSDT)"
                className="w-36 h-8 bg-white/5 border-white/10 text-[10px] font-bold text-white rounded-lg px-3 focus-visible:ring-white/20 placeholder:text-white/10 uppercase"
              />
              <button type="button" onClick={() => setCsvFile(null)} className="text-white/20 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
          )}

          <div className="relative group flex gap-2">
            {/* Botão de attach CSV */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={e => e.target.files?.[0] && setCsvFile(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`h-16 px-4 rounded-xl border transition-all flex items-center justify-center shrink-0 ${
                csvFile
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-white/20 hover:text-white/60 hover:border-white/20'
              }`}
              title="Anexar CSV do TradingView"
            >
              <Paperclip size={18} />
            </button>

            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-4 flex items-center text-white/20 group-focus-within:text-white transition-colors">
                <ChevronRight size={18} />
              </div>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={csvFile ? "Pergunta opcional sobre o gráfico..." : "Digite sua consulta estratégica..."}
                className="w-full bg-white/5 border-white/10 h-16 pl-12 pr-4 rounded-xl font-bold text-white focus-visible:ring-white/20 placeholder:text-white/10 uppercase text-xs tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-16 px-5 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 shrink-0"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>

      {/* Coluna de Logs Brutos (4 Colunas) */}
      <div className={`lg:col-span-4 flex flex-col transition-all duration-500 ${debugMode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
        <div className="flex-1 flex flex-col glass-minimal rounded-[2rem] border-rose-500/10 bg-rose-500/[0.01] overflow-hidden">
          <div className="px-6 py-4 border-b border-rose-500/10 flex items-center gap-3 text-rose-400">
            <Bug size={16} />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">Console Bruto de Saída</h3>
          </div>
          <div className="flex-1 p-6 font-mono text-[10px] overflow-y-auto space-y-4 text-zinc-500 scrollbar-hide">
            {!lastDebugData ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-30 italic">
                <AlertCircle size={24} />
                <p>Nenhum dado capturado</p>
              </div>
            ) : (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <div className="space-y-2">
                  <p className="text-emerald-500 font-bold tracking-widest uppercase text-[8px]">[STATUS: {lastDebugData.status}]</p>
                  {lastDebugData.traceback && (
                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 overflow-x-auto whitespace-pre">
                      {lastDebugData.traceback}
                    </div>
                  )}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl overflow-x-auto">
                    <pre className="text-white/60">
                      {JSON.stringify(lastDebugData.state || lastDebugData, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
