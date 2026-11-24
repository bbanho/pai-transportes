/**
 * Serviço de Rotas e Distâncias via Google Maps Platform.
 * Calcula quilometragem real, tempo de estrada e viabilidade financeira (R$/km).
 */
const MapsService = {
  /**
   * Calcula distância e tempo de trajeto entre a origem e o destino da carga
   * @param {string} origem 
   * @param {string} destino 
   * @returns {Object} { distanciaKm, tempoFormatado, status }
   */
  calcularRota: function(origem, destino) {
    const apiKey = CONFIG.APIS.MAPS_API_KEY;
    
    // Se não tiver chave da API Maps, usa o serviço interno do Google Apps Script Maps!
    // O Apps Script tem serviço nativo gratuito de mapas (Maps.newDirectionFinder())!
    try {
      const directions = Maps.newDirectionFinder()
        .setOrigin(origem)
        .setDestination(destino)
        .setMode(Maps.DirectionFinder.Mode.DRIVING)
        .getDirections();

      if (directions.status === "OK" && directions.routes.length > 0) {
        const leg = directions.routes[0].legs[0];
        const distanciaKm = Math.round(leg.distance.value / 1000);
        const tempoFormatado = leg.duration.text;
        
        return {
          distanciaKm: distanciaKm,
          tempoFormatado: tempoFormatado,
          status: "OK"
        };
      }
    } catch (e) {
      Logger.log("Erro no Maps.newDirectionFinder(): " + e.message);
    }

    // Fallback via API Key REST se configurada
    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origem)}&destinations=${encodeURIComponent(destino)}&key=${apiKey}`;
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
        Logger.log("Erro no Maps REST API: " + err.message);
      }
    }

    return { distanciaKm: 0, tempoFormatado: "N/D", status: "FALHA" };
  },

  /**
   * Calcula indicadores financeiros da viagem
   */
  calcularIndicadores: function(distanciaKm, valorOferecido) {
    if (!distanciaKm || distanciaKm === 0 || !valorOferecido) {
      return {
        valorPorKm: null,
        viavel: "A Combinar"
      };
    }

    const valorPorKm = Number((valorOferecido / distanciaKm).toFixed(2));
    
    // Critério base de viabilidade para caminhão 7t (exemplo: mínimo R$ 4,50/km)
    let viavel = "Normal";
    if (valorPorKm >= 5.50) viavel = "Excelente";
    else if (valorPorKm < 3.80) viavel = "Baixo (Atenção)";

    return {
      valorPorKm: valorPorKm,
      viavel: viavel
    };
  }
};
