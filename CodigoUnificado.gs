/**
 * ============================================================================
 * PAI TRANSPORTES - SISTEMA AUDITÁVEL DE CAPTURA E ANÁLISE DE FRETES
 * Perfil: Caminhão 3/4 ou Toco (Capacidade máxima 7t / Volume 45m³)
 * Base de Operação: São José do Rio Preto - SP
 * Disparo: Diário às 20:00 (ou manual)
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. CONFIGURAÇÕES GERAIS
// ----------------------------------------------------------------------------
const CONFIG = {
  VEICULO: {
    ORIGEM_BASE: "São José do Rio Preto, SP",
    CAPACIDADE_MAX_TON: 7.0,
    VOLUME_MAX_M3: 45.0,
    TIPO_CARROCERIA: "Baú / Sider / Carroceria aberta"
  },

  APIS: {
    // Chaves configuradas em Propriedades do Script (ou diretamente aqui)
    GEMINI_API_KEY: PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY") || "",
    MAPS_API_KEY: PropertiesService.getScriptProperties().getProperty("MAPS_API_KEY") || "",
    META_WA_TOKEN: PropertiesService.getScriptProperties().getProperty("META_WA_TOKEN") || "",
    META_PHONE_ID: PropertiesService.getScriptProperties().getProperty("META_PHONE_ID") || "",
    GOOGLE_CHAT_WEBHOOK: PropertiesService.getScriptProperties().getProperty("GOOGLE_CHAT_WEBHOOK") || ""
  },

  NOTIFICACAO: {
    MOTORISTA_WHATSAPP: "5517999999999", // Ajustar para o WhatsApp do motorista
    ENVIAR_CHAT: true,
    ENVIAR_WHATSAPP: false // Ative se configurar o token da Meta
  },

  SPREADSHEET_ID: PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID") || ""
};

// ----------------------------------------------------------------------------
// 2. BUSCA EM MARKETPLACES (VIA GEMINI SEARCH GROUNDING / WEB)
// ----------------------------------------------------------------------------
const MarketplaceService = {
  buscarFretesDisponiveis: function() {
    const apiKey = CONFIG.APIS.GEMINI_API_KEY;
    if (!apiKey) {
      Logger.log("GEMINI_API_KEY não configurada. Usando cargas demonstrativas de teste.");
      return this._obterCargasMock();
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
Você é um despachante logístico experiente no Brasil.
Pesquise na web em marketplaces e quadros de frete (como Fretebras, BuscaCargas, Agência de Cargas, etc.)
por cargas reais disponíveis recentemente com origem em "${CONFIG.VEICULO.ORIGEM_BASE}" ou região (raio de 50km).

CRITÉRIOS OBRIGATÓRIOS DO VEÍCULO:
- Caminhão com capacidade de até ${CONFIG.VEICULO.CAPACIDADE_MAX_TON} toneladas e até ${CONFIG.VEICULO.VOLUME_MAX_M3} m³.
- Cargas para 3/4 ou Toco (carga seca, fracionada ou paletizada). Descarte cargas que exijam Carreta ou peso acima de ${CONFIG.VEICULO.CAPACIDADE_MAX_TON}t.

Retorne APENAS um JSON válido (array de objetos) no seguinte formato:
[
  {
    "portal": "Nome do marketplace / fonte",
    "origem": "Cidade e UF",
    "destino": "Cidade e UF",
    "tipo_carga": "Descrição da carga",
    "peso_ton": 5.0,
    "volume_m3": 35.0,
    "valor_oferecido": 2500,
    "contato_agenciador": "Telefone / Empresa / Link",
    "observacoes": "Detalhes de carga/descarga"
  }
]
Se o valor_oferecido não estiver divulgado, preencha com null.
`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ googleSearch: {} }],
      generationConfig: { temperature: 0.2 }
    };

    try {
      const response = UrlFetchApp.fetch(endpoint, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });

      const resJson = JSON.parse(response.getContentText());
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      const cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const fretes = JSON.parse(cleaned);
      return Array.isArray(fretes) ? fretes : [];
    } catch (e) {
      Logger.log("Erro ao consultar MarketplaceService: " + e.message);
      return [];
    }
  },

  _obterCargasMock: function() {
    return [
      {
        portal: "Agência de Cargas SJRP",
        origem: "São José do Rio Preto, SP",
        destino: "Ribeirão Preto, SP",
        tipo_carga: "Embalagens plásticas / fardos",
        peso_ton: 4.5,
        volume_m3: 38.0,
        valor_oferecido: 1950,
        contato_agenciador: "Expresso Regional (17) 99123-4567",
        observacoes: "Carga paletizada, descarga no mesmo dia"
      },
      {
        portal: "BuscaCargas",
        origem: "Mirassol, SP",
        destino: "Campinas, SP",
        tipo_carga: "Móveis e ferragens",
        peso_ton: 6.0,
        volume_m3: 42.0,
        valor_oferecido: 3400,
        contato_agenciador: "LogSJ (17) 99876-5432",
        observacoes: "Carregamento das 07h às 10h"
      }
    ];
  }
};

// ----------------------------------------------------------------------------
// 3. GOOGLE MAPS (CÁLCULO DE KM REAL E VIABILIDADE)
// ----------------------------------------------------------------------------
const MapsService = {
  calcularRota: function(origem, destino) {
    try {
      // Usa o serviço nativo do Apps Script Maps (sem precisar de chave externa)
      const directions = Maps.newDirectionFinder()
        .setOrigin(origem)
        .setDestination(destino)
        .setMode(Maps.DirectionFinder.Mode.DRIVING)
        .getDirections();

      if (directions.status === "OK" && directions.routes.length > 0) {
        const leg = directions.routes[0].legs[0];
        return {
          distanciaKm: Math.round(leg.distance.value / 1000),
          tempoFormatado: leg.duration.text,
          status: "OK"
        };
      }
    } catch (e) {
      Logger.log("Aviso: Maps nativo não disponível, tentando REST API: " + e.message);
    }

    if (CONFIG.APIS.MAPS_API_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origem)}&destinations=${encodeURIComponent(destino)}&key=${CONFIG.APIS.MAPS_API_KEY}`;
        const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        const data = JSON.parse(response.getContentText());
        if (data.rows?.[0]?.elements?.[0]?.status === "OK") {
          const el = data.rows[0].elements[0];
          return {
            distanciaKm: Math.round(el.distance.value / 1000),
            tempoFormatado: el.duration.text,
            status: "OK"
          };
        }
      } catch (err) {
        Logger.log("Erro Maps REST: " + err.message);
      }
    }

    return { distanciaKm: 0, tempoFormatado: "N/D", status: "FALHA" };
  },

  calcularIndicadores: function(distanciaKm, valorOferecido) {
    if (!distanciaKm || distanciaKm === 0 || !valorOferecido) {
      return { valorPorKm: null, viavel: "A Combinar" };
    }
    const valorPorKm = Number((valorOferecido / distanciaKm).toFixed(2));
    let viavel = "Normal";
    if (valorPorKm >= 5.50) viavel = "Excelente";
    else if (valorPorKm < 3.80) viavel = "Baixo (Atenção)";

    return { valorPorKm: valorPorKm, viavel: viavel };
  }
};

// ----------------------------------------------------------------------------
// 4. PLANILHA DE AUDITORIA (HISTÓRICO PERMANENTE)
// ----------------------------------------------------------------------------
const SheetsService = {
  obterPlanilhaAuditoria: function() {
    let ss;
    if (CONFIG.SPREADSHEET_ID) {
      ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } else {
      const files = DriveApp.getFilesByName("Pai_Transportes_Auditoria_Fretes");
      if (files.hasNext()) {
        ss = SpreadsheetApp.open(files.next());
      } else {
        ss = SpreadsheetApp.create("Pai_Transportes_Auditoria_Fretes");
        Logger.log("Nova planilha de auditoria criada: " + ss.getUrl());
      }
    }

    let sheet = ss.getSheetByName("Auditoria_Fretes");
    if (!sheet) {
      sheet = ss.insertSheet("Auditoria_Fretes");
      sheet.appendRow([
        "Data/Hora", "Marketplace / Fonte", "Origem", "Destino", "Distância (KM)",
        "Tempo Estimado", "Tipo Carga", "Peso (Ton)", "Volume (m³)", "Valor Oferta (R$)",
        "R$ / KM", "Classificação", "Contato / Agenciador", "Status Notificação"
      ]);
      sheet.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#e8eaed");
      sheet.setFrozenRows(1);
    }
    return sheet;
  },

  registrarAuditoria: function(carga, dadosRota, indicadores, statusNotificacao) {
    try {
      const sheet = this.obterPlanilhaAuditoria();
      const agora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd HH:mm:ss");
      sheet.appendRow([
        agora,
        carga.portal || "N/A",
        carga.origem || CONFIG.VEICULO.ORIGEM_BASE,
        carga.destino || "N/A",
        dadosRota.distanciaKm || 0,
        dadosRota.tempoFormatado || "N/A",
        carga.tipo_carga || "Geral",
        carga.peso_ton || 0,
        carga.volume_m3 || 0,
        carga.valor_oferecido ? Number(carga.valor_oferecido) : "A combinar",
        indicadores.valorPorKm || "N/A",
        indicadores.viavel || "N/A",
        carga.contato_agenciador || "N/A",
        statusNotificacao
      ]);
    } catch (e) {
      Logger.log("Erro ao registrar auditoria: " + e.message);
    }
  },

  obterUltimosFretesAuditados: function(limite = 20) {
    try {
      const sheet = this.obterPlanilhaAuditoria();
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return [];

      const startRow = Math.max(2, lastRow - limite + 1);
      const numRows = lastRow - startRow + 1;
      const values = sheet.getRange(startRow, 1, numRows, 14).getValues();

      return values.reverse().map((row, idx) => ({
        id: String(idx + 1),
        dataHora: String(row[0]),
        portal: String(row[1]),
        origem: String(row[2]),
        destino: String(row[3]),
        distanciaKm: Number(row[4]) || 0,
        tempoFormatado: String(row[5]),
        tipoCarga: String(row[6]),
        pesoTon: Number(row[7]) || 0,
        volumeM3: Number(row[8]) || 0,
        valorOferecido: isNaN(Number(row[9])) ? null : Number(row[9]),
        valorPorKm: isNaN(Number(row[10])) ? null : Number(row[10]),
        classificacao: String(row[11]) || 'Normal',
        contatoAgenciador: String(row[12]),
        statusNotificacao: String(row[13])
      }));
    } catch (e) {
      Logger.log("Erro ao ler auditoria: " + e.message);
      return [];
    }
  }
};

// ----------------------------------------------------------------------------
// 5. NOTIFICAÇÕES (GOOGLE CHAT E META WHATSAPP)
// ----------------------------------------------------------------------------
const NotificationService = {
  notificarMotorista: function(fretesProcessados) {
    if (!fretesProcessados || fretesProcessados.length === 0) {
      const msgVazia = "🚚 *Pai Transportes - Notificação 20h*\nNenhuma carga compatível (<7t / 45m³) encontrada em SJRP para amanhã.";
      this._enviarChat(msgVazia);
      return;
    }

    const agora = Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM 'às' HH:mm");
    let mensagem = `🚛 *PAI TRANSPORTES - OFERTAS DE FRETE*\n📅 _Atualizado em: ${agora}_\n📍 *Base:* ${CONFIG.VEICULO.ORIGEM_BASE}\n\n`;

    fretesProcessados.forEach((item, index) => {
      const c = item.carga;
      const r = item.rota;
      const ind = item.indicadores;

      mensagem += `*#${index + 1} | ${c.origem} ➔ ${c.destino}*\n`;
      mensagem += `• *Distância:* ~${r.distanciaKm} km (${r.tempoFormatado})\n`;
      mensagem += `• *Carga:* ${c.tipo_carga} (${c.peso_ton}t / ${c.volume_m3}m³)\n`;
      
      if (c.valor_oferecido) {
        mensagem += `• *Oferta:* R$ ${Number(c.valor_oferecido).toLocaleString("pt-BR")} (R$ ${ind.valorPorKm}/km - ${ind.viavel})\n`;
      } else {
        mensagem += `• *Oferta:* A combinar\n`;
      }
      mensagem += `• *Contato/Fonte:* ${c.contato_agenciador} (${c.portal})\n`;
      if (c.observacoes) {
        mensagem += `• *Obs:* ${c.observacoes}\n`;
      }
      mensagem += `-----------------------------------------\n`;
    });

    if (CONFIG.NOTIFICACAO.ENVIAR_CHAT) {
      this._enviarChat(mensagem);
    }
    if (CONFIG.NOTIFICACAO.ENVIAR_WHATSAPP) {
      this._enviarWhatsApp(CONFIG.NOTIFICACAO.MOTORISTA_WHATSAPP, mensagem);
    }
  },

  _enviarChat: function(texto) {
    const webhook = CONFIG.APIS.GOOGLE_CHAT_WEBHOOK;
    if (!webhook) {
      Logger.log("Google Chat Webhook não configurado. Mensagem gerada:\n" + texto);
      return;
    }
    try {
      UrlFetchApp.fetch(webhook, {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify({ text: texto }),
        muteHttpExceptions: true
      });
      Logger.log("Notificação enviada ao Google Chat com sucesso.");
    } catch (e) {
      Logger.log("Erro Google Chat: " + e.message);
    }
  },

  _enviarWhatsApp: function(numero, texto) {
    const token = CONFIG.APIS.META_WA_TOKEN;
    const phoneId = CONFIG.APIS.META_PHONE_ID;
    if (!token || !phoneId) return;

    try {
      UrlFetchApp.fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${token}` },
        payload: JSON.stringify({
          messaging_product: "whatsapp",
          to: numero,
          type: "text",
          text: { body: texto }
        }),
        muteHttpExceptions: true
      });
      Logger.log("Notificação WhatsApp enviada.");
    } catch (e) {
      Logger.log("Erro WhatsApp: " + e.message);
    }
  }
};

// ----------------------------------------------------------------------------
// 6. FUNÇÃO PRINCIPAL E AGENDADOR AUTOMÁTICO
// ----------------------------------------------------------------------------

/**
 * Função executada pelo Acionador todo dia às 20:00
 */
