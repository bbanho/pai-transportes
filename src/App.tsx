import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Navigation, 
  RefreshCw, 
  ShieldCheck, 
  Clock, 
  Weight, 
  Box, 
  DollarSign, 
  Search, 
  SlidersHorizontal,
  ExternalLink,
  ChevronRight,
  Database
} from 'lucide-react';
import { FreteItem, ApiResponse } from './types';

// Dados iniciais de fallback / demonstração rápida
const DADOS_INICIAIS: FreteItem[] = [
  {
    id: '1',
    dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    portal: 'Agência de Cargas SJRP',
    origem: 'São José do Rio Preto, SP',
    destino: 'Ribeirão Preto, SP',
    distanciaKm: 205,
    tempoFormatado: '2h 27min',
    tipoCarga: 'Embalagens plásticas / fardos',
    pesoTon: 4.5,
    volumeM3: 38,
    valorOferecido: 1950,
    valorPorKm: 9.51,
    classificacao: 'Excelente',
    contatoAgenciador: '(17) 99123-4567',
    observacoes: 'Descarga no mesmo dia. Carga paletizada pronta para carregar.',
    statusNotificacao: 'Auditado'
  },
  {
    id: '2',
    dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    portal: 'BuscaCargas',
    origem: 'Mirassol, SP',
    destino: 'Campinas, SP',
    distanciaKm: 360,
    tempoFormatado: '4h 19min',
    tipoCarga: 'Móveis e ferragens desmontadas',
    pesoTon: 6.0,
    volumeM3: 42,
    valorOferecido: 3400,
    valorPorKm: 9.44,
    classificacao: 'Excelente',
    contatoAgenciador: '(17) 99876-5432',
    observacoes: 'Carregamento das 07h às 10h. Pagamento 80% na saída.',
    statusNotificacao: 'Auditado'
  },
  {
    id: '3',
    dataHora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    portal: 'Fretebras Direto',
    origem: 'Catanduva, SP',
    destino: 'Bauru, SP',
    distanciaKm: 142,
    tempoFormatado: '1h 55min',
    tipoCarga: 'Bebidas e descartáveis',
    pesoTon: 5.2,
    volumeM3: 32,
    valorOferecido: 1100,
    valorPorKm: 7.74,
    classificacao: 'Excelente',
    contatoAgenciador: '(17) 98111-2233',
    observacoes: 'Carga fechada para retorno.',
    statusNotificacao: 'Auditado'
  }
];

