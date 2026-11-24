/**
 * PAI TRANSPORTES - ROTINA PRINCIPAL DE AUDITORIA E BUSCA DE FRETES
 * Disparado automaticamente todo dia às 20:00 (ou manualmente para testes).
 */

/**
 * Função executada pelo Acionador das 20:00
 */
function executarRotinaDiariaFretes() {
  Logger.log("Iniciando rotina de fretes para Pai Transportes...");

  // 1. Obter fretes dos marketplaces
  const cargasEncontradas = MarketplaceService.buscarFretesDisponiveis();
  Logger.log(`Total de cargas encontradas: ${cargasEncontradas.length}`);

  const fretesProcessados = [];

  // 2. Processar cada carga com Google Maps e calcular métricas
  cargasEncontradas.forEach(carga => {
    const dadosRota = MapsService.calcularRota(carga.origem, carga.destino);
    const indicadores = MapsService.calcularIndicadores(dadosRota.distanciaKm, carga.valor_oferecido);

    fretesProcessados.push({
      carga: carga,
      rota: dadosRota,
      indicadores: indicadores
    });

    // 3. Registrar na auditoria do Google Sheets
    SheetsService.registrarAuditoria(carga, dadosRota, indicadores, "Processado");
  });

  // 4. Disparar notificação consolidada para o motorista (Chat / WhatsApp)
  NotificationService.notificarMotorista(fretesProcessados);

  Logger.log("Rotina finalizada com sucesso.");
}

/**
 * Configura o Acionador (Trigger) das 20:00 automaticamente no Google Apps Script!
 * Basta rodar esta função uma vez no editor do Apps Script.
 */
function configurarAcionadorNoturno20h() {
  // Remove acionadores antigos da mesma função para não duplicar
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === "executarRotinaDiariaFretes") {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Cria o novo trigger diário para as 20h (fuso horário de São Paulo)
  ScriptApp.newTrigger("executarRotinaDiariaFretes")
    .timeBased()
    .atHour(20)
    .everyDays(1)
    .inTimezone("America/Sao_Paulo")
    .create();

  Logger.log("Acionador diário das 20:00 configurado com sucesso!");
}
