# 🚀 Guia de Deploy - Sistema de Notificações Web

## 📋 Visão Geral

Esta é a versão **web moderna** do sistema de notificações, construída com:
- **Next.js 14** - Framework React
- **Socket.IO** - Comunicação em tempo real
- **Vercel KV** - Banco de dados Redis
- **Tailwind CSS** - Design system moderno
- **TypeScript** - Tipagem estática

## 🎯 Deploy no Vercel (Recomendado)

### 1️⃣ Preparação

```bash
# Clone o repositório
git clone <seu-repositorio>
cd sistema-notificacoes-web

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.local.example .env.local
```

### 2️⃣ Configure .env.local

```bash
# Gere um JWT secret seguro
JWT_SECRET=sua-chave-super-secreta-aqui-com-pelo-menos-32-caracteres

# URLs (serão atualizadas após deploy)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

### 3️⃣ Deploy no Vercel

```bash
# Instale Vercel CLI
npm i -g vercel

# Faça login
vercel login

# Deploy
vercel --prod

# Ou conecte pelo GitHub:
# 1. Acesse vercel.com
# 2. Conecte seu repositório GitHub
# 3. Configure as variáveis de ambiente
# 4. Deploy automático
```

### 4️⃣ Configure Vercel KV

1. **No dashboard da Vercel**:
   - Vá em "Storage" → "Create Database"
   - Escolha "KV (Redis)"
   - Conecte ao seu projeto

2. **Copie as variáveis de ambiente**:
   ```bash
   KV_REST_API_URL=https://your-kv-url
   KV_REST_API_TOKEN=your-token
   KV_REST_API_READ_ONLY_TOKEN=your-read-token
   ```

3. **Adicione no Vercel**:
   - Settings → Environment Variables
   - Adicione as 3 variáveis KV
   - Redeploy o projeto

### 5️⃣ Atualize URLs

Após o deploy, atualize as URLs:
```bash
# No dashboard Vercel, em Environment Variables
NEXT_PUBLIC_APP_URL=https://seu-app.vercel.app
NEXT_PUBLIC_WS_URL=wss://seu-app.vercel.app
```

## 🧪 Teste Local

```bash
# Instale dependências
npm install

# Configure .env.local
cp .env.local.example .env.local

# Execute em desenvolvimento
npm run dev

# Acesse http://localhost:3000
```

### Credenciais Padrão

- **Admin**: `admin` / `admin123`
- **Cliente**: `cliente` / `cliente123`

## 🌐 Configuração de Domínio Personalizado

### No Vercel

1. **Settings** → **Domains**
2. Adicione seu domínio: `notificacoes.suaempresa.com`
3. Configure DNS (CNAME para `cname.vercel-dns.com`)
4. Atualize variáveis de ambiente com novo domínio

### Certificado SSL

O Vercel configura HTTPS automaticamente. Para domínios personalizados:
- SSL é provisionado automaticamente
- Redirecionamento HTTP → HTTPS ativado
- HTTP/2 e Brotli habilitados

## 📱 PWA (Progressive Web App)

O sistema inclui suporte PWA:

```bash
# Adicione ao public/manifest.json personalizado
{
  "name": "Notificações Internas - Sua Empresa",
  "short_name": "Notificações",
  "description": "Sistema de notificações em tempo real",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6"
}
```

## 🔒 Segurança em Produção

### 1. JWT Secret

```bash
# Gere uma chave segura (32+ caracteres)
openssl rand -base64 32

# Ou use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 2. CORS

Já configurado para produção:
- Origem permitida: seu domínio Vercel
- Headers seguros
- Credenciais controladas

### 3. Rate Limiting

Implementado nas APIs:
- 100 requests por 15 minutos por IP
- Proteção contra ataques de força bruta
- Timeouts configuráveis

### 4. Autenticação

- JWT com expiração de 24h
- Senhas com bcrypt (12 rounds)
- Sessões persistidas no Redis
- Logout automático

## 📊 Monitoramento

### Vercel Analytics

