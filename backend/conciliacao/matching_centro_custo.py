"""
Matching de registros por data, valor e centro de custo.
Compara data + valor pago + centro de custo entre planilhas.
"""
import unicodedata
from dataclasses import dataclass
from typing import Any, List, Optional, Tuple

import pandas as pd
from rapidfuzz import fuzz


def _remover_acentos(s: str) -> str:
    """Remove acentos para comparação (ex: JOÃO PESSOA -> joao pessoa)."""
    nfd = unicodedata.normalize("NFD", s)
    return "".join(c for c in nfd if unicodedata.category(c) != "Mn")


def _normalizar_centro_custo(s: str) -> str:
    """Normaliza centro de custo para comparação (strip, lower, remove acentos)."""
    if not s or pd.isna(s):
        return ""
    return _remover_acentos(str(s).strip().lower())


def _centro_custo_match(a_norm: str, b_norm: str, min_len: int = 3) -> bool:
    """
    Match por centro de custo flexível: um contém o outro.
    Ex: "SEGBRASIL RECIFE" bate com "RECIFE", "recife" etc.
    """
    if not a_norm and not b_norm:
        return True
    if not a_norm or not b_norm:
        return False
    shorter, longer = (a_norm, b_norm) if len(a_norm) <= len(b_norm) else (b_norm, a_norm)
    return len(shorter) >= min_len and shorter in longer


@dataclass
class Registro:
    """Registro normalizado para exibição e comparação."""
    fornecedor: str
    valor: float
    data: str
    centro_custo: str
    departamento: str
    idx_orig: int = 0
    fornecedor_norm: str = ""
    centro_custo_norm: str = ""


@dataclass
class ResultadoMatchCentroCusto:
    """Resultado do matching entre referência e comparação (data + valor + centro de custo)."""
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
    """Converte DataFrame normalizado em lista de Registro com centro_custo_norm."""
    registros = []
    for i, row in df.iterrows():
        cc = str(row.get("centro_custo", "") or "")
        registros.append(Registro(
            fornecedor=str(row.get("fornecedor", "")),
            valor=float(row.get("valor", 0)),
            data=str(row.get("data_exib", "")),
            centro_custo=cc,
            departamento=str(row.get("departamento", "")),
            idx_orig=int(i),
            fornecedor_norm=str(row.get("fornecedor_norm", "")),
            centro_custo_norm=_normalizar_centro_custo(cc),
        ))
    return registros


def _encontrar_match_valor_data_centro(
    ref: Registro,
    candidatos: List[Tuple[int, Registro]],
    tolerancia: float = 0.01,
) -> Optional[int]:
    """
    Match por valor, data e centro de custo (flexível).
    Centro de custo: um contém o outro (ex: "SEGBRASIL RECIFE" ↔ "RECIFE").
    """
    for idx_comp, cand in candidatos:
        if abs(ref.valor - cand.valor) <= tolerancia and _centro_custo_match(
            ref.centro_custo_norm, cand.centro_custo_norm
        ):
            return idx_comp
    return None


def executar_matching_centro_custo(
    df_ref: pd.DataFrame,
    df_comp: pd.DataFrame,
    tolerancia_valor: float = 0.01,
) -> List[ResultadoMatchCentroCusto]:
    """
    Para cada registro da Referência, busca match na Comparação por valor + data + centro de custo.
    Centro de custo é comparado de forma normalizada (case-insensitive, trim).
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

    resultados: List[ResultadoMatchCentroCusto] = []
    comp_usados = set()

    for idx_ref, ref in enumerate(regs_ref):
        candidatos = [(i, r) for i, r in por_data.get(ref.data or "", []) if i not in comp_usados]

        idx_comp = _encontrar_match_valor_data_centro(ref, candidatos, tolerancia_valor)

        if idx_comp is None:
            resultados.append(ResultadoMatchCentroCusto(
                status="nao_encontrado",
                referencia=_registro_to_dict(ref),
                comparacao=None,
                score_nome=None,
                diferenca_valor=None,
                alerta="Nenhum match encontrado (data + valor + centro de custo)",
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

        score_nome = fuzz.ratio(ref.fornecedor_norm, comp.fornecedor_norm) / 100.0

        resultados.append(ResultadoMatchCentroCusto(
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
