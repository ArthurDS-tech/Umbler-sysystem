#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Teste - Sistema de Notificações Internas
Testa conectividade, autenticação e funcionalidades básicas.
"""

import asyncio
import websockets
import json
import sys
import platform
from datetime import datetime

async def test_server_connection(host, port, token):
    """Testa conexão e autenticação com o servidor"""
    server_url = f"ws://{host}:{port}"
    
    print(f"🔗 Testando conexão com {server_url}...")
    
    try:
        async with websockets.connect(server_url, ping_interval=30) as websocket:
            print("✅ Conexão WebSocket estabelecida")
            
            # Testar autenticação
            auth_message = {
                'type': 'auth',
                'token': token,
                'client_info': {
                    'platform': platform.system(),
                    'hostname': platform.node(),
                    'timestamp': datetime.now().isoformat()
                }
            }
            
            print("🔐 Testando autenticação...")
            await websocket.send(json.dumps(auth_message))
            
            # Aguardar resposta
            response = await asyncio.wait_for(websocket.recv(), timeout=10)
            data = json.loads(response)
            
            if data.get('type') == 'auth_response':
                if data.get('status') == 'success':
                    print("✅ Autenticação bem-sucedida")
                    
                    # Testar ping
                    print("📡 Testando ping...")
                    ping_message = {'type': 'ping'}
                    await websocket.send(json.dumps(ping_message))
                    
                    pong_response = await asyncio.wait_for(websocket.recv(), timeout=5)
                    pong_data = json.loads(pong_response)
                    
                    if pong_data.get('type') == 'pong':
                        print("✅ Ping/Pong funcionando")
                        return True
                    else:
                        print("❌ Ping/Pong falhou")
                        return False
                else:
                    print(f"❌ Autenticação falhou: {data.get('message')}")
                    return False
            else:
                print("❌ Resposta de autenticação inválida")
                return False
                
    except websockets.exceptions.ConnectionRefused:
        print("❌ Conexão recusada - Servidor pode estar offline")
        return False
    except asyncio.TimeoutError:
        print("❌ Timeout na comunicação")
        return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def test_notification_system():
    """Testa sistema de notificações local"""
    print("📱 Testando sistema de notificações...")
    
    try:
        # Importar cliente para usar função de notificação
        sys.path.append('.')
        from notification_client import NotificationClient
        
        client = NotificationClient()
        success = client.show_notification(
            "Teste do Sistema",
            "Esta é uma notificação de teste do sistema interno. Se você está vendo isso, o sistema está funcionando corretamente!"
        )
        
        if success:
            print("✅ Sistema de notificação funcionando")
            return True
        else:
            print("❌ Sistema de notificação não funcionou")
            return False
            
    except ImportError as e:
        print(f"❌ Erro ao importar módulos: {e}")
        return False
    except Exception as e:
        print(f"❌ Erro no teste de notificação: {e}")
        return False

def main():
    """Função principal de teste"""
    print("=" * 60)
    print("🧪 TESTE DO SISTEMA DE NOTIFICAÇÕES INTERNAS")
    print("=" * 60)
    print()
    
    # Configurações de teste (altere conforme necessário)
    server_host = input("Digite o IP do servidor (Enter para localhost): ").strip()
    if not server_host:
        server_host = "127.0.0.1"
    
    server_port = 8765
    auth_token = input("Digite o token de autenticação (Enter para padrão): ").strip()
    if not auth_token:
        auth_token = "empresa_token_2024"
    
    print()
    print(f"Configurações de teste:")
    print(f"  Servidor: {server_host}:{server_port}")
    print(f"  Token: {auth_token[:4]}***")
    print(f"  Sistema: {platform.system()} {platform.release()}")
    print()
    
    # Teste 1: Sistema de notificação local
    print("📋 TESTE 1: Sistema de Notificação Local")
    print("-" * 40)
    notification_ok = test_notification_system()
    print()
    
    # Teste 2: Conexão com servidor
    print("📋 TESTE 2: Conexão com Servidor")
    print("-" * 40)
    server_ok = asyncio.run(test_server_connection(server_host, server_port, auth_token))
    print()
    
    # Resumo dos testes
    print("=" * 60)
    print("📊 RESUMO DOS TESTES")
    print("=" * 60)
    print(f"Notificação Local: {'✅ OK' if notification_ok else '❌ FALHA'}")
    print(f"Conexão Servidor:  {'✅ OK' if server_ok else '❌ FALHA'}")
    print()
    
    if notification_ok and server_ok:
        print("🎉 TODOS OS TESTES PASSARAM!")
        print("Sistema está funcionando corretamente.")
    elif notification_ok:
        print("⚠️ Notificações OK, mas servidor não conectou")
        print("Verifique se o servidor está rodando e configurações de rede.")
    elif server_ok:
        print("⚠️ Servidor OK, mas notificações falharam")
        print("Verifique instalação de dependências de notificação.")
    else:
        print("❌ MÚLTIPLAS FALHAS DETECTADAS")
        print("Verifique instalação e configurações.")
    
    print()
    print("Para mais informações, consulte os logs:")
    print("  - server_notifications.log")
    print("  - client_notifications.log")

if __name__ == "__main__":
    main()