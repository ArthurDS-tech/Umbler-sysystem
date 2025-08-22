@echo off
echo Iniciando Cliente em Segundo Plano...
start /B python notification_client.py
echo Cliente iniciado em segundo plano
timeout /t 3