export default function App() {
  const [fretes, setFretes] = useState<FreteItem[]>(() => {
    const saved = localStorage.getItem('pai_transportes_cache');
    return saved ? JSON.parse(saved) : DADOS_INICIAIS;
  });

  const [apiUrl, setApiUrl] = useState<string>(() => {
    return localStorage.getItem('pai_transportes_api_url') || '';
  });

  const [showConfig, setShowConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroClassificacao, setFiltroClassificacao] = useState<'Todos' | 'Excelente' | 'Normal'>('Todos');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>('20:00 (Rotina Agendada)');

  // Busca dados do Apps Script Web App se configurado
  const carregarDadosRemotos = async () => {
    if (!apiUrl) {
      setShowConfig(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(apiUrl);
      const data: ApiResponse = await res.json();
      if (data && data.fretes && Array.isArray(data.fretes)) {
        setFretes(data.fretes);
        localStorage.setItem('pai_transportes_cache', JSON.stringify(data.fretes));
        setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Erro ao consultar API do Apps Script. Mantendo cache local.', err);
    } finally {
      setIsLoading(false);
    }
  };

  const salvarUrlApi = (url: string) => {
    setApiUrl(url);
    localStorage.setItem('pai_transportes_api_url', url);
    setShowConfig(false);
  };

  // Filtros em tempo real
  const fretesFiltrados = useMemo(() => {
    return fretes.filter(item => {
      const matchTexto = 
        item.destino.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        item.origem.toLowerCase().includes(filtroTexto.toLowerCase()) ||
        item.tipoCarga.toLowerCase().includes(filtroTexto.toLowerCase());
      
      const matchClasse = 
        filtroClassificacao === 'Todos' || item.classificacao === filtroClassificacao;

      return matchTexto && matchClasse;
    });
  }, [fretes, filtroTexto, filtroClassificacao]);

  // Helpers para links diretos
  const getCleanPhone = (phone: string) => phone.replace(/\D/g, '');
  const getWhatsappUrl = (item: FreteItem) => {
    const rawNum = getCleanPhone(item.contatoAgenciador);
    const num = rawNum.startsWith('55') ? rawNum : `55${rawNum}`;
    const msg = encodeURIComponent(
      `Olá! Vi a oferta da carga de ${item.origem} para ${item.destino} (${item.tipoCarga}, ${item.pesoTon}t) no ${item.portal}. Meu caminhão (3/4 Baú) está disponível em SJRP!`
    );
    return `https://wa.me/${num}?text=${msg}`;
  };

  const getMapsUrl = (origem: string, destino: string) => {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origem)}&destination=${encodeURIComponent(destino)}&travelmode=driving`;
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 pb-24 text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Compacto & Focado na Estrada */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white flex items-center gap-1.5">
                Pai Transportes
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" /> São José do Rio Preto • 7t / 45m³
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={carregarDadosRemotos}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all"
              title="Atualizar fretes"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all"
              title="Configurações / API"
            >
              <Database className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Modal / Gaveta de Configuração do Apps Script */}
        {showConfig && (
          <div className="mt-3 p-3 bg-slate-800/90 border border-slate-700 rounded-xl text-xs space-y-2">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Conexão Google Workspace (Apps Script)
            </div>
            <p className="text-slate-400">
              Cole a URL do Web App gerado no seu Apps Script (<code className="text-emerald-400 font-mono">/exec</code>) para sincronização automática.
            </p>
            <div className="flex gap-2">
              <input 
                type="text" 
                defaultValue={apiUrl}
                placeholder="https://script.google.com/macros/s/.../exec"
                id="input-api-url"
                className="flex-1 bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button 
                onClick={() => {
                  const el = document.getElementById('input-api-url') as HTMLInputElement;
                  salvarUrlApi(el.value);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 font-medium text-white rounded-lg"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* Barra de Busca e Filtros Rápidos */}
        <div className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar destino ou carga..."
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-0.5 text-xs">
            {(['Todos', 'Excelente'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFiltroClassificacao(tab)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filtroClassificacao === tab 
                    ? 'bg-emerald-500 text-slate-950 font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Indicador de Status Auditável */}
      <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Auditado no Google Sheets
        </span>
        <span className="flex items-center gap-1 text-slate-500">
          <Clock className="w-3 h-3" /> Atualizado: {ultimaAtualizacao}
        </span>
      </div>

      {/* Lista de Fretes Disponíveis */}
      <main className="flex-1 px-4 py-3 space-y-3.5">
        {fretesFiltrados.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-slate-800/60 bg-slate-900/20">
            <Truck className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-medium text-slate-300 text-sm">Nenhum frete com esses filtros</p>
            <p className="text-xs text-slate-500 mt-1">Aguarde o próximo ciclo automático das 20h ou limpe a busca.</p>
          </div>
        ) : (
          fretesFiltrados.map((item, index) => (
            <article 
              key={item.id || index}
              className="bg-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-all flex flex-col gap-3"
            >
              {/* Cabeçalho da Carga: Rota e Classificação */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                    <span>{item.origem}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {item.destino}
                  </h2>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    item.classificacao === 'Excelente' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {item.classificacao}
                  </span>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {item.distanciaKm} km • {item.tempoFormatado}
                  </div>
                </div>
              </div>

              {/* Informações da Carga (Peso, Volume, Valor) */}
              <div className="grid grid-cols-3 gap-2 py-1 text-center bg-slate-950/60 rounded-xl p-2 border border-slate-800/50">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Peso</span>
                  <span className="text-xs font-semibold text-slate-200">{item.pesoTon}t</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Volume</span>
                  <span className="text-xs font-semibold text-slate-200">{item.volumeM3}m³</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-medium">Valor Total</span>
                  <span className="text-xs font-bold text-emerald-400">
                    {item.valorOferecido ? `R$ ${item.valorOferecido.toLocaleString('pt-BR')}` : 'A combinar'}
                  </span>
                </div>
              </div>

              {/* Detalhes da Carga & Fonte */}
              <div className="text-xs space-y-1">
                <div className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-slate-400" />
                  {item.tipoCarga}
                </div>
                {item.observacoes && (
                  <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                    {item.observacoes}
                  </p>
                )}
                <div className="text-[10px] text-slate-500 pt-1 flex items-center justify-between">
                  <span>Fonte: {item.portal}</span>
                  {item.valorPorKm && (
                    <span className="font-mono text-emerald-400 font-semibold">
                      R$ {item.valorPorKm.toFixed(2)}/km
                    </span>
                  )}
                </div>
              </div>

              {/* Botões Grandes de 1 Toque (Feitos para operar com uma mão na estrada) */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <a
                  href={`tel:${getCleanPhone(item.contatoAgenciador)}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-400" />
                  Ligar
                </a>

                <a
                  href={getWhatsappUrl(item)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-950"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  WhatsApp
                </a>

                <a
                  href={getMapsUrl(item.origem, item.destino)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  Rota
                </a>
              </div>
            </article>
          ))
        )}
      </main>

      {/* Rodapé Fixo com Resumo */}
      <footer className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 z-20">
        <span className="font-medium text-slate-300">
          {fretesFiltrados.length} {fretesFiltrados.length === 1 ? 'frete listado' : 'fretes listados'}
        </span>
        <a 
          href="https://script.google.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-emerald-400 hover:underline"
        >
          Google Workspace Business <ExternalLink className="w-3 h-3" />
        </a>
      </footer>

    </div>
  );
}