```bash
# Já incluído no projeto
# Ative no dashboard Vercel → Analytics
```

### Logs

```bash
# Vercel CLI para logs em tempo real
vercel logs --follow

# Ou no dashboard: Functions → View Function Logs
```

### Métricas Personalizadas

O sistema inclui:
- Clientes conectados em tempo real
- Histórico de notificações
- Estatísticas de uso
- Uptime do servidor

## 🔧 Configuração Avançada

### Múltiplas Instâncias

Para alta disponibilidade:

```bash
# Configure múltiplos deployments
vercel --prod --name notificacoes-primary
vercel --prod --name notificacoes-backup

# Load balancer (Cloudflare, AWS ALB, etc.)
```

### Banco de Dados Externo

Para persistência avançada:

```bash
# Adicione ao .env.local
DATABASE_URL=postgresql://user:pass@host:5432/db

# Instale Prisma
npm install prisma @prisma/client

# Configure schema em prisma/schema.prisma
```

### Email Notifications

```bash
# Configuração SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@empresa.com
SMTP_PASS=sua-senha-de-app

# Sendgrid (recomendado)
SENDGRID_API_KEY=sua-api-key
```

## 📋 Checklist de Deploy

### Pré-Deploy
- [ ] Dependências instaladas
- [ ] .env.local configurado
- [ ] JWT_SECRET gerado
- [ ] Teste local funcionando
- [ ] Build sem erros (`npm run build`)

### Deploy
- [ ] Projeto no Vercel
- [ ] KV Database criado
- [ ] Variáveis de ambiente configuradas
- [ ] Domain configurado (se aplicável)
- [ ] SSL ativo

### Pós-Deploy
- [ ] URLs atualizadas
- [ ] Login funcionando
- [ ] WebSocket conectando
- [ ] Notificações sendo enviadas
- [ ] PWA instalável
- [ ] Analytics ativo

## 🚨 Solução de Problemas

### WebSocket não conecta

```bash
# Verifique se as URLs estão corretas
NEXT_PUBLIC_WS_URL=wss://seu-app.vercel.app

# Teste a conexão
curl -I https://seu-app.vercel.app/api/socket
```

### KV Database não funciona

```bash
# Verifique as variáveis
echo $KV_REST_API_URL
echo $KV_REST_API_TOKEN

# Teste a conexão KV
vercel env pull .env.local
```

### Build falha

```bash
# Limpe cache
rm -rf .next node_modules
npm install
npm run build

# Verifique TypeScript
npm run type-check
```

### Notificações não aparecem

1. **Permissões do browser**: Clique em permitir notificações
2. **HTTPS necessário**: Notificações só funcionam em HTTPS
3. **Service Worker**: Verifique se está registrado

## 📞 Suporte

### Logs Úteis

```bash
# Logs do Vercel
vercel logs --follow

# Logs do browser
# F12 → Console → Procure por erros

# Teste WebSocket
# F12 → Network → WS → Verifique conexões
```

### Comandos de Debug

```bash
# Teste API local
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Teste WebSocket
wscat -c ws://localhost:3000/api/socket
```

## 🔄 Atualizações

```bash
# Atualize dependências
npm update

# Redeploy
git add .
git commit -m "Update dependencies"
git push origin main

# Vercel fará redeploy automático
```

---

## 🎉 Sistema Pronto!

Após seguir este guia, você terá:

- ✅ **Sistema web moderno** rodando no Vercel
- ✅ **Notificações em tempo real** via WebSocket
- ✅ **Interface responsiva** para desktop e mobile
- ✅ **PWA instalável** nos dispositivos
- ✅ **Autenticação segura** com JWT
- ✅ **Banco Redis** para persistência
- ✅ **SSL/HTTPS** automático
- ✅ **Analytics** integrado
- ✅ **Logs** em tempo real

**URL de exemplo**: `https://notificacoes-internas.vercel.app`

**Tempo de deploy**: ~10 minutos
**Custo**: Gratuito no plano Vercel Hobby