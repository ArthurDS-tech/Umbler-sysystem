#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configuração Rápida - Sistema de Notificações Internas
Script interativo para configurar servidor e clientes facilmente.
"""

import os
import sys
import platform
import socket
import secrets
import string

def get_local_ip():
    """Obtém IP local da máquina"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def generate_secure_token():
    """Gera token seguro aleatório"""
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(20))

def update_server_token(token):
    """Atualiza token no arquivo do servidor"""
    try:
        with open('notification_server.py', 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Substituir token padrão
        old_line = 'self.auth_token = "empresa_token_2024"'
        new_line = f'self.auth_token = "{token}"'
        
        if old_line in content:
            content = content.replace(old_line, new_line)
            
            with open('notification_server.py', 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        else:
            print("⚠️ Linha do token não encontrada no servidor")
            return False
            
    except Exception as e:
        print(f"❌ Erro ao atualizar servidor: {e}")
        return False

def create_client_config(server_ip, port, token):
    """Cria arquivo de configuração do cliente"""
    config_content = f"""[DEFAULT]
# Configuração do Cliente de Notificações
# Gerado automaticamente pelo quick_setup.py

# IP da máquina onde está rodando o servidor
server_host = {server_ip}

# Porta do servidor
server_port = {port}

# Token de autenticação
auth_token = {token}

# Configurações de notificação
notification_title = Notificação Interna
notification_timeout = 10
"""
    
    try:
        with open('client_config.ini', 'w', encoding='utf-8') as f:
            f.write(config_content)
        return True
    except Exception as e:
        print(f"❌ Erro ao criar configuração do cliente: {e}")
        return False

def main():
    """Função principal de configuração"""
    print("=" * 60)
    print("⚙️ CONFIGURAÇÃO RÁPIDA - SISTEMA DE NOTIFICAÇÕES")
    print("=" * 60)
    print()
    
    # Verificar se arquivos necessários existem
    required_files = ['notification_server.py', 'notification_client.py']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print("❌ Arquivos necessários não encontrados:")
        for file in missing_files:
            print(f"   - {file}")
        print()
        print("Execute este script no diretório do sistema de notificações.")
        return False
    
    print("✅ Arquivos do sistema encontrados")
    print()
    
    # Detectar configuração atual
    local_ip = get_local_ip()
    system_name = platform.system()
    
    print(f"Sistema detectado: {system_name}")
    print(f"IP local detectado: {local_ip}")
    print()
    
    # Perguntar tipo de configuração
    print("Tipo de configuração:")
    print("1. Servidor (máquina que enviará notificações)")
    print("2. Cliente (máquina que receberá notificações)")
    print("3. Ambos (configurar servidor e cliente na mesma máquina)")
    print()
    
    while True:
        choice = input("Escolha uma opção (1-3): ").strip()
        if choice in ['1', '2', '3']:
            break
        print("⚠️ Opção inválida. Digite 1, 2 ou 3.")
    
    print()
    
    # Configurar baseado na escolha
    if choice in ['1', '3']:  # Servidor
        print("🖥️ CONFIGURAÇÃO DO SERVIDOR")
        print("-" * 30)
        
        # Token de segurança
        print("Configuração de segurança:")
        print("1. Gerar token aleatório (recomendado)")
        print("2. Usar token personalizado")
        
        token_choice = input("Escolha (1-2): ").strip()
        
        if token_choice == '1':
            token = f"empresa_{generate_secure_token()}"
            print(f"✅ Token gerado: {token}")
        else:
            while True:
                token = input("Digite o token personalizado (min. 10 caracteres): ").strip()
                if len(token) >= 10:
                    break
                print("⚠️ Token muito curto. Use pelo menos 10 caracteres.")
        
        # Atualizar servidor
        if update_server_token(token):
            print("✅ Servidor configurado com novo token")
        else:
            print("❌ Erro ao configurar servidor")
            return False
    
    if choice in ['2', '3']:  # Cliente
        print()
        print("💻 CONFIGURAÇÃO DO CLIENTE")
        print("-" * 30)
        
        if choice == '3':  # Ambos - usar configurações do servidor
            server_ip = local_ip
            server_port = 8765
            # Token já foi definido acima
        else:  # Só cliente
            server_ip = input(f"IP do servidor (Enter para {local_ip}): ").strip()
            if not server_ip:
                server_ip = local_ip
            
            server_port = input("Porta do servidor (Enter para 8765): ").strip()
            if not server_port:
                server_port = 8765
            else:
                try:
                    server_port = int(server_port)
                except ValueError:
                    print("⚠️ Porta inválida, usando 8765")
                    server_port = 8765
            
            token = input("Token de autenticação: ").strip()
            if not token:
                print("❌ Token é obrigatório para clientes")
                return False
        
        # Criar configuração do cliente
        if create_client_config(server_ip, server_port, token):
            print("✅ Cliente configurado")
        else:
            print("❌ Erro ao configurar cliente")
            return False
    
    print()
    print("=" * 60)
    print("🎉 CONFIGURAÇÃO CONCLUÍDA!")
    print("=" * 60)
    print()
    
    # Instruções finais
    if choice in ['1', '3']:
        print("📋 PRÓXIMOS PASSOS - SERVIDOR:")
        if system_name == "Windows":
            print("   Execute: start_server.bat")
        else:
            print("   Execute: ./start_server.sh")
        print(f"   O servidor estará disponível em: {local_ip}:8765")
        print(f"   Token configurado: {token}")
        print()
    
    if choice in ['2', '3']:
        print("📋 PRÓXIMOS PASSOS - CLIENTE:")
        if system_name == "Windows":
            print("   Execute: start_client_background.bat")
        else:
            print("   Execute: ./start_client_daemon.sh")
        print(f"   Conectará ao servidor: {server_ip}:{server_port}")
        print()
    
    print("📞 COMANDOS ÚTEIS:")
    print("   Testar sistema: python test_system.py")
    if system_name == "Linux":
        print("   Deploy em massa: ./deploy_clients.sh")
    print("   Ver logs: tail -f *_notifications.log")
    print()
    
    print("🔒 SEGURANÇA:")
    print("   - Use este token em TODAS as máquinas da rede")
    print("   - Mantenha o token em segredo")
    print("   - Execute apenas na rede interna")
    print()
    
    print("✅ Sistema pronto para uso!")
    
    return True

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Configuração cancelada pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro na configuração: {e}")
        sys.exit(1)