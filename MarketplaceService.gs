/**
 * Serviço de Busca em Marketplaces e Portais de Frete.
 * Utiliza o Gemini com Search Grounding integrado (Google Search) para varrer
 * a web e portais públicos de fretes buscando cargas reais de SJRP para veículos de até 7t.
 */
const MarketplaceService = {
  /**
   * Busca fretes disponíveis para o perfil do caminhão em SJRP
   * @returns {Array<Object>} Lista de fretes encontrados e validados
   */
  buscarFretesDisponiveis: function() {
    const apiKey = CONFIG.APIS.GEMINI_API_KEY;
    if (!apiKey) {
      Logger.log("AVISO: GEMINI_API_KEY não configurada. Usando dados simulados de teste.");
      return this._obterCargasMock();
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
Você é um especialista em logística rodoviária de cargas no Brasil.
Faça uma pesquisa atualizada em marketplaces e quadros de frete na web (como Fretebras, BuscaCargas, Agência de Cargas, etc.)
por ofertas de frete disponíveis recentemente com origem em "${CONFIG.VEICULO.ORIGEM_BASE}" ou cidades vizinhas (raio de 50km).

CRITÉRIOS OBRIGATÓRIOS DO VEÍCULO:
- Caminhão com capacidade máxima de ${CONFIG.VEICULO.CAPACIDADE_MAX_TON} toneladas e ${CONFIG.VEICULO.VOLUME_MAX_M3} m³.
- Cargas compatíveis: 3/4, Toco, carga seca, fracionada ou paletizada. Descarte cargas que exijam Carreta, Bitrem ou peso superior a ${CONFIG.VEICULO.CAPACIDADE_MAX_TON}t.

Retorne APENAS um JSON válido (sem blocos markdown adicionais além do json) com uma lista de objetos:
[
  {
    "portal": "Nome do marketplace / fonte",
    "origem": "Cidade e UF",
    "destino": "Cidade e UF",
    "tipo_carga": "Descrição da carga",
    "peso_ton": 5.0,
    "volume_m3": 30.0,
    "valor_oferecido": 2500,
    "contato_agenciador": "Telefone / Empresa / Link",
    "observacoes": "Ex: Carga paletizada, precisa de ajudante"
  }
]
Se o valor_oferecido não for especificado, defina como null.
`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      tools: [{
        googleSearch: {} // Search Grounding ativo para dados reais de web
      }],
      generationConfig: {
        temperature: 0.2
      }
    };

    const options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch(endpoint, options);
      const resJson = JSON.parse(response.getContentText());
      
      const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      // Limpa possíveis marcadores ```json ... ```
      const cleanedText = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
      
      const fretes = JSON.parse(cleanedText);
      return Array.isArray(fretes) ? fretes : [];
    } catch (e) {
      Logger.log("Erro na consulta do MarketplaceService: " + e.message);
      return [];
    }
  },

  /**
   * Cargas de exemplo para testes locais ou fallback
   */
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
        observacoes: "Descarga no mesmo dia, carga paletizada"
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
