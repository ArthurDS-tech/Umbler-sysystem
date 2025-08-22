@echo off
REM Sistema de Notificações Internas - Instalador Windows
REM Execute como Administrador para melhor funcionamento

echo ========================================
echo  Sistema de Notificações Internas
echo  Instalador Windows
echo ========================================
echo.

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python não encontrado!
    echo.
    echo Por favor, instale Python 3.11+ de:
    echo https://www.python.org/downloads/
    echo.
    echo Certifique-se de marcar "Add Python to PATH" durante a instalação.
    pause
    exit /b 1
)

echo ✅ Python encontrado
python --version

echo.
echo Instalando dependências Python...
echo.

REM Instalar dependências
pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo ❌ Erro na instalação de dependências
    echo Tentando instalação individual...
    echo.
    
    pip install websockets>=11.0.3
    pip install plyer>=2.1.0
    pip install win10toast>=0.9
)

echo.
echo Configurando firewall do Windows...
echo.

REM Adicionar regra de firewall (requer privilégios de admin)
netsh advfirewall firewall add rule name="Notificações Internas - Servidor" dir=in action=allow protocol=TCP localport=8765 >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Não foi possível configurar firewall automaticamente
    echo Execute como Administrador ou configure manualmente:
    echo Porta: 8765 TCP Entrada
) else (
    echo ✅ Firewall configurado
)

echo.
echo Criando scripts de execução...
echo.

REM Criar script para servidor
echo @echo off > start_server.bat
echo echo Iniciando Servidor de Notificações... >> start_server.bat
echo python notification_server.py >> start_server.bat
echo pause >> start_server.bat

REM Criar script para cliente
echo @echo off > start_client.bat
echo echo Iniciando Cliente de Notificações... >> start_client.bat
echo python notification_client.py --console >> start_client.bat
echo pause >> start_client.bat

REM Criar script para cliente em segundo plano
echo @echo off > start_client_background.bat
echo echo Iniciando Cliente em Segundo Plano... >> start_client_background.bat
echo start /B python notification_client.py >> start_client_background.bat
echo echo Cliente iniciado em segundo plano >> start_client_background.bat
echo timeout /t 3 >> start_client_background.bat

REM Criar script para parar cliente
echo @echo off > stop_client.bat
echo echo Parando Cliente de Notificações... >> stop_client.bat
echo taskkill /F /IM python.exe /FI "WINDOWTITLE eq notification_client*" >> stop_client.bat
echo echo Cliente parado >> stop_client.bat
echo pause >> stop_client.bat

echo ✅ Scripts criados:
echo   - start_server.bat (inicia servidor)
echo   - start_client.bat (inicia cliente com console)
echo   - start_client_background.bat (inicia cliente em segundo plano)
echo   - stop_client.bat (para cliente)

echo.
echo Criando arquivo de configuração do cliente...
python notification_client.py --create-config >nul 2>&1

echo.
echo ========================================
echo  Instalação Concluída!
echo ========================================
echo.
echo PRÓXIMOS PASSOS:
echo.
echo 1. SERVIDOR (máquina admin):
echo    - Execute: start_server.bat
echo    - Anote o IP mostrado na interface
echo.
echo 2. CLIENTES (outras máquinas):
echo    - Edite client_config.ini com o IP do servidor
echo    - Execute: start_client_background.bat
echo.
echo 3. SEGURANÇA:
echo    - Altere o token padrão nos arquivos Python
echo    - Use o mesmo token no servidor e clientes
echo.
echo Documentação completa no manual fornecido.
echo.
pause