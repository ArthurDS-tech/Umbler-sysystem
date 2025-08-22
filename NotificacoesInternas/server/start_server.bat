@echo off
REM Script de Instalação - Sistema de Notificações Windows
REM Execute como Administrador

echo ===============================================
echo   Sistema de Notificações Internas
echo   Instalação para Windows
echo ===============================================

REM Verifica se Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Python não encontrado!
    echo Por favor, instale Python 3.11+ de https://python.org
    pause
    exit /b 1
)

echo Python encontrado:
python --version

REM Verifica versão do Python
python -c "import sys; exit(0 if sys.version_info >= (3,11) else 1)"
if %errorlevel% neq 0 (
    echo ERRO: Versão do Python muito antiga!
    echo Necessário Python 3.11 ou superior
    pause
    exit /b 1
)

echo.
echo Instalando dependências...

REM Atualiza pip
python -m pip install --upgrade pip

REM Instala dependências
python -m pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependências
    echo Tentando instalação individual...
    
    python -m pip install websockets>=11.0.3
    python -m pip install plyer>=2.1.0
    python -m pip install win10toast>=0.9
)

echo.
echo Criando atalhos...

REM Cria arquivo batch para execução do servidor
echo @echo off > start_server.bat
echo cd /d "%~dp0" >> start_server.bat
echo python notification_server.py >> start_server.bat
echo pause >> start_server.bat

REM Cria arquivo batch para execução do cliente
echo @echo off > start_client.bat
echo cd /d "%~dp0" >> start_client.bat
echo python notification_client.py >> start_client.bat
echo pause >> start_client.bat

REM Cria arquivo batch para cliente em segundo plano
echo @echo off > start_client_background.bat
echo cd /d "%~dp0" >> start_client_background.bat
echo start /min python notification_client.py >> start_client_background.bat

echo.
echo ===============================================
echo   Instalação concluída com sucesso!
echo ===============================================
echo.
echo Arquivos criados:
echo - start_server.bat (Executar servidor/admin)
echo - start_client.bat (Executar cliente)
echo - start_client_background.bat (Cliente em segundo plano)
echo.
echo CONFIGURAÇÃO IMPORTANTE:
echo 1. Edite o IP do servidor no arquivo client_config.ini
echo 2. Configure o firewall para liberar a porta 8765
echo 3. Execute start_server.bat na máquina administradora
echo 4. Execute start_client.bat nas outras máquinas
echo.
pause