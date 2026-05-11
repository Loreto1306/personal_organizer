from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes import router_node, observation_node, rag_search_node, reflection_node, output_node

def create_agent_graph():
    """
    Constrói o fluxo de pensamento multi-agente do Lux.
    """
    workflow = StateGraph(AgentState)

    # Adicionando os Nós
    workflow.add_node("router", router_node)
    workflow.add_node("observation", observation_node)
    workflow.add_node("rag_search", rag_search_node)
    workflow.add_node("reflection", reflection_node)
    workflow.add_node("output", output_node)

    # Definindo as Arestas (Flow)
    workflow.set_entry_point("router")
    
    # Roteamento condicional (Simplificado para este estágio)
    workflow.add_edge("router", "observation") # Default por enquanto
    # Em uma versão futura usaríamos workflow.add_conditional_edges
    
    workflow.add_edge("observation", "reflection")
    workflow.add_edge("rag_search", "reflection")
    workflow.add_edge("reflection", "output")
    workflow.add_edge("output", END)

    return workflow.compile()

# Instância pronta para uso
crypto_agent = create_agent_graph()
