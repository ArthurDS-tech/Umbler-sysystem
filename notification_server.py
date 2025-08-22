#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Notificações Internas - Servidor/Admin
Permite enviar notificações em tempo real para todos os computadores da rede interna.

Autor: Sistema de TI
Versão: 1.0
"""

import asyncio
import websockets
import json
import logging
import tkinter as tk
from tkinter import ttk, scrolledtext, messagebox
from datetime import datetime
import threading
import socket

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server_notifications.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

class NotificationServer:
    def __init__(self):
        self.clients = set()
        self.authenticated_clients = set()
        self.server = None
        self.loop = None
        self.auth_token = "empresa_token_2024"  # ALTERE ESTE TOKEN!
        
        # GUI components
        self.root = None
        self.message_entry = None
        self.clients_listbox = None
        self.log_text = None
        
        # Statistics
        self.total_messages_sent = 0
        self.server_start_time = datetime.now()
        
    def get_local_ip(self):
        """Obtém o IP local da máquina"""
        try:
            # Conecta a um endereço externo para descobrir IP local
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    async def authenticate_client(self, websocket, message):
        """Autentica cliente usando token"""
        try:
            data = json.loads(message)
            if data.get('type') == 'auth' and data.get('token') == self.auth_token:
                self.authenticated_clients.add(websocket)
                client_ip = websocket.remote_address[0]
                
                # Resposta de sucesso
                auth_response = {
                    'type': 'auth_response',
                    'status': 'success',
                    'message': 'Autenticação realizada com sucesso'
                }
                await websocket.send(json.dumps(auth_response))
                
                logging.info(f"Cliente autenticado: {client_ip}")
                self.update_gui_log(f"✅ Cliente conectado e autenticado: {client_ip}")
                self.update_clients_list()
                return True
            else:
                # Resposta de falha
                auth_response = {
                    'type': 'auth_response', 
                    'status': 'failed',
                    'message': 'Token de autenticação inválido'
                }
                await websocket.send(json.dumps(auth_response))
                logging.warning(f"Tentativa de autenticação falhada: {websocket.remote_address[0]}")
                return False
        except json.JSONDecodeError:
            logging.error("Erro ao decodificar mensagem de autenticação")
            return False

    async def handle_client(self, websocket, path):
        """Gerencia conexão de cliente"""
        client_ip = websocket.remote_address[0]
        self.clients.add(websocket)
        logging.info(f"Nova conexão: {client_ip}")
        
        try:
            async for message in websocket:
                # Primeira mensagem deve ser autenticação
                if websocket not in self.authenticated_clients:
                    await self.authenticate_client(websocket, message)
                else:
                    # Cliente já autenticado, processar outras mensagens
                    try:
                        data = json.loads(message)
                        if data.get('type') == 'ping':
                            # Responder a ping para manter conexão viva
                            await websocket.send(json.dumps({'type': 'pong'}))
                    except json.JSONDecodeError:
                        logging.warning(f"Mensagem inválida de {client_ip}: {message}")
                        
        except websockets.exceptions.ConnectionClosed:
            logging.info(f"Cliente desconectado: {client_ip}")
        except Exception as e:
            logging.error(f"Erro com cliente {client_ip}: {e}")
        finally:
            self.clients.discard(websocket)
            self.authenticated_clients.discard(websocket)
            self.update_clients_list()
            self.update_gui_log(f"❌ Cliente desconectado: {client_ip}")

    async def send_notification(self, message):
        """Envia notificação para todos os clientes autenticados"""
        if not self.authenticated_clients:
            logging.warning("Nenhum cliente autenticado conectado")
            self.update_gui_log("⚠️ Nenhum cliente conectado para receber a mensagem")
            return False

        notification = {
            'type': 'notification',
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'sender': 'Administração'
        }
        
        notification_json = json.dumps(notification, ensure_ascii=False)
        disconnected_clients = set()
        successful_sends = 0
        
        for client in self.authenticated_clients.copy():
            try:
                await client.send(notification_json)
                successful_sends += 1
            except websockets.exceptions.ConnectionClosed:
                disconnected_clients.add(client)
            except Exception as e:
                logging.error(f"Erro ao enviar para cliente: {e}")
                disconnected_clients.add(client)
        
        # Remove clientes desconectados
        for client in disconnected_clients:
            self.clients.discard(client)
            self.authenticated_clients.discard(client)
        
        self.total_messages_sent += 1
        self.update_clients_list()
        
        logging.info(f"Notificação enviada para {successful_sends} clientes: {message}")
        self.update_gui_log(f"📤 Enviado para {successful_sends} clientes: {message}")
        
        return successful_sends > 0

    def send_notification_sync(self, message):
        """Wrapper síncrono para enviar notificação"""
        if self.loop and self.loop.is_running():
            future = asyncio.run_coroutine_threadsafe(
                self.send_notification(message), self.loop
            )
            return future.result(timeout=5)
        return False

    def setup_gui(self):
        """Configura a interface gráfica"""
        self.root = tk.Tk()
        self.root.title("Sistema de Notificações Internas - Servidor")
        self.root.geometry("800x600")
        self.root.configure(bg='#f0f0f0')
        
        # Estilo
        style = ttk.Style()
        style.theme_use('clam')
        
        # Frame principal
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Configurar grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(2, weight=1)
        
        # Título
        title_label = ttk.Label(main_frame, text="🔔 Sistema de Notificações Internas", 
                               font=('Arial', 16, 'bold'))
        title_label.grid(row=0, column=0, columnspan=2, pady=(0, 20))
        
        # Info do servidor
        server_ip = self.get_local_ip()
        info_text = f"Servidor ativo em: {server_ip}:8765 | Token: {self.auth_token[:4]}***"
        info_label = ttk.Label(main_frame, text=info_text, font=('Arial', 10))
        info_label.grid(row=1, column=0, columnspan=2, pady=(0, 10))
        
        # Frame para clientes conectados
        clients_frame = ttk.LabelFrame(main_frame, text="Clientes Conectados", padding="5")
        clients_frame.grid(row=2, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(0, 10))
        
        # Lista de clientes
        self.clients_listbox = tk.Listbox(clients_frame, height=8)
        self.clients_listbox.pack(fill=tk.BOTH, expand=True)
        
        # Frame para envio de mensagens
        message_frame = ttk.LabelFrame(main_frame, text="Enviar Notificação", padding="5")
        message_frame.grid(row=2, column=1, sticky=(tk.W, tk.E, tk.N, tk.S))
        message_frame.columnconfigure(0, weight=1)
        message_frame.rowconfigure(0, weight=1)
        
        # Campo de mensagem
        self.message_entry = scrolledtext.ScrolledText(message_frame, height=6, wrap=tk.WORD)
        self.message_entry.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        self.message_entry.insert(tk.END, "Digite sua mensagem aqui...")
        self.message_entry.bind('<FocusIn>', self.clear_placeholder)
        self.message_entry.bind('<Control-Return>', self.send_message_event)
        
        # Botão enviar
        send_button = ttk.Button(message_frame, text="📤 Enviar Notificação", 
                                command=self.send_message_gui)
        send_button.grid(row=1, column=0, pady=5)
        
        # Frame para log
        log_frame = ttk.LabelFrame(main_frame, text="Log de Atividades", padding="5")
        log_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(10, 0))
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        
        # Log text
        self.log_text = scrolledtext.ScrolledText(log_frame, height=8, state=tk.DISABLED)
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Status bar
        status_frame = ttk.Frame(main_frame)
        status_frame.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(5, 0))
        
        self.status_label = ttk.Label(status_frame, text="Servidor iniciado")
        self.status_label.pack(side=tk.LEFT)
        
        # Atalhos de teclado
        self.root.bind('<Alt-F4>', lambda e: self.root.quit())
        
        # Atualizar lista de clientes inicial
        self.update_clients_list()
        self.update_gui_log("🚀 Servidor de notificações iniciado")

    def clear_placeholder(self, event):
        """Remove placeholder text"""
        if self.message_entry.get(1.0, tk.END).strip() == "Digite sua mensagem aqui...":
            self.message_entry.delete(1.0, tk.END)

    def send_message_event(self, event):
        """Handler para Ctrl+Enter"""
        self.send_message_gui()

    def send_message_gui(self):
        """Envia mensagem através da GUI"""
        message = self.message_entry.get(1.0, tk.END).strip()
        
        if not message or message == "Digite sua mensagem aqui...":
            messagebox.showwarning("Aviso", "Por favor, digite uma mensagem.")
            return
            
        if len(message) > 500:
            messagebox.showwarning("Aviso", "Mensagem muito longa. Máximo 500 caracteres.")
            return
        
        # Enviar mensagem
        success = self.send_notification_sync(message)
        
        if success:
            self.message_entry.delete(1.0, tk.END)
            self.message_entry.insert(tk.END, "Digite sua mensagem aqui...")
            messagebox.showinfo("Sucesso", "Notificação enviada com sucesso!")
        else:
            messagebox.showerror("Erro", "Falha ao enviar notificação. Verifique se há clientes conectados.")

    def update_clients_list(self):
        """Atualiza lista de clientes na GUI"""
        if self.clients_listbox:
            self.clients_listbox.delete(0, tk.END)
            
            if not self.authenticated_clients:
                self.clients_listbox.insert(tk.END, "Nenhum cliente conectado")
            else:
                for i, client in enumerate(self.authenticated_clients, 1):
                    try:
                        client_ip = client.remote_address[0]
                        status = "🟢 Conectado"
                        self.clients_listbox.insert(tk.END, f"{i}. {client_ip} - {status}")
                    except Exception:
                        self.clients_listbox.insert(tk.END, f"{i}. Cliente desconhecido - 🔴 Erro")
            
            # Atualizar status
            count = len(self.authenticated_clients)
            if hasattr(self, 'status_label'):
                uptime = datetime.now() - self.server_start_time
                uptime_str = str(uptime).split('.')[0]  # Remove microseconds
                status_text = f"Clientes: {count} | Mensagens enviadas: {self.total_messages_sent} | Uptime: {uptime_str}"
                self.status_label.config(text=status_text)

    def update_gui_log(self, message):
        """Atualiza log na GUI"""
        if self.log_text:
            timestamp = datetime.now().strftime("%H:%M:%S")
            log_message = f"[{timestamp}] {message}\n"
            
            self.log_text.config(state=tk.NORMAL)
            self.log_text.insert(tk.END, log_message)
            self.log_text.see(tk.END)
            self.log_text.config(state=tk.DISABLED)

    async def start_server(self, host="0.0.0.0", port=8765):
        """Inicia o servidor WebSocket"""
        self.server = await websockets.serve(
            self.handle_client, 
            host, 
            port,
            ping_interval=30,
            ping_timeout=10
        )
        
        local_ip = self.get_local_ip()
        logging.info(f"Servidor iniciado em {host}:{port}")
        logging.info(f"IP local: {local_ip}:{port}")
        logging.info(f"Token de autenticação: {self.auth_token}")
        
        if self.root:
            self.update_gui_log(f"🌐 Servidor ativo em {local_ip}:{port}")

    def run_server_thread(self):
        """Executa servidor em thread separada"""
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)
        
        try:
            self.loop.run_until_complete(self.start_server())
            self.loop.run_forever()
        except Exception as e:
            logging.error(f"Erro no servidor: {e}")
            if self.root:
                self.update_gui_log(f"❌ Erro no servidor: {e}")

    def start_gui(self):
        """Inicia interface gráfica"""
        self.setup_gui()
        
        # Iniciar servidor em thread separada
        server_thread = threading.Thread(target=self.run_server_thread, daemon=True)
        server_thread.start()
        
        # Atualizar lista de clientes periodicamente
        self.schedule_updates()
        
        # Iniciar GUI
        try:
            self.root.mainloop()
        except KeyboardInterrupt:
            logging.info("Servidor interrompido pelo usuário")
        finally:
            self.shutdown()

    def schedule_updates(self):
        """Agenda atualizações periódicas da GUI"""
        if self.root:
            self.update_clients_list()
            self.root.after(5000, self.schedule_updates)  # Atualizar a cada 5 segundos

    def shutdown(self):
        """Encerra servidor graciosamente"""
        logging.info("Encerrando servidor...")
        
        if self.loop and self.loop.is_running():
            # Enviar mensagem de desconexão para clientes
            asyncio.run_coroutine_threadsafe(
                self.send_shutdown_notification(), self.loop
            )
            
            # Parar servidor
            if self.server:
                self.server.close()
                asyncio.run_coroutine_threadsafe(
                    self.server.wait_closed(), self.loop
                )
            
            self.loop.call_soon_threadsafe(self.loop.stop)

    async def send_shutdown_notification(self):
        """Notifica clientes sobre desligamento do servidor"""
        shutdown_message = {
            'type': 'server_shutdown',
            'message': 'Servidor sendo desligado. Reconectando automaticamente...'
        }
        
        for client in self.authenticated_clients.copy():
            try:
                await client.send(json.dumps(shutdown_message))
            except Exception:
                pass

def main():
    """Função principal"""
    print("=" * 60)
    print("🔔 SISTEMA DE NOTIFICAÇÕES INTERNAS - SERVIDOR")
    print("=" * 60)
    print("Iniciando servidor de notificações...")
    print("Pressione Ctrl+C para parar o servidor")
    print("=" * 60)
    
    server = NotificationServer()
    
    try:
        server.start_gui()
    except KeyboardInterrupt:
        logging.info("Servidor interrompido pelo usuário")
    except Exception as e:
        logging.error(f"Erro fatal: {e}")
        print(f"Erro fatal: {e}")
    finally:
        logging.info("Servidor encerrado")

if __name__ == "__main__":
    main()