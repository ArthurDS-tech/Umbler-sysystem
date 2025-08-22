#!/bin/bash
# Script de Deploy em Massa - Sistema de Notificações Internas
# Instala o cliente em múltiplas máquinas da rede

# Configurações
SERVER_IP="192.168.1.100"  # IP do servidor de notificações
AUTH_TOKEN="empresa_token_2024"  # Token de autenticação
SSH_USER="admin"  # Usuário SSH para conexão

# Lista de máquinas da rede (IPs)
MACHINES=(
    "192.168.1.101"
    "192.168.1.102"
    "192.168.1.103"
    "192.168.1.104"
    "192.168.1.105"
    # Adicione mais IPs conforme necessário
)

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Função para verificar conectividade SSH
check_ssh_connection() {
    local ip=$1
    ssh -o ConnectTimeout=5 -o BatchMode=yes "$SSH_USER@$ip" exit 2>/dev/null
    return $?
}

# Função para instalar em uma máquina
install_on_machine() {
    local ip=$1
    log_info "Instalando em $ip..."
    
    # Verificar conectividade SSH
    if ! check_ssh_connection "$ip"; then
        log_error "Não foi possível conectar via SSH em $ip"
        return 1
    fi
    
    # Criar diretório remoto
    ssh "$SSH_USER@$ip" "mkdir -p ~/notification-system" 2>/dev/null
    
    # Copiar arquivos necessários
    local files=(
        "notification_client.py"
        "requirements.txt"
        "start_client_daemon.sh"
        "stop_client_daemon.sh"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            if scp "$file" "$SSH_USER@$ip:~/notification-system/"; then
                log_success "Arquivo $file copiado para $ip"
            else
                log_error "Falha ao copiar $file para $ip"
                return 1
            fi
        else
            log_warning "Arquivo $file não encontrado localmente"
        fi
    done
    
    # Criar arquivo de configuração personalizado
    cat > temp_config.ini << EOF
[DEFAULT]
server_host = $SERVER_IP
server_port = 8765
auth_token = $AUTH_TOKEN
notification_title = Notificação Interna
notification_timeout = 10
EOF
    
    if scp temp_config.ini "$SSH_USER@$ip:~/notification-system/client_config.ini"; then
        log_success "Configuração personalizada criada em $ip"
        rm temp_config.ini
    else
        log_error "Falha ao criar configuração em $ip"
        rm temp_config.ini
        return 1
    fi
    
    # Executar instalação remota
    ssh "$SSH_USER@$ip" << 'REMOTE_SCRIPT'
cd ~/notification-system

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "Instalando Python3..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y python3 python3-pip
    elif command -v yum &> /dev/null; then
        sudo yum install -y python3 python3-pip
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y python3 python3-pip
    fi
fi

# Instalar dependências
echo "Instalando dependências..."
pip3 install -r requirements.txt || {
    pip3 install websockets>=11.0.3
    pip3 install plyer>=2.1.0
}

# Instalar notify-send
if command -v apt-get &> /dev/null; then
    sudo apt-get install -y libnotify-bin
elif command -v yum &> /dev/null; then
    sudo yum install -y libnotify
elif command -v dnf &> /dev/null; then
    sudo dnf install -y libnotify
fi

# Tornar scripts executáveis
chmod +x *.sh

# Testar notificação
python3 notification_client.py --test-notification

echo "Instalação concluída!"
REMOTE_SCRIPT
    
    if [ $? -eq 0 ]; then
        log_success "Instalação concluída em $ip"
        return 0
    else
        log_error "Falha na instalação em $ip"
        return 1
    fi
}

# Função para iniciar cliente em uma máquina
start_client_on_machine() {
    local ip=$1
    log_info "Iniciando cliente em $ip..."
    
    ssh "$SSH_USER@$ip" "cd ~/notification-system && ./start_client_daemon.sh" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Cliente iniciado em $ip"
    else
        log_error "Falha ao iniciar cliente em $ip"
    fi
}

# Função para parar cliente em uma máquina
stop_client_on_machine() {
    local ip=$1
    log_info "Parando cliente em $ip..."
    
    ssh "$SSH_USER@$ip" "cd ~/notification-system && ./stop_client_daemon.sh" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Cliente parado em $ip"
    else
        log_warning "Cliente pode não estar rodando em $ip"
    fi
}

# Função para verificar status dos clientes
check_clients_status() {
    log_info "Verificando status dos clientes..."
    echo
    
    for ip in "${MACHINES[@]}"; do
        if check_ssh_connection "$ip"; then
            # Verificar se processo está rodando
            if ssh "$SSH_USER@$ip" "pgrep -f notification_client.py" >/dev/null 2>&1; then
                echo -e "$ip: ${GREEN}🟢 RODANDO${NC}"
            else
                echo -e "$ip: ${RED}🔴 PARADO${NC}"
            fi
        else
            echo -e "$ip: ${YELLOW}⚠️ SEM CONEXÃO${NC}"
        fi
    done
}

# Menu principal
show_menu() {
    echo
    echo "========================================"
    echo " Deploy em Massa - Notificações Internas"
    echo "========================================"
    echo
    echo "Configurações atuais:"
    echo "  Servidor: $SERVER_IP:8765"
    echo "  Token: ${AUTH_TOKEN:0:4}***"
    echo "  Usuário SSH: $SSH_USER"
    echo "  Máquinas: ${#MACHINES[@]}"
    echo
    echo "Opções:"
    echo "  1) Instalar em todas as máquinas"
    echo "  2) Iniciar clientes em todas as máquinas"
    echo "  3) Parar clientes em todas as máquinas"
    echo "  4) Verificar status dos clientes"
    echo "  5) Instalar em máquina específica"
    echo "  6) Configurar máquinas (editar script)"
    echo "  0) Sair"
    echo
    read -p "Escolha uma opção: " choice
}

# Função principal
main() {
    # Verificar se estamos no diretório correto
    if [ ! -f "notification_client.py" ]; then
        log_error "Arquivo notification_client.py não encontrado!"
        log_error "Execute este script no diretório do sistema de notificações"
        exit 1
    fi
    
    # Verificar SSH
    if ! command -v ssh &> /dev/null; then
        log_error "SSH não encontrado! Instale openssh-client"
        exit 1
    fi
    
    while true; do
        show_menu
        
        case $choice in
            1)
                log_info "Iniciando instalação em massa..."
                success_count=0
                total_count=${#MACHINES[@]}
                
                for ip in "${MACHINES[@]}"; do
                    if install_on_machine "$ip"; then
                        ((success_count++))
                    fi
                    echo "----------------------------------------"
                done
                
                echo
                log_info "Instalação concluída: $success_count/$total_count máquinas"
                ;;
                
            2)
                log_info "Iniciando clientes em todas as máquinas..."
                for ip in "${MACHINES[@]}"; do
                    start_client_on_machine "$ip"
                done
                ;;
                
            3)
                log_info "Parando clientes em todas as máquinas..."
                for ip in "${MACHINES[@]}"; do
                    stop_client_on_machine "$ip"
                done
                ;;
                
            4)
                check_clients_status
                ;;
                
            5)
                echo
                read -p "Digite o IP da máquina: " target_ip
                install_on_machine "$target_ip"
                ;;
                
            6)
                log_info "Edite as variáveis no início deste script:"
                log_info "  - MACHINES: Lista de IPs"
                log_info "  - SERVER_IP: IP do servidor"
                log_info "  - AUTH_TOKEN: Token de autenticação"
                log_info "  - SSH_USER: Usuário SSH"
                ;;
                
            0)
                log_info "Saindo..."
                exit 0
                ;;
                
            *)
                log_warning "Opção inválida!"
                ;;
        esac
        
        echo
        read -p "Pressione Enter para continuar..."
    done
}

