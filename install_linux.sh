#!/bin/bash
# Sistema de Notificações Internas - Instalador Linux
# Execute com: chmod +x install_linux.sh && ./install_linux.sh

set -e  # Parar em caso de erro

echo "========================================"
echo " Sistema de Notificações Internas"
echo " Instalador Linux"
echo "========================================"
echo

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ ERRO: Python3 não encontrado!"
    echo
    echo "Para instalar Python:"
    echo "Ubuntu/Debian: sudo apt-get install python3 python3-pip"
    echo "RHEL/CentOS: sudo yum install python3 python3-pip"
    echo "Fedora: sudo dnf install python3 python3-pip"
    echo
    exit 1
fi

echo "✅ Python encontrado"
python3 --version

# Verificar pip
if ! command -v pip3 &> /dev/null; then
    echo "⚠️ pip3 não encontrado. Tentando instalar..."
    
    # Detectar distribuição
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y python3-pip
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3-pip
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y python3-pip
    else
        echo "❌ Não foi possível instalar pip automaticamente"
        echo "Instale pip3 manualmente e execute novamente"
        exit 1
    fi
fi

echo
echo "Instalando dependências Python..."
echo

# Instalar dependências
if pip3 install -r requirements.txt; then
    echo "✅ Dependências instaladas com sucesso"
else
    echo "⚠️ Erro na instalação via requirements.txt, tentando individual..."
    pip3 install websockets>=11.0.3
    pip3 install plyer>=2.1.0
fi

echo
echo "Instalando notify-send (notificações Linux)..."

# Instalar notify-send baseado na distribuição
if command -v apt-get &> /dev/null; then
    sudo apt-get install -y libnotify-bin
elif command -v yum &> /dev/null; then
    sudo yum install -y libnotify
elif command -v dnf &> /dev/null; then
    sudo dnf install -y libnotify
elif command -v pacman &> /dev/null; then
    sudo pacman -S --noconfirm libnotify
else
    echo "⚠️ Não foi possível instalar notify-send automaticamente"
    echo "Instale libnotify/notify-send manualmente para melhor experiência"
fi

echo
echo "Configurando firewall..."

# Configurar firewall baseado no sistema
if command -v ufw &> /dev/null; then
    sudo ufw allow 8765/tcp
    echo "✅ Firewall UFW configurado"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --add-port=8765/tcp --permanent
    sudo firewall-cmd --reload
    echo "✅ Firewall firewalld configurado"
else
    echo "⚠️ Firewall não configurado automaticamente"
    echo "Configure manualmente a porta 8765 TCP"
fi

echo
echo "Criando scripts de execução..."

# Criar script para servidor
cat > start_server.sh << 'EOF'
#!/bin/bash
echo "Iniciando Servidor de Notificações..."
python3 notification_server.py
EOF

# Criar script para cliente
cat > start_client.sh << 'EOF'
#!/bin/bash
echo "Iniciando Cliente de Notificações..."
python3 notification_client.py --console
EOF

# Criar script para cliente daemon
cat > start_client_daemon.sh << 'EOF'
#!/bin/bash
echo "Iniciando Cliente como Daemon..."

# Verificar se já está rodando
if pgrep -f "notification_client.py" > /dev/null; then
    echo "⚠️ Cliente já está rodando"
    exit 1
fi

# Configurar DISPLAY se em ambiente gráfico
if [ -n "$DISPLAY" ]; then
    export DISPLAY=:0
fi

# Iniciar em segundo plano
nohup python3 notification_client.py > /dev/null 2>&1 &
PID=$!

echo "Cliente iniciado como daemon (PID: $PID)"
echo "Para parar: ./stop_client_daemon.sh"

# Salvar PID
echo $PID > notification_client.pid
EOF

# Criar script para parar daemon
cat > stop_client_daemon.sh << 'EOF'
#!/bin/bash
echo "Parando Cliente Daemon..."

# Parar usando PID salvo
if [ -f notification_client.pid ]; then
    PID=$(cat notification_client.pid)
    if kill -0 $PID 2>/dev/null; then
        kill $PID
        echo "Cliente parado (PID: $PID)"
        rm -f notification_client.pid
    else
        echo "Cliente não estava rodando"
        rm -f notification_client.pid
    fi
else
    # Fallback: matar por nome do processo
    pkill -f "notification_client.py"
    echo "Processo notification_client.py parado"
fi
EOF

# Tornar scripts executáveis
chmod +x start_server.sh
chmod +x start_client.sh
chmod +x start_client_daemon.sh
chmod +x stop_client_daemon.sh

echo "✅ Scripts criados:"
echo "  - start_server.sh (inicia servidor)"
echo "  - start_client.sh (inicia cliente com console)"
echo "  - start_client_daemon.sh (inicia cliente como daemon)"
echo "  - stop_client_daemon.sh (para daemon)"

echo
echo "Criando arquivo de configuração do cliente..."
python3 notification_client.py --create-config > /dev/null 2>&1 || true

echo
echo "Configurando serviço systemd (opcional)..."

# Criar arquivo de serviço systemd
CURRENT_DIR=$(pwd)
cat > notification-client.service << EOF
[Unit]
Description=Sistema de Notificações Internas - Cliente
After=network.target
Wants=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$CURRENT_DIR
Environment=DISPLAY=:0
ExecStart=/usr/bin/python3 $CURRENT_DIR/notification_client.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Arquivo de serviço systemd criado: notification-client.service"
echo
echo "Para instalar como serviço do sistema:"
echo "  sudo cp notification-client.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable notification-client"
echo "  sudo systemctl start notification-client"

echo
echo "========================================"
echo " Instalação Concluída!"
echo "========================================"
echo
echo "PRÓXIMOS PASSOS:"
echo
echo "1. SERVIDOR (máquina admin):"
echo "   - Execute: ./start_server.sh"
echo "   - Anote o IP mostrado na interface"
echo
echo "2. CLIENTES (outras máquinas):"
echo "   - Edite client_config.ini com o IP do servidor"
echo "   - Execute: ./start_client_daemon.sh"
echo
echo "3. SEGURANÇA:"
echo "   - Altere o token padrão nos arquivos Python"
echo "   - Use o mesmo token no servidor e clientes"
echo
echo "4. SERVIÇO SYSTEMD (opcional):"
echo "   - Siga as instruções acima para auto-start"
echo
echo "Documentação completa no manual fornecido."
echo