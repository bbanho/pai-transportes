export interface FreteItem {
  id: string;
  dataHora: string;
  portal: string;
  origem: string;
  destino: string;
  distanciaKm: number;
  tempoFormatado: string;
  tipoCarga: string;
  pesoTon: number;
  volumeM3: number;
  valorOferecido: number | null;
  valorPorKm: number | null;
  classificacao: 'Excelente' | 'Normal' | 'Baixo (Atenção)' | 'A Combinar';
  contatoAgenciador: string;
  observacoes?: string;
  statusNotificacao?: string;
}

export interface VeiculoInfo {
  origemBase: string;
  capacidadeMaxTon: number;
  volumeMaxM3: number;
  tipoCarroceria: string;
}

export interface ApiResponse {
  status: string;
  atualizadoEm: string;
  veiculo: VeiculoInfo;
  fretes: FreteItem[];
}
