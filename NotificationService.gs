/**
 * Serviço de Notificações para Celular (Google Chat e Meta WhatsApp).
 * Formata os dados de forma limpa e direta para leitura instantânea na estrada.
 */
const NotificationService = {
  /**
   * Envia o compilado de fretes para os canais configurados
   */
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
      Logger.log("Erro ao enviar para Google Chat: " + e.message);
    }
  },

  _enviarWhatsApp: function(numero, texto) {
    const token = CONFIG.APIS.META_WA_TOKEN;
    const phoneId = CONFIG.APIS.META_PHONE_ID;
    if (!token || !phoneId) {
      Logger.log("Meta WhatsApp API não configurada.");
      return;
    }

    const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to: numero,
      type: "text",
      text: { body: texto }
    };

    try {
      UrlFetchApp.fetch(url, {
        method: "post",
        contentType: "application/json",
        headers: { Authorization: `Bearer ${token}` },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      });
      Logger.log("Notificação enviada via WhatsApp Meta.");
    } catch (e) {
      Logger.log("Erro ao enviar WhatsApp: " + e.message);
    }
  }
};
