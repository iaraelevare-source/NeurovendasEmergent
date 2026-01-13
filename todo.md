# NeuroVendas SEO Monitoring - TODO

## Backend

- [x] Schema do banco de dados (keywords, rankings, gsc_tokens, alerts)
- [x] Helpers de banco de dados para CRUD de keywords
- [x] Helpers de banco de dados para histórico de rankings
- [x] Helpers de banco de dados para tokens GSC
- [x] Router tRPC para keywords (list, create, update, delete)
- [x] Router tRPC para rankings (getHistory, getSummary)
- [x] Router tRPC para autenticação GSC (getAuthUrl, handleCallback)
- [ ] Router tRPC para análise IA (analyzeKeyword)
- [ ] Integração com Google Search Console API (OAuth callback endpoint)
- [ ] Integração com OpenAI para análise IA (via n8n)

## Frontend

- [x] Dashboard principal com cards de resumo
- [x] Gráfico de tendência de rankings
- [x] Lista de keywords com posições atuais
- [x] Página de detalhes de keyword com histórico
- [x] Formulário para adicionar/editar keywords
- [x] Página de configurações (conectar GSC, alertas)
- [ ] Sistema de notificações/alertas (visualização de alertas no app)
- [x] Loading states e error handling

## Automação

- [x] Fluxo n8n com schedule trigger (segunda 8h)
- [x] Integração n8n com Google Search Console API
- [x] Integração n8n com MongoDB
- [x] Integração n8n com OpenAI
- [x] Alertas Slack para mudanças significativas
- [ ] Alertas Email para mudanças significativas (opcional)
- [x] Log em Google Sheets

## Documentação

- [x] README com instruções de setup
- [x] Documentação da API tRPC (via código TypeScript)
- [x] Guia de configuração do n8n
- [x] Guia de configuração do Google Search Console
