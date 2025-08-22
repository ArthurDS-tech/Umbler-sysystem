# 🔔 Sistema de Notificações Internas

Sistema completo para envio de notificações em tempo real para todos os computadores da rede interna da empresa.

## 📋 Componentes

- **`notification_server.py`** - Servidor/Admin com interface gráfica
- **`notification_client.py`** - Cliente que roda em segundo plano
- **Scripts de instalação** - Automatizam configuração
- **Scripts de execução** - Facilitam uso diário

## 🚀 Instalação Rápida

### Windows
```batch
# Execute como Administrador
install_windows.bat
```

### Linux
```bash
chmod +x install_linux.sh
./install_linux.sh
```

## ⚙️ Configuração

1. **Servidor**: Altere o token em `notification_server.py` (linha 35)
2. **Clientes**: Configure IP do servidor em `client_config.ini`
3. **Firewall**: Libere porta 8765 TCP

## 💻 Uso

### Iniciar Servidor (Máquina Admin)
- **Windows**: `start_server.bat`
- **Linux**: `./start_server.sh`

### Iniciar Clientes (Outras Máquinas)
- **Windows**: `start_client_background.bat`
- **Linux**: `./start_client_daemon.sh`

## 📁 Estrutura de Arquivos

```
notification-system/
├── notification_server.py      # Servidor principal
├── notification_client.py      # Cliente
├── requirements.txt            # Dependências Python
├── client_config.ini          # Configuração do cliente
├── install_windows.bat        # Instalador Windows
├── install_linux.sh          # Instalador Linux
├── start_server.bat          # Iniciar servidor (Windows)
├── start_server.sh           # Iniciar servidor (Linux)
├── start_client_background.bat # Cliente background (Windows)
├── start_client_daemon.sh     # Cliente daemon (Linux)
├── stop_client_daemon.sh      # Parar daemon (Linux)
├── notification-client.service # Serviço systemd
├── deploy_clients.sh          # Deploy em massa
└── README.md                 # Este arquivo
```

## 🔒 Segurança

- ✅ Autenticação por token
- ✅ Apenas rede interna
- ✅ Logs de auditoria
- ✅ Reconexão automática

## 📊 Funcionalidades

- ✅ Interface gráfica intuitiva
- ✅ Notificações multiplataforma
- ✅ Reconexão automática
- ✅ Deploy em massa
- ✅ Logs detalhados
- ✅ Serviço systemd

## 🆘 Suporte

- **Logs**: `server_notifications.log` e `client_notifications.log`
- **Teste**: `python notification_client.py --test-notification`
- **Status**: Verificar GUI do servidor ou logs

## 📞 Comandos Úteis

```bash
# Verificar processos
ps aux | grep notification  # Linux
tasklist | findstr python   # Windows

# Verificar porta
netstat -tulpn | grep 8765  # Linux
netstat -an | findstr 8765  # Windows

# Deploy em massa (Linux)
./deploy_clients.sh --install-all
./deploy_clients.sh --status
```

---
**Versão**: 1.0 | **Autor**: Sistema de TI