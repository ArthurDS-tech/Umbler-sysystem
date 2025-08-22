@echo off
echo Parando Cliente de Notificações...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq notification_client*"
echo Cliente parado
pause