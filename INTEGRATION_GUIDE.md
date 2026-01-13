# 📚 Guia de Integração - NeuroVendas SEO Monitoring

## 🎯 Visão Geral

Este guia fornece instruções completas para configurar e integrar o sistema de monitoramento de SEO com Google Search Console, n8n e serviços externos.

---

## 📋 Pré-requisitos

### 1. Contas Necessárias

- **Google Cloud Console** - Para Google Search Console API
- **n8n** - Para automação (self-hosted ou cloud)
- **MongoDB** - Banco de dados (já configurado no Manus)
- **OpenAI** - Para análise com IA
- **Slack** (Opcional) - Para alertas
- **Google Sheets** (Opcional) - Para logs

### 2. Credenciais Necessárias

```env
# Google Search Console
GSC_CLIENT_ID=seu-client-id
GSC_CLIENT_SECRET=seu-client-secret
GSC_REDIRECT_URI=https://seu-dominio.com/api/gsc/callback

# OpenAI
OPENAI_API_KEY=sk-...

# Slack (Opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# MongoDB (Já configurado no Manus)
DATABASE_URL=mysql://...
```

---

## 🔧 Parte 1: Configurar Google Search Console API

### Passo 1: Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em **"Criar Projeto"**
3. Nomeie como **"NeuroVendas SEO Monitor"**
4. Clique em **"Criar"**

### Passo 2: Ativar Google Search Console API

1. No menu lateral, vá para **"APIs e Serviços" > "Biblioteca"**
2. Busque por **"Google Search Console API"**
3. Clique em **"Ativar"**

### Passo 3: Criar Credenciais OAuth 2.0

1. Vá para **"APIs e Serviços" > "Credenciais"**
2. Clique em **"Criar Credenciais" > "ID do cliente OAuth"**
3. Configure:
   - **Tipo de aplicativo:** Aplicativo da Web
   - **Nome:** NeuroVendas SEO
   - **URIs de redirecionamento autorizados:**
     ```
     https://seu-dominio.manus.space/api/gsc/callback
     http://localhost:3000/api/gsc/callback (para desenvolvimento)
     ```
4. Clique em **"Criar"**
5. **Copie o Client ID e Client Secret**

### Passo 4: Adicionar Credenciais ao Projeto

1. No painel Manus, vá para **Settings > Secrets**
2. Adicione as seguintes variáveis:
   ```
   GSC_CLIENT_ID=seu-client-id-aqui
   GSC_CLIENT_SECRET=seu-client-secret-aqui
   ```

---

## 🤖 Parte 2: Configurar n8n Workflow

### Passo 1: Instalar n8n

**Opção A: Docker (Recomendado)**
```bash
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
```

**Opção B: npm**
```bash
npm install n8n -g
n8n start
```

### Passo 2: Importar Workflow

1. Acesse n8n em `http://localhost:5678`
2. Clique em **"Workflows" > "Import from File"**
3. Selecione o arquivo `n8n-workflow.json` do projeto
4. Clique em **"Import"**

### Passo 3: Configurar Credenciais no n8n

#### MongoDB
1. Clique em **"Credentials" > "Add Credential"**
2. Selecione **"MongoDB"**
3. Configure:
   ```
   Connection String: mongodb://seu-host:27017
   Database: neurovend_seo
   ```

#### Google API (Search Console)
1. Clique em **"Credentials" > "Add Credential"**
2. Selecione **"Google API"**
3. Configure:
   ```
   Client ID: seu-gsc-client-id
   Client Secret: seu-gsc-client-secret
   ```
4. Clique em **"Connect"** e autorize

#### OpenAI
1. Clique em **"Credentials" > "Add Credential"**
2. Selecione **"OpenAI"**
3. Configure:
   ```
   API Key: sk-seu-api-key
   ```