# Verificar argumentos de linha de comando
if [ "$1" = "--install-all" ]; then
    log_info "Instalação automática em todas as máquinas..."
    for ip in "${MACHINES[@]}"; do
        install_on_machine "$ip"
    done
    exit 0
elif [ "$1" = "--start-all" ]; then
    log_info "Iniciando clientes em todas as máquinas..."
    for ip in "${MACHINES[@]}"; do
        start_client_on_machine "$ip"
    done
    exit 0
elif [ "$1" = "--stop-all" ]; then
    log_info "Parando clientes em todas as máquinas..."
    for ip in "${MACHINES[@]}"; do
        stop_client_on_machine "$ip"
    done
    exit 0
elif [ "$1" = "--status" ]; then
    check_clients_status
    exit 0
elif [ "$1" = "--help" ]; then
    echo "Deploy em Massa - Sistema de Notificações"
    echo
    echo "Uso:"
    echo "  $0                 Menu interativo"
    echo "  $0 --install-all   Instalar em todas as máquinas"
    echo "  $0 --start-all     Iniciar clientes em todas as máquinas"
    echo "  $0 --stop-all      Parar clientes em todas as máquinas"
    echo "  $0 --status        Verificar status dos clientes"
    echo "  $0 --help          Mostrar esta ajuda"
    echo
    echo "Configuração:"
    echo "  Edite as variáveis no início do script antes de usar"
    exit 0
fi

# Executar menu principal
main