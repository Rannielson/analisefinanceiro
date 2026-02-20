"""
Cheques de divergência:
- Valor (já coberto no matching)
- Quantidade de lançamentos por dia
- Valor total do dia
- Informações faltantes (ex: centro de custo vazio)
"""
from dataclasses import dataclass, field
from typing import Any, List

import pandas as pd



@dataclass
class AlertaDiario:
    """Alerta sobre divergência por data."""
    data: str
    mensagem: str


@dataclass
class AlertaInfoFaltante:
    """Alerta sobre informação faltante em um registro."""
    referencia: dict
    alerta: str


def checar_info_faltante(df: pd.DataFrame, modelo: str) -> List[dict]:
    """
    Verifica registros com centro de custo vazio ou outros campos críticos faltantes.
    Retorna lista de dicts para inclusão em resultados.
    """
    alertas = []
    for i, row in df.iterrows():
        centro = str(row.get("centro_custo", "")).strip()
        fornecedor = str(row.get("fornecedor", ""))
        data_exib = str(row.get("data_exib", ""))
        valor = float(row.get("valor", 0))

        if not centro:
            alertas.append({
                "status": "info_faltante",
                "referencia": {
                    "fornecedor": fornecedor,
                    "valor": round(valor, 2),
                    "data": data_exib,
                    "centro_custo": "",
                    "departamento": str(row.get("departamento", "")),
                },
                "comparacao": None,
                "score_nome": None,
                "diferenca_valor": None,
                "alerta": "Centro de custo não preenchido",
            })
    return alertas


def checar_alertas_diarios(
    df_ref: pd.DataFrame,
    df_comp: pd.DataFrame,
) -> List[dict]:
    """
    Compara quantidade e total por data entre referência e comparação.
    Retorna lista de alertas diários.
    """
    def agrupar(df: pd.DataFrame) -> dict:
        out = {}
        for _, row in df.iterrows():
            d = str(row.get("data_exib", "")).strip()
            if not d:
                continue
            val = float(row.get("valor", 0))
            if d not in out:
                out[d] = (0, 0.0)
            cnt, total = out[d]
            out[d] = (cnt + 1, total + val)
        return out

    ref_por_data = agrupar(df_ref)
    comp_por_data = agrupar(df_comp)

    alertas = []
    todas_datas = set(ref_por_data.keys()) | set(comp_por_data.keys())

    for data in sorted(todas_datas):
        ref_cnt, ref_total = ref_por_data.get(data, (0, 0.0))
        comp_cnt, comp_total = comp_por_data.get(data, (0, 0.0))

        if ref_cnt != comp_cnt:
            alertas.append({
                "data": data,
                "mensagem": f"Quantidade divergente: Ref={ref_cnt}, Comp={comp_cnt}",
            })

        diff_total = abs(ref_total - comp_total)
        if diff_total > 0.01:  # Tolerância para total do dia
            ref_str = formatar_br(ref_total)
            comp_str = formatar_br(comp_total)
            alertas.append({
                "data": data,
                "mensagem": f"Total do dia divergente: Ref={ref_str} | Comp={comp_str}",
            })

    return alertas


def formatar_br(val: float) -> str:
    """Formata valor em padrão brasileiro (1.234,56)."""
    s = f"{val:,.2f}"
    return "R$ " + s.replace(",", "X").replace(".", ",").replace("X", ".")


def agrupar_por_data(
    df_ref: pd.DataFrame,
    df_comp: pd.DataFrame,
) -> List[dict]:
    """
    Agrupa totais por data para comparação Ref vs Comp.
    Retorna lista de dicts com data, qtd_ref, qtd_comp, total_ref, total_comp, divergente.
    """
    def agrupar(df: pd.DataFrame) -> dict:
        out = {}
        for _, row in df.iterrows():
            d = str(row.get("data_exib", "")).strip()
            if not d:
                continue
            val = float(row.get("valor", 0))
            if d not in out:
                out[d] = (0, 0.0)
            cnt, total = out[d]
            out[d] = (cnt + 1, total + val)
        return out

    ref_por_data = agrupar(df_ref)
    comp_por_data = agrupar(df_comp)
    todas_datas = sorted(set(ref_por_data.keys()) | set(comp_por_data.keys()))

    resultado = []
    for data in todas_datas:
        ref_cnt, ref_total = ref_por_data.get(data, (0, 0.0))
        comp_cnt, comp_total = comp_por_data.get(data, (0, 0.0))
        diff_qtd = ref_cnt != comp_cnt
        diff_total = abs(ref_total - comp_total) > 0.01
        divergente = diff_qtd or diff_total

        resultado.append({
            "data": data,
            "qtd_ref": ref_cnt,
            "qtd_comp": comp_cnt,
            "total_ref": round(ref_total, 2),
            "total_comp": round(comp_total, 2),
            "divergente": divergente,
        })
    return resultado