#### Slack (Opcional)
1. Clique em **"Credentials" > "Add Credential"**
2. Selecione **"Slack"**
3. Configure:
   ```
   Webhook URL: https://hooks.slack.com/services/...
   ```

#### Google Sheets (Opcional)
1. Clique em **"Credentials" > "Add Credential"**
2. Selecione **"Google Sheets OAuth2 API"**
3. Clique em **"Connect"** e autorize

### Passo 4: Configurar Schedule Trigger

1. Abra o workflow importado
2. Clique no nó **"Schedule Trigger"**
3. Verifique a expressão cron: `0 8 * * 1` (Segunda-feira às 8h)
4. Ajuste se necessário

### Passo 5: Ativar Workflow

1. No canto superior direito, clique em **"Active"**
2. O workflow agora será executado automaticamente toda segunda-feira às 8h

---

## 🔄 Parte 3: Fluxo de Funcionamento

### Como o Sistema Funciona

```
1. USUÁRIO ADICIONA KEYWORD
   └─> Frontend (Dashboard)
   └─> tRPC API (keywords.create)
   └─> MongoDB (keywords collection)

2. SEGUNDA-FEIRA 8H (Automático)
   └─> n8n Schedule Trigger
   └─> Busca keywords ativas no MongoDB
   └─> Para cada keyword:
       ├─> Chama Google Search Console API
       ├─> Processa dados de ranking
       ├─> Compara com semana anterior
       ├─> Salva novo ranking no MongoDB
       └─> Se mudança significativa (±3 posições):
           ├─> Gera análise com OpenAI
           ├─> Cria alerta no MongoDB
           ├─> Envia notificação Slack
           └─> Registra em Google Sheets

3. USUÁRIO VISUALIZA DADOS
   └─> Frontend (Dashboard/KeywordDetails)
   └─> tRPC API (rankings.getHistory)
   └─> MongoDB (rankings collection)
   └─> Gráficos e tabelas atualizados
```

---

## 📊 Parte 4: Estrutura de Dados

### Keywords Collection
```json
{
  "id": 1,
  "userId": 1,
  "keyword": "harmonização facial SP",
  "url": "https://site.com/blog/harmonizacao",
  "location": "Brazil",
  "targetPosition": 1,
  "isActive": 1,
  "createdAt": "2025-01-06T00:00:00Z",
  "updatedAt": "2025-01-06T00:00:00Z"
}
```

### Rankings Collection
```json
{
  "id": 1,
  "keywordId": 1,
  "userId": 1,
  "position": 5,
  "impressions": 120,
  "clicks": 15,
  "ctr": "12.5",
  "date": "2025-01-06",
  "week": 1,
  "year": 2025,
  "change": 2,
  "changeType": "up",
  "createdAt": "2025-01-06T08:15:00Z"
}
```

### Alerts Collection
```json
{
  "id": 1,
  "userId": 1,
  "keywordId": 1,
  "type": "significant_change",
  "message": "Keyword subiu 3 posições!",
  "oldPosition": 8,
  "newPosition": 5,
  "isRead": 0,
  "sentToSlack": 1,
  "sentToEmail": 0,
  "createdAt": "2025-01-06T08:15:00Z"
}
```

---

## 🧪 Parte 5: Testar a Integração

### Teste 1: Adicionar Keyword

1. Faça login no aplicativo
2. Vá para **Dashboard**
3. Clique em **"Adicionar Keyword"**
4. Preencha:
   ```
   Keyword: teste seo
   URL: https://seusite.com/teste
   Localização: Brazil
   Posição Alvo: 1
   ```
5. Clique em **"Adicionar Keyword"**
6. Verifique se aparece na lista

### Teste 2: Conectar Google Search Console

1. Vá para **Settings**
2. Clique em **"Conectar Google Search Console"**
3. Autorize o acesso
4. Verifique se aparece **"Conectado ✓"**

### Teste 3: Executar Workflow Manualmente

