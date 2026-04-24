# Lux System - Personal Organizer
*High Performance & Minimalist Design*

## 🎯 Objetivo do Projeto
Desenvolver um ecossistema de produtividade focado em **foco absoluto, disciplina e evolução constante**. O sistema integra gestão de tempo, rastreamento de hábitos (rotinas), progresso estratégico (objetivos) e saúde financeira em uma interface de alta fidelidade baseada na estética *Glass Bento*.

---

## 🛠️ Evolução Tecnológica (Build Log)

### **Arquitetura de Dados (Backend)**
- **Motor:** Node.js + Express + SQLite (`better-sqlite3`).
- **Esquema Técnico:**
    - `tasks`: Suporte a Ações Únicas (`event`) e Rotinas Recorrentes (`routine`).
    - `task_completions`: Rastreamento histórico de conclusões por data (essencial para hábitos).
    - `assets`: Gestão de custódia (Ações, FIIs, Cripto) com cálculo de P&L.
- **Sistema de Resposta:** API padronizada com retorno de `status` e `message` para feedback em tempo real.

### **Identidade Visual & UX (Frontend)**
- **Estética "Lux Minimalist":** Fusão de *Glassmorphism* (translucidez `#white/[0.01]`) com *Bento Grid* (blocos estruturados).
- **Contraste Arquitetônico:** Datas e containers arredondados (`rounded-2xl`) vs. Itens de execução e inputs perfeitamente quadrados (`rounded-none`).
- **Logo:** Identidade Lux representada pelo **"L"** estilizado em tipografia premium.
- **Responsividade Total:**
    - Sidebar adaptativa (Menu lateral no desktop / Drawer no mobile).
    - Grade da Agenda inteligente (7 colunas no desktop / Lista vertical no mobile).
    - Dashboards e Tabelas otimizadas para leitura em telas pequenas.

### **Funcionalidades Implementadas**
1.  **Dashboard Estratégico:** Visão global de execução, patrimônio e missões críticas.
2.  **Cronograma de Elite:** Gestão semanal de rotinas e compromissos com tracking por data.
3.  **Centro de Comando (Tarefas):** Sistema de captura rápida com presets técnicos e modal de configuração avançada.
4.  **Custódia Global:** Acompanhamento de ativos financeiros com indicadores de performance.
5.  **Global Toast System:** Notificações automáticas integradas à API (Sucesso, Erro, Aviso).

---

## 🚀 Plano de Próximos Passos

### **Fase 1: Inteligência & Evolução**
- [ ] **Automação de Progresso:** Vincular a conclusão de tarefas aos "Objetivos Mestre", atualizando as barras de progresso automaticamente.
- [ ] **Data Analytics:** Implementar gráficos de linha (evolução patrimonial) e radar (equilíbrio de hábitos) no Dashboard.
- [ ] **Sports Log:** Transformar o placeholder de 42km em um sistema real de logs de atividade física (Volume/Intensidade).

### **Fase 2: Gestão de Fluxo**
- [ ] **Cash Flow:** Desenvolver a aba "Finanças" para controle de entradas/saídas diárias (fluxo de caixa).
- [ ] **Filtros Avançados:** Busca e filtragem por prioridade e datas customizadas no Pipeline de Execução.

### **Fase 3: Refinamento de UX**
- [ ] **Lembretes Nativos:** Integração com notificações do navegador para eventos agendados.
- [ ] **Keyboard Shortcuts:** Atalhos de teclado para captura rápida de tarefas (ex: `Cmd/Ctrl + K`).

---
**Status do Sistema:** Operacional, Responsivo e Estável.
*Última atualização: 24 de Abril de 2026*
