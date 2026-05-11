import subprocess
import sys

def acionar_bot_lan_streaming():
    print("[OpenClaw] Solicitando conexão do bot via LAN...")
    
    # Popen inicia o processo sem bloquear o código imediatamente
    processo = subprocess.Popen(
        ["node", "bot.js"],
        stdout=subprocess.PIPE,  # Captura a saída padrão (console.log)
        stderr=subprocess.PIPE,  # Captura erros
        text=True,               # Trata a saída como string
        bufsize=1                # Garante leitura linha por linha (sem buffer gigante)
    )
    
    print("[OpenClaw] Escutando o terminal do Node.js em tempo real:\n" + "-"*40)
    
    try:
        # Lê a saída do Node.js continuamente enquanto o processo estiver vivo
        for linha in processo.stdout:
            # Imprime o log do bot limpo (removendo quebras de linha extras)
            print(f"[Node] {linha.strip()}")
            
            # Aqui no futuro você pode colocar lógicas do OpenClaw!
            # Ex: if "[Bot] Terminei a construção" in linha: 
            #         processo.terminate() 
            #         iniciar_edicao_video()
            
    except KeyboardInterrupt:
        print("\n[OpenClaw] Interrompendo o bot manualmente...")
        processo.terminate()
        processo.wait()
        print("[OpenClaw] Processo finalizado.")

if __name__ == "__main__":
    acionar_bot_lan_streaming()