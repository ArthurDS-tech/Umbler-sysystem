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