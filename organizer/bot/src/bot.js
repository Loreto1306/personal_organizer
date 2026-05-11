// bot_operario.js
const mineflayer = require('mineflayer')

// Configuração de conexão no LAN
const bot = mineflayer.createBot({
  host: '127.0.0.1',
  port: 55553, // Substitua pela porta que o jogo liberar ao abrir para LAN
  username: 'BotConstrutor'
})

bot.once('spawn', () => {
  console.log('[Bot] Entrei no mundo LAN com sucesso!')
  
  // Prepara o cenário
  bot.chat('/time set day')
  bot.chat('/weather clear')
  
  // Aciona a construção após 2 segundos
  setTimeout(() => {
    console.log('[Bot] Disparando o Litematica Printer...')
    bot.chat('/litematica print start')
  }, 2000)
})

// Escuta o chat do jogo para feedback (útil para saber quando terminou)
bot.on('chat', (username, message) => {
  if (username === bot.username) return
  console.log(`[Log do Jogo] ${message}`)
})

bot.on('error', err => console.log(`[Erro] ${err}`))