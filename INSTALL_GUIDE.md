# 📥 Guia de Instalação Rápida

## 🎯 Pré-requisitos

- **Python 3.11+** instalado
- **Rede interna** funcionando
- **Privilégios de administrador** (recomendado)

## ⚡ Instalação Automática

### Windows
1. Baixe todos os arquivos do sistema
2. Execute **como Administrador**:
   ```batch
   install_windows.bat
   ```
3. Siga as instruções na tela

### Linux
1. Baixe todos os arquivos do sistema
2. Execute:
   ```bash
   chmod +x install_linux.sh
   ./install_linux.sh
   ```
3. Siga as instruções na tela

## 🔧 Configuração

### 1. Servidor (Máquina Admin)
- Altere o token em `notification_server.py` (linha 35)
- Execute: `start_server.bat` (Windows) ou `./start_server.sh` (Linux)
- Anote o IP mostrado na interface

### 2. Clientes (Outras Máquinas)
- Edite `client_config.ini` com o IP do servidor
- Use o mesmo token configurado no servidor
- Execute: `start_client_background.bat` (Windows) ou `./start_client_daemon.sh` (Linux)

## 🧪 Teste

Execute para verificar se tudo está funcionando:
```bash
python test_system.py
```

## 🆘 Problemas Comuns

### "Python não encontrado"
- **Windows**: Instale de [python.org](https://python.org) e marque "Add to PATH"
- **Linux**: `sudo apt-get install python3 python3-pip`

### "Conexão recusada"
- Verifique se o servidor está rodando
- Verifique IP e porta no `client_config.ini`
- Verifique firewall (porta 8765 TCP)

### "Notificações não aparecem"
- **Windows**: `pip install win10toast`
- **Linux**: `sudo apt-get install libnotify-bin`

## 📞 Comandos de Diagnóstico

```bash
# Verificar se está rodando
ps aux | grep notification  # Linux
tasklist | findstr python   # Windows

# Verificar porta
netstat -an | grep 8765

# Teste de conectividade
ping IP_DO_SERVIDOR
telnet IP_DO_SERVIDOR 8765
```

## ✅ Verificação Final

1. ✅ Servidor mostra interface gráfica
2. ✅ Clientes aparecem na lista "Conectados"
3. ✅ Mensagem de teste é recebida pelos clientes
4. ✅ Logs não mostram erros críticos

---
**Tempo estimado de instalação**: 5-10 minutos por máquina