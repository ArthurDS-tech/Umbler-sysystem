#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Notificações Internas - Cliente
Roda em segundo plano e exibe notificações recebidas do servidor.

Autor: Sistema de TI
Versão: 1.0
"""

import asyncio
import websockets
import json
import logging
import sys
import os
import signal
import configparser
from datetime import datetime
import time
import platform

# Importações condicionais para notificações
notification_available = False
toast_available = False

try:
    from plyer import notification as plyer_notification
    notification_available = True
except ImportError:
    plyer_notification = None

# Windows específico
if platform.system() == "Windows":
    try:
        from win10toast import ToastNotifier
        toast_available = True
    except ImportError:
        ToastNotifier = None

# Linux específico  
if platform.system() == "Linux":
    import subprocess

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('client_notifications.log', encoding='utf-8'),
        logging.StreamHandler() if '--console' in sys.argv else logging.NullHandler()
    ]
)

class NotificationClient:
    def __init__(self):
        self.websocket = None
        self.config = self.load_config()
        self.running = True
        self.reconnect_delay = 5
        self.max_reconnect_delay = 60
        self.notification_title = "Notificação Interna"
        self.notification_timeout = 10
        
        # Configurar handlers de sinal
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # Verificar disponibilidade de notificações
        self.check_notification_support()

    def load_config(self):
        """Carrega configuração do arquivo ou usa padrões"""
        config = {
            'server_host': '192.168.1.100',  # ALTERE PARA O IP DO SERVIDOR
            'server_port': 8765,
            'auth_token': 'empresa_token_2024'  # MESMO TOKEN DO SERVIDOR
        }
        
        # Tentar carregar do arquivo de configuração
        config_file = 'client_config.ini'
        if os.path.exists(config_file):
            try:
                parser = configparser.ConfigParser()
                parser.read(config_file, encoding='utf-8')
                
                if 'DEFAULT' in parser:
                    config.update({
                        'server_host': parser['DEFAULT'].get('server_host', config['server_host']),
                        'server_port': int(parser['DEFAULT'].get('server_port', config['server_port'])),
                        'auth_token': parser['DEFAULT'].get('auth_token', config['auth_token'])
                    })
                    logging.info(f"Configuração carregada de {config_file}")
            except Exception as e:
                logging.warning(f"Erro ao carregar config: {e}. Usando configuração padrão.")
        else:
            logging.info("Arquivo de configuração não encontrado. Usando configuração padrão.")
            
        return config

    def check_notification_support(self):
        """Verifica suporte a notificações no sistema"""
        system = platform.system()
        
        if system == "Windows":
            if toast_available:
                self.toaster = ToastNotifier()
                logging.info("Notificações Windows (win10toast) disponíveis")
            elif notification_available:
                logging.info("Notificações plyer disponíveis")
            else:
                logging.warning("Nenhum sistema de notificação disponível")
                
        elif system == "Linux":
            # Verificar se notify-send está disponível
            try:
                subprocess.run(['which', 'notify-send'], 
                             check=True, capture_output=True)
                logging.info("Notificações Linux (notify-send) disponíveis")
            except subprocess.CalledProcessError:
                if notification_available:
                    logging.info("Notificações plyer disponíveis")
                else:
                    logging.warning("Nenhum sistema de notificação disponível")

    def signal_handler(self, signum, frame):
        """Handler para sinais do sistema"""
        logging.info(f"Sinal recebido: {signum}. Encerrando cliente...")
        self.running = False

    async def authenticate(self):
        """Autentica com o servidor"""
        auth_message = {
            'type': 'auth',
            'token': self.config['auth_token'],
            'client_info': {
                'platform': platform.system(),
                'hostname': platform.node(),
                'timestamp': datetime.now().isoformat()
            }
        }
        
        try:
            await self.websocket.send(json.dumps(auth_message))
            
            # Aguardar resposta de autenticação
            response = await asyncio.wait_for(self.websocket.recv(), timeout=10)
            data = json.loads(response)
            
            if data.get('type') == 'auth_response':
                if data.get('status') == 'success':
                    logging.info("Autenticação realizada com sucesso")
                    return True
                else:
                    logging.error(f"Falha na autenticação: {data.get('message')}")
                    return False
            else:
                logging.error("Resposta de autenticação inválida")
                return False
                
        except asyncio.TimeoutError:
            logging.error("Timeout na autenticação")
            return False
        except Exception as e:
            logging.error(f"Erro na autenticação: {e}")
            return False

    def show_notification(self, title, message, timeout=None):
        """Exibe notificação usando o melhor método disponível"""
        if timeout is None:
            timeout = self.notification_timeout
            
        system = platform.system()
        notification_shown = False
        
        # Truncar mensagem se muito longa
        if len(message) > 200:
            message = message[:197] + "..."
        
        try:
            if system == "Windows":
                # Tentar win10toast primeiro
                if toast_available and hasattr(self, 'toaster'):
                    try:
                        self.toaster.show_toast(
                            title,
                            message,
                            duration=timeout,
                            icon_path=None,
                            threaded=True
                        )
                        notification_shown = True
                        logging.info("Notificação exibida via win10toast")
                    except Exception as e:
                        logging.warning(f"Erro com win10toast: {e}")
                
                # Fallback para plyer
                if not notification_shown and notification_available:
                    try:
                        plyer_notification.notify(
                            title=title,
                            message=message,
                            timeout=timeout,
                            app_name="Notificações Internas"
                        )
                        notification_shown = True
                        logging.info("Notificação exibida via plyer")
                    except Exception as e:
                        logging.warning(f"Erro com plyer: {e}")
                        
            elif system == "Linux":
                # Tentar notify-send primeiro
                try:
                    # Verificar se temos DISPLAY
                    if 'DISPLAY' in os.environ:
                        result = subprocess.run([
                            'notify-send',
                            '-t', str(timeout * 1000),  # notify-send usa milissegundos
                            '-u', 'normal',
                            title,
                            message
                        ], capture_output=True, text=True, timeout=5)
                        
                        if result.returncode == 0:
                            notification_shown = True
                            logging.info("Notificação exibida via notify-send")
                        else:
                            logging.warning(f"notify-send falhou: {result.stderr}")
                    else:
                        logging.warning("DISPLAY não configurado, tentando plyer")
                except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as e:
                    logging.warning(f"Erro com notify-send: {e}")
                
                # Fallback para plyer
                if not notification_shown and notification_available:
                    try:
                        plyer_notification.notify(
                            title=title,
                            message=message,
                            timeout=timeout,
                            app_name="Notificações Internas"
                        )
                        notification_shown = True
                        logging.info("Notificação exibida via plyer")
                    except Exception as e:
                        logging.warning(f"Erro com plyer: {e}")
            
            # Fallback universal - console
            if not notification_shown:
                print(f"\n{'='*50}")
                print(f"🔔 {title}")
                print(f"{'='*50}")
                print(f"{message}")
                print(f"{'='*50}")
                print(f"Horário: {datetime.now().strftime('%H:%M:%S')}")
                print(f"{'='*50}\n")
                logging.info("Notificação exibida no console (fallback)")
                notification_shown = True
                
        except Exception as e:
            logging.error(f"Erro ao exibir notificação: {e}")
            # Último fallback
            print(f"\n[NOTIFICAÇÃO] {title}: {message}\n")

        return notification_shown

    async def handle_message(self, message):
        """Processa mensagem recebida do servidor"""
        try:
            data = json.loads(message)
            message_type = data.get('type')
            
            if message_type == 'notification':
                # Notificação normal
                msg_content = data.get('message', '')
                timestamp = data.get('timestamp', '')
                sender = data.get('sender', 'Servidor')
                
                # Exibir notificação
                title = f"{self.notification_title} - {sender}"
                self.show_notification(title, msg_content)
                
                logging.info(f"Notificação recebida: {msg_content}")
                
            elif message_type == 'server_shutdown':
                # Servidor sendo desligado
                shutdown_msg = data.get('message', 'Servidor desconectado')
                self.show_notification("Sistema", shutdown_msg, timeout=5)
                logging.info("Servidor sendo desligado")
                
            elif message_type == 'ping':
                # Responder ping
                await self.websocket.send(json.dumps({'type': 'pong'}))
                
            else:
                logging.warning(f"Tipo de mensagem desconhecido: {message_type}")
                
        except json.JSONDecodeError as e:
            logging.error(f"Erro ao decodificar mensagem: {e}")
        except Exception as e:
            logging.error(f"Erro ao processar mensagem: {e}")

    async def keep_alive(self):
        """Mantém conexão viva enviando pings periódicos"""
        while self.running and self.websocket:
            try:
                await asyncio.sleep(30)  # Ping a cada 30 segundos
                if self.websocket and not self.websocket.closed:
                    ping_message = {'type': 'ping'}
                    await self.websocket.send(json.dumps(ping_message))
            except Exception as e:
                logging.warning(f"Erro no keep-alive: {e}")
                break

    async def connect_and_listen(self):
        """Conecta ao servidor e escuta mensagens"""
        server_url = f"ws://{self.config['server_host']}:{self.config['server_port']}"
        
        try:
            logging.info(f"Conectando ao servidor: {server_url}")
            
            async with websockets.connect(
                server_url,
                ping_interval=30,
                ping_timeout=10,
                close_timeout=10
            ) as websocket:
                self.websocket = websocket
                
                # Autenticar
                if not await self.authenticate():
                    logging.error("Falha na autenticação. Verifique o token.")
                    return False
                
                # Iniciar keep-alive
                keep_alive_task = asyncio.create_task(self.keep_alive())
                
                try:
                    # Escutar mensagens
                    async for message in websocket:
                        await self.handle_message(message)
                        
                except websockets.exceptions.ConnectionClosed:
                    logging.info("Conexão fechada pelo servidor")
                except Exception as e:
                    logging.error(f"Erro na conexão: {e}")
                finally:
                    keep_alive_task.cancel()
                    
        except websockets.exceptions.InvalidURI:
            logging.error(f"URL inválida: {server_url}")
            return False
        except websockets.exceptions.ConnectionRefused:
            logging.error(f"Conexão recusada. Servidor pode estar offline: {server_url}")
            return False
        except OSError as e:
            logging.error(f"Erro de rede: {e}")
            return False
        except Exception as e:
            logging.error(f"Erro inesperado: {e}")
            return False
            
        return True

    async def run_with_reconnect(self):
        """Executa cliente com reconexão automática"""
        current_delay = self.reconnect_delay
        
        while self.running:
            try:
                success = await self.connect_and_listen()
                
                if success:
                    # Reset delay se conexão foi bem-sucedida
                    current_delay = self.reconnect_delay
                else:
                    # Aumentar delay progressivamente
                    current_delay = min(current_delay * 2, self.max_reconnect_delay)
                
            except Exception as e:
                logging.error(f"Erro na execução: {e}")
                current_delay = min(current_delay * 2, self.max_reconnect_delay)
            
            if self.running:
                logging.info(f"Tentando reconectar em {current_delay} segundos...")
                await asyncio.sleep(current_delay)

    def run(self):
        """Executa o cliente"""
        logging.info("Iniciando cliente de notificações...")
        logging.info(f"Servidor: {self.config['server_host']}:{self.config['server_port']}")
        logging.info(f"Sistema: {platform.system()} {platform.release()}")
        
        try:
            # Executar loop principal
            asyncio.run(self.run_with_reconnect())
        except KeyboardInterrupt:
            logging.info("Cliente interrompido pelo usuário")
        except Exception as e:
            logging.error(f"Erro fatal: {e}")
        finally:
            logging.info("Cliente encerrado")

    def stop(self):
        """Para o cliente graciosamente"""
        self.running = False
        if self.websocket:
            asyncio.create_task(self.websocket.close())

def create_config_file():
    """Cria arquivo de configuração exemplo"""
    config_content = """[DEFAULT]
# Configuração do Cliente de Notificações
# Altere os valores abaixo conforme sua rede

# IP da máquina onde está rodando o servidor
server_host = 192.168.1.100

# Porta do servidor (deve ser a mesma configurada no servidor)
server_port = 8765

# Token de autenticação (deve ser o mesmo do servidor)
auth_token = empresa_token_2024

# Configurações de notificação (opcional)
notification_title = Notificação Interna
notification_timeout = 10
"""
    
    try:
        with open('client_config.ini', 'w', encoding='utf-8') as f:
            f.write(config_content)
        print("Arquivo client_config.ini criado. Configure os valores antes de executar.")
        return True
    except Exception as e:
        print(f"Erro ao criar arquivo de configuração: {e}")
        return False

def install_dependencies():
    """Instala dependências necessárias"""
    import subprocess
    import sys
    
    dependencies = ['websockets>=11.0.3', 'plyer>=2.1.0']
    
    if platform.system() == "Windows":
        dependencies.append('win10toast>=0.9')
    
    for dep in dependencies:
        try:
            print(f"Instalando {dep}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', dep])
            print(f"✅ {dep} instalado com sucesso")
        except subprocess.CalledProcessError as e:
            print(f"❌ Erro ao instalar {dep}: {e}")
            return False
    
    return True

def main():
    """Função principal"""
    # Verificar argumentos de linha de comando
    if len(sys.argv) > 1:
        if '--help' in sys.argv or '-h' in sys.argv:
            print("""
Sistema de Notificações Internas - Cliente

Uso:
    python notification_client.py [opções]

Opções:
    --help, -h          Mostra esta ajuda
    --console           Mostra logs no console
    --create-config     Cria arquivo de configuração exemplo
    --install-deps      Instala dependências necessárias
    --test-notification Testa sistema de notificação

Arquivos:
    client_config.ini   Arquivo de configuração (opcional)
    client_notifications.log  Log de atividades

Exemplo de configuração:
    1. Execute: python notification_client.py --create-config
    2. Edite client_config.ini com IP do servidor
    3. Execute: python notification_client.py
            """)
            return
            
        if '--create-config' in sys.argv:
            if create_config_file():
                print("Arquivo de configuração criado com sucesso!")
                print("Edite client_config.ini antes de executar o cliente.")
            return
            
        if '--install-deps' in sys.argv:
            print("Instalando dependências...")
            if install_dependencies():
                print("✅ Todas as dependências foram instaladas!")
            else:
                print("❌ Erro na instalação de dependências")
            return
            
        if '--test-notification' in sys.argv:
            print("Testando sistema de notificação...")
            client = NotificationClient()
            success = client.show_notification(
                "Teste", 
                "Esta é uma notificação de teste do sistema interno."
            )
            if success:
                print("✅ Teste de notificação realizado!")
            else:
                print("❌ Erro no teste de notificação")
            return

    # Verificar se arquivo de configuração existe
    if not os.path.exists('client_config.ini'):
        print("⚠️ Arquivo client_config.ini não encontrado.")
        print("Criando arquivo de configuração exemplo...")
        if create_config_file():
            print("✅ Arquivo criado! Edite-o com as configurações do seu servidor.")
            print("Execute novamente após configurar.")
        return

    # Executar cliente
    print("=" * 60)
    print("🔔 SISTEMA DE NOTIFICAÇÕES INTERNAS - CLIENTE")
    print("=" * 60)
    print("Iniciando cliente...")
    print("Pressione Ctrl+C para parar")
    print("=" * 60)
    
    client = NotificationClient()
    client.run()

if __name__ == "__main__":
    main()