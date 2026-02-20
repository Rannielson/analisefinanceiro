"""
Pydantic schemas para request/response da API.
"""
from typing import Any, List, Optional

from pydantic import BaseModel


class RegistroSchema(BaseModel):
    fornecedor: str = ""
    valor: float = 0.0
    data: str = ""
    centro_custo: str = ""
    departamento: str = ""


class ResultadoItemSchema(BaseModel):
    status: str  # ok | divergente | nao_encontrado | info_faltante
    referencia: dict
    comparacao: Optional[dict] = None
    score_nome: Optional[float] = None
    diferenca_valor: Optional[float] = None
    alerta: str = ""


class AlertaDiarioSchema(BaseModel):
    data: str
    mensagem: str


class PorDataSchema(BaseModel):
    data: str
    qtd_ref: int = 0
    qtd_comp: int = 0
    total_ref: float = 0.0
    total_comp: float = 0.0
    divergente: bool = False
    resultados: List[dict] = []


class ResumoSchema(BaseModel):
    total_referencia: int = 0
    total_comparacao: int = 0
    matches_confirmados: int = 0
    divergentes: int = 0
    nao_encontrados: int = 0
    info_faltante: int = 0
    total_alertas_diarios: int = 0


class AnaliseSchema(BaseModel):
    """Estrutura de uma análise (valor+data ou valor+data+centro_custo)."""
    resumo: ResumoSchema
    resultados: List[ResultadoItemSchema]
    por_data: List[PorDataSchema] = []


class RespostaConciliacaoSchema(BaseModel):
    resumo: ResumoSchema
    resultados: List[ResultadoItemSchema]
    alertas_diarios: List[AlertaDiarioSchema]
    por_data: List[PorDataSchema] = []
    analise_centro_custo: Optional[AnaliseSchema] = None
