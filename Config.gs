/**
 * Configurações Gerais do Pai Transportes
 * Ajuste as chaves de API e preferências aqui ou em Propriedades do Script.
 */
const CONFIG = {
  // Perfil do Veículo
  VEICULO: {
    ORIGEM_BASE: "São José do Rio Preto, SP",
    CAPACIDADE_MAX_TON: 7.0, // Caminhão 3/4 ou Toco
    VOLUME_MAX_M3: 45.0,
    TIPO_CARROCERIA: "Baú / Carroceria aberta / Sider"
  },

  // Chaves de API (Recomenda-se configurar em Propriedades do Projeto no Apps Script)
  APIS: {
    GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY") || "",
    MAPS_API_KEY: PropertiesService.getScriptProperties().getProperty("MAPS_API_KEY") || "",
    META_WA_TOKEN: PropertiesService.getScriptProperties().getProperty("META_WA_TOKEN") || "",
    META_PHONE_ID: PropertiesService.getScriptProperties().getProperty("META_PHONE_ID") || "",
    GOOGLE_CHAT_WEBHOOK: PropertiesService.getScriptProperties().getProperty("GOOGLE_CHAT_WEBHOOK") || ""
  },

  // Telefones / Destinatários
  NOTIFICACAO: {
    MOTORISTA_WHATSAPP: "5517999999999", // Ajustar para o número do motorista
    ENVIAR_CHAT: true,
    ENVIAR_WHATSAPP: false // Ative quando preencher o META_WA_TOKEN
  },

  // Planilha de Auditoria (ID da Google Sheet onde as cargas serão logadas)
  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || ""
};