1. Acesse n8n
2. Abra o workflow **"NeuroVendas SEO Weekly Monitor"**
3. Clique em **"Execute Workflow"**
4. Aguarde a execução
5. Verifique os logs de cada nó
6. Confirme que os dados foram salvos no MongoDB

### Teste 4: Verificar Rankings

1. No Dashboard, clique em uma keyword
2. Verifique se o gráfico mostra dados
3. Verifique a tabela de histórico
4. Confirme que as métricas estão corretas

---

## 🔔 Parte 6: Configurar Alertas

### Slack

1. Crie um Slack App em [api.slack.com/apps](https://api.slack.com/apps)
2. Ative **"Incoming Webhooks"**
3. Adicione o webhook ao canal **#seo-alerts**
4. Copie a URL do webhook
5. Adicione no n8n (nó "Send Slack Alert")

### Email (Opcional)

1. Configure um serviço de email (SendGrid, Mailgun, etc)
2. Adicione um nó **"Send Email"** no workflow n8n
3. Configure o template de email
4. Conecte após o nó **"Save Alert to DB"**

---

## 📈 Parte 7: Monitoramento e Manutenção

### Logs do n8n

1. Acesse n8n
2. Vá para **"Executions"**
3. Verifique execuções recentes
4. Clique em uma execução para ver detalhes

### Logs do Aplicativo

1. No terminal do servidor:
   ```bash
   cd /home/ubuntu/neurovend\ as_seo_monitoring
   pnpm dev
   ```
2. Monitore os logs em tempo real

### Banco de Dados

1. Acesse o painel Manus
2. Vá para **Database**
3. Visualize as tabelas:
   - `keywords`
   - `rankings`
   - `alerts`
   - `gscTokens`

---

## ⚠️ Troubleshooting

### Problema: Google Search Console não conecta

**Solução:**
1. Verifique se o Client ID e Client Secret estão corretos
2. Confirme que a URL de redirecionamento está configurada corretamente
3. Verifique se a API está ativada no Google Cloud Console

### Problema: n8n não executa automaticamente

**Solução:**
1. Verifique se o workflow está **"Active"**
2. Confirme a expressão cron: `0 8 * * 1`
3. Verifique o timezone do servidor n8n
4. Execute manualmente para testar

### Problema: Dados não aparecem no Dashboard

**Solução:**
1. Verifique se o workflow n8n foi executado
2. Confirme que os dados foram salvos no MongoDB
3. Verifique os logs do servidor
4. Recarregue a página

### Problema: OpenAI retorna erro

**Solução:**
1. Verifique se a API key está correta
2. Confirme que há créditos na conta OpenAI
3. Verifique o limite de rate da API
4. Teste a API key diretamente

---

## 🚀 Próximos Passos

1. **Adicione mais keywords** para monitorar
2. **Configure alertas personalizados** no n8n
3. **Integre com outros serviços** (Email, Telegram, etc)
4. **Crie relatórios automáticos** semanais
5. **Otimize o workflow** para performance

---

## 📞 Suporte

Para dúvidas ou problemas:
- **Documentação n8n:** [docs.n8n.io](https://docs.n8n.io)
- **Google Search Console API:** [developers.google.com/webmaster-tools](https://developers.google.com/webmaster-tools)
- **OpenAI API:** [platform.openai.com/docs](https://platform.openai.com/docs)

---

## 📝 Notas Importantes

1. **Frequência de Monitoramento:** O workflow executa toda segunda-feira às 8h. Ajuste conforme necessário.
2. **Limites da API:** Google Search Console tem limites de requisições. Não execute o workflow com muita frequência.
3. **Custos:** OpenAI cobra por token. Monitore o uso para evitar custos inesperados.
4. **Segurança:** Mantenha as credenciais seguras. Nunca compartilhe API keys publicamente.
5. **Backup:** Faça backup regular do banco de dados MongoDB.

---

**Última atualização:** 2025-01-06