function executarRotinaDiariaFretes() {
  Logger.log("Iniciando rotina de fretes para Pai Transportes...");

  const cargasEncontradas = MarketplaceService.buscarFretesDisponiveis();
  Logger.log(`Total de cargas encontradas: ${cargasEncontradas.length}`);

  const fretesProcessados = [];
  cargasEncontradas.forEach(carga => {
    const dadosRota = MapsService.calcularRota(carga.origem, carga.destino);
    const indicadores = MapsService.calcularIndicadores(dadosRota.distanciaKm, carga.valor_oferecido);

    fretesProcessados.push({
      carga: carga,
      rota: dadosRota,
      indicadores: indicadores
    });

    SheetsService.registrarAuditoria(carga, dadosRota, indicadores, "Processado");
  });

  NotificationService.notificarMotorista(fretesProcessados);
  Logger.log("Rotina finalizada com sucesso.");
}

/**
 * Executar UMA VEZ no editor para agendar automaticamente às 20h todo dia!
 */
function configurarAcionadorNoturno20h() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === "executarRotinaDiariaFretes") {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger("executarRotinaDiariaFretes")
    .timeBased()
    .atHour(20)
    .everyDays(1)
    .inTimezone("America/Sao_Paulo")
    .create();

  Logger.log("Acionador diário das 20:00 configurado com sucesso!");
}

// ----------------------------------------------------------------------------
// 7. ENDPOINT REST PARA CLOUDFLARE PAGES / FRONTEND
// ----------------------------------------------------------------------------

/**
 * Endpoint Web App (doGet) que responde JSON com CORS habilitado
 * Permite que o frontend hospedado no Cloudflare Pages consuma os fretes auditados.
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "list";
    
    // Se o frontend solicitar ?action=run, dispara a busca imediatamente
    if (action === "run") {
      executarRotinaDiariaFretes();
    }

    const fretesAuditados = SheetsService.obterUltimosFretesAuditados();

    const output = {
      status: "OK",
      atualizadoEm: Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd'T'HH:mm:ssXXX"),
      veiculo: {
        origemBase: CONFIG.VEICULO.ORIGEM_BASE,
        capacidadeMaxTon: CONFIG.VEICULO.CAPACIDADE_MAX_TON,
        volumeMaxM3: CONFIG.VEICULO.VOLUME_MAX_M3,
        tipoCarroceria: CONFIG.VEICULO.TIPO_CARROCERIA
      },
      fretes: fretesAuditados
    };

    return ContentService.createTextOutput(JSON.stringify(output))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "ERRO",
      mensagem: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

