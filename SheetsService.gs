/**
 * Serviço de Auditoria e Registro em Google Sheets.
 * Mantém histórico auditável e imutável de todas as ofertas coletadas e enviadas ao motorista.
 */
const SheetsService = {
  /**
   * Obtém ou inicializa a aba de auditoria na planilha
   */
  obterPlanilhaAuditoria: function() {
    let ss;
    if (CONFIG.SPREADSHEET_ID) {
      ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
    } else {
      // Se não informado ID, cria uma planilha própria ou usa a ativa
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
      // Cabeçalho estruturado e auditável
      sheet.appendRow([
        "Data/Hora",
        "Marketplace / Fonte",
        "Origem",
        "Destino",
        "Distância (KM)",
        "Tempo Estimado",
        "Tipo Carga",
        "Peso (Ton)",
        "Volume (m³)",
        "Valor Oferta (R$)",
        "R$ / KM",
        "Classificação",
        "Contato / Agenciador",
        "Status Notificação"
      ]);
      sheet.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#e8eaed");
      sheet.setFrozenRows(1);
    }

    return sheet;
  },

  /**
   * Grava registro auditável de cada carga analisada
   */
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
      Logger.log("Erro ao gravar na planilha de auditoria: " + e.message);
    }
  }
};
