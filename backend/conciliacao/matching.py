"""
Matching de registros por valor e data.
Compara unicamente valor pago e data do pagamento — ignora o nome do fornecedor.
"""
from dataclasses import dataclass
from typing import Any, List, Optional, Tuple

import pandas as pd
from rapidfuzz import fuzz


@dataclass
class Registro:
    """Registro normalizado para exibição e comparação."""
    fornecedor: str
    valor: float
    data: str  # DD/MM
    centro_custo: str
    departamento: str
    idx_orig: int = 0
    fornecedor_norm: str = ""


@dataclass
class ResultadoMatch:
    """Resultado do matching entre referência e comparação."""
    status: str  # "ok" | "divergente" | "nao_encontrado"
    referencia: dict[str, Any]
    comparacao: Optional[dict]
    score_nome: Optional[float]
    diferenca_valor: Optional[float]
    alerta: str
    idx_ref: int = 0
    idx_comp: Optional[int] = None


def _registro_to_dict(r: Registro) -> dict[str, Any]:
    return {
        "fornecedor": r.fornecedor,
        "valor": round(r.valor, 2),
        "data": r.data,
        "centro_custo": r.centro_custo,
        "departamento": r.departamento,
    }


def _df_to_registros(df: pd.DataFrame) -> List[Registro]:
    """Converte DataFrame normalizado em lista de Registro."""
    registros = []
    for i, row in df.iterrows():
        registros.append(Registro(
            fornecedor=str(row.get("fornecedor", "")),
            valor=float(row.get("valor", 0)),
            data=str(row.get("data_exib", "")),
            centro_custo=str(row.get("centro_custo", "")),
            departamento=str(row.get("departamento", "")),
            idx_orig=int(i),
            fornecedor_norm=str(row.get("fornecedor_norm", "")),
        ))
    return registros


def _encontrar_match_valor_data(
    ref: Registro,
    candidatos: List[Tuple[int, "Registro"]],
    tolerancia: float = 0.01,
) -> Optional[int]:
    """
    Match apenas por valor e data. Ignora o nome do fornecedor.
    Retorna o índice do primeiro candidato com mesmo valor (dentro da tolerância) no mesmo dia.
    """
    for idx_comp, cand in candidatos:
        if abs(ref.valor - cand.valor) <= tolerancia:
            return idx_comp
    return None


def executar_matching(
    df_ref: pd.DataFrame,
    df_comp: pd.DataFrame,
    tolerancia_valor: float = 0.01,
) -> List[ResultadoMatch]:
    """
    Para cada registro da Referência, busca match na Comparação por valor e data apenas.
    Nome do fornecedor é ignorado.
    """
    if "fornecedor_norm" not in df_ref.columns:
        df_ref = df_ref.copy()
        df_ref["fornecedor_norm"] = df_ref.get("fornecedor", "").apply(
            lambda x: str(x).strip().lower()
        )
    if "fornecedor_norm" not in df_comp.columns:
        df_comp = df_comp.copy()
        df_comp["fornecedor_norm"] = df_comp.get("fornecedor", "").apply(
            lambda x: str(x).strip().lower()
        )

    regs_ref = _df_to_registros(df_ref)
    regs_comp = _df_to_registros(df_comp)

    por_data: dict = {}
    for idx, r in enumerate(regs_comp):
        d = r.data or ""
        if d not in por_data:
            por_data[d] = []
        por_data[d].append((idx, r))

    resultados: List[ResultadoMatch] = []
    comp_usados = set()

    for idx_ref, ref in enumerate(regs_ref):
        candidatos = [(i, r) for i, r in por_data.get(ref.data or "", []) if i not in comp_usados]

        idx_comp = _encontrar_match_valor_data(ref, candidatos, tolerancia_valor)

        if idx_comp is None:
            resultados.append(ResultadoMatch(
                status="nao_encontrado",
                referencia=_registro_to_dict(ref),
                comparacao=None,
                score_nome=None,
                diferenca_valor=None,
                alerta="Nenhum match encontrado na planilha de comparação",
                idx_ref=idx_ref,
                idx_comp=None,
            ))
            continue

        comp = regs_comp[idx_comp]
        comp_usados.add(idx_comp)

        diff = abs(ref.valor - comp.valor)
        if diff <= tolerancia_valor:
            status = "ok"
            alerta = ""
        else:
            status = "divergente"
            alerta = f"Valor divergente em R$ {diff:.2f}".replace(".", ",")

        # Score do nome apenas para exibição (não afeta o match)
        score_nome = fuzz.ratio(ref.fornecedor_norm, comp.fornecedor_norm) / 100.0

        resultados.append(ResultadoMatch(
            status=status,
            referencia=_registro_to_dict(ref),
            comparacao=_registro_to_dict(comp),
            score_nome=round(score_nome, 2),
            diferenca_valor=round(diff, 2) if diff > tolerancia_valor else None,
            alerta=alerta,
            idx_ref=idx_ref,
            idx_comp=idx_comp,
        ))

    return resultados
