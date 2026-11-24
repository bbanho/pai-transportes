# Pai Transportes - Automação Auditável de Fretes (Google Apps Script)

Sistema serverless e 100% auditável desenvolvido para o perfil de caminhão **3/4 ou Toco (até 7 toneladas / 45 m³)** com base em **São José do Rio Preto (SJRP)**.

---

## 🎯 Como Funciona

1. **Acionador Agendado (20:00 Diário):**
   - Disparado pelo Google Cloud pontualmente às 20h (sem precisar de computador ligado ou microcontrolador).
2. **Busca em Marketplaces (`MarketplaceService.gs`):**
   - Varre oportunidades na web e portais de carga com filtro estrito de peso (≤ 7t) e volume (≤ 45m³).
3. **Google Maps (`MapsService.gs`):**
   - Usa o serviço nativo `Maps.newDirectionFinder()` do Google para calcular km real de rodovia e tempo de viagem.
   - Calcula automaticamente o **R$/km** do frete.
4. **Auditoria Permanente (`SheetsService.gs`):**
   - Grava cada oferta coletada, km, valor e contato em uma planilha Google Sheets (**Pai_Transportes_Auditoria_Fretes**).
   - Histórico permanente com data e hora.
5. **Notificação de Estrada (`NotificationService.gs`):**
   - Envia um resumo direto, limpo e legível para o **Google Chat** (e opcionalmente **WhatsApp via Meta Cloud API**), permitindo visualização rápida no celular com uma mão na estrada.

---

## 🚀 Como Instalar no Google Apps Script (3 Minutos)

1. Acesse [script.google.com](https://script.google.com) e clique em **Novo projeto**.
2. Dê o nome de **Pai Transportes - Fretes SJRP**.
3. Crie os arquivos com o mesmo nome e cole os códigos desta pasta:
   - `Config.gs`
   - `MarketplaceService.gs`
   - `MapsService.gs`
   - `SheetsService.gs`
   - `NotificationService.gs`
   - `Code.gs`
4. No arquivo `Code.gs`, selecione a função **`configurarAcionadorNoturno20h`** e clique em **Executar**:
   - Isso cria automaticamente o acionador diário das 20:00!
5. Para testar imediatamente, selecione **`executarRotinaDiariaFretes`** e clique em **Executar**.

---

## ⚙️ Variáveis de Ambiente (Opcionais)

No painel do Apps Script, em **Configurações do Projeto > Propriedades do script**, você pode adicionar:

| Chave | Descrição |
|---|---|
| `GEMINI_API_KEY` | Chave gratuita do Google AI Studio para o Search Grounding ao vivo |
| `GOOGLE_CHAT_WEBHOOK` | URL do Webhook da sala do Google Chat |
| `MAPS_API_KEY` | (Opcional, já usa o serviço nativo `Maps` do Apps Script sem custo) |
| `META_WA_TOKEN` | (Opcional) Token da Meta Cloud API para envio no WhatsApp |
| `META_PHONE_ID` | (Opcional) ID de telefone de envio da Meta |
