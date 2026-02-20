export interface RegistroItem {
  fornecedor: string;
  valor: number;
  data: string;
  centro_custo: string;
  departamento: string;
}

export interface ResultadoItem {
  status: "ok" | "divergente" | "nao_encontrado" | "info_faltante";
  referencia: RegistroItem;
  comparacao: RegistroItem | null;
  score_nome: number | null;
  diferenca_valor: number | null;
  alerta: string;
}

export interface AlertaDiario {
  data: string;
  mensagem: string;
}

export interface PorData {
  data: string;
  qtd_ref: number;
  qtd_comp: number;
  total_ref: number;
  total_comp: number;
  divergente: boolean;
  resultados: ResultadoItem[];
}

export interface Resumo {
  total_referencia: number;
  total_comparacao: number;
  matches_confirmados: number;
  divergentes: number;
  nao_encontrados: number;
  info_faltante: number;
  total_alertas_diarios: number;
}

export interface AnaliseConciliacao {
  resumo: Resumo;
  resultados: ResultadoItem[];
  por_data: PorData[];
}

export interface RespostaConciliacao {
  resumo: Resumo;
  resultados: ResultadoItem[];
  alertas_diarios: AlertaDiario[];
  por_data: PorData[];
  analise_centro_custo?: AnaliseConciliacao | null;
}
