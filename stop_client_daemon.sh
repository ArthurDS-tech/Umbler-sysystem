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