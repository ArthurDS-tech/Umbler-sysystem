# ⚡ Guia de Início Rápido

## 🚀 Para Começar Imediatamente

### 1️⃣ Configuração Automática
```bash
python quick_setup.py
```
Siga as instruções na tela para configurar automaticamente.

### 2️⃣ Instalação Automática

**Windows (como Administrador):**
```batch
install_windows.bat
```

**Linux:**
```bash
chmod +x install_linux.sh
./install_linux.sh
```

### 3️⃣ Execução

**Servidor (máquina admin):**
- Windows: `start_server.bat`
- Linux: `./start_server.sh`

**Clientes (outras máquinas):**
- Windows: `start_client_background.bat`  
- Linux: `./start_client_daemon.sh`

## 🧪 Teste Rápido

```bash
python test_system.py
```

## ⚙️ Configuração Manual (se necessário)

### Servidor
1. Edite `notification_server.py` linha 35:
   ```python
   self.auth_token = "SEU_TOKEN_AQUI"
   ```

### Cliente
1. Edite `client_config.ini`:
   ```ini
   server_host = IP_DO_SERVIDOR
   auth_token = SEU_TOKEN_AQUI
   ```

## 🔥 Deploy em Massa (Linux)

```bash
# Edite IPs no script
./deploy_clients.sh --install-all
./deploy_clients.sh --status
```

## 🆘 Problemas?

1. **Não conecta**: Verifique IP e firewall (porta 8765)
2. **Sem notificações**: Instale `libnotify-bin` (Linux) ou `win10toast` (Windows)
3. **Erro de dependências**: Execute `pip install -r requirements.txt`

## 📱 Uso

1. Abra o servidor (interface gráfica aparece)
2. Digite mensagem no campo
3. Clique "Enviar Notificação"
4. Todos os clientes conectados recebem a notificação

---
**Tempo total de setup**: ~10 minutos para rede completa