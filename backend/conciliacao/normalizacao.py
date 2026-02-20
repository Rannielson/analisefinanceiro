"""
Normalização de dados: Data, Valor e Nome.
Unifica formatos dos dois modelos de planilha.
"""
import re
from datetime import date, datetime
from typing import Any, Optional, Tuple

import pandas as pd

# Sufixos corporativos para remover no matching (opcional)
SUFIXOS_CORPORATIVOS = re.compile(
    r'\b(ltda|me|eireli|epp|s\.?a\.?|s\.?a\.?e\.?|s\/s)\b',
    re.IGNORECASE
)

# Tolerância para diferença de valor (em reais)
TOLERANCIA_VALOR = 0.01


def normalizar_valor(val: Any) -> float:
    """
    Converte valor para float.
    Aceita: R$ 1.178,93 / 1178.93 / "460.00" / 460
    """
    if pd.isna(val):
        return 0.0
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    if not s:
        return 0.0
    # Remove R$, espaços e formatação
    s = re.sub(r'R\$\s*', '', s, flags=re.IGNORECASE)
    s = s.replace('.', '').replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return 0.0


def normalizar_data(val: Any, ano_ref: Optional[int] = None) -> Tuple[Optional[date], str]:
    """
    Converte data para date e string DD/MM (para exibição).
    Entrada: DD/MM, DD/MM/YYYY, ou datetime.
    ano_ref: ano a usar quando só tem DD/MM (default: ano atual)
    Retorna: (date, "DD/MM")
    """
    if ano_ref is None:
        ano_ref = date.today().year

    if pd.isna(val):
        return None, ""

    if isinstance(val, (date, datetime)):
        return val if isinstance(val, date) else val.date(), val.strftime("%d/%m")

    s = str(val).strip()
    if not s:
        return None, ""

    # DD/MM/YYYY
    m = re.match(r'^(\d{1,2})/(\d{1,2})/(\d{4})$', s)
    if m:
        d, mo, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            dt = date(y, mo, d)
            return dt, dt.strftime("%d/%m")
        except ValueError:
            return None, s

    # DD/MM
    m = re.match(r'^(\d{1,2})/(\d{1,2})$', s)
    if m:
        d, mo = int(m.group(1)), int(m.group(2))
        try:
            dt = date(ano_ref, mo, d)
            return dt, dt.strftime("%d/%m")
        except ValueError:
            return None, s

    # YYYY-MM-DD (Excel/pandas)
    m = re.match(r'^(\d{4})-(\d{1,2})-(\d{1,2})', s)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        try:
            dt = date(y, mo, d)
            return dt, dt.strftime("%d/%m")
        except ValueError:
            return None, s

    return None, s


def normalizar_nome(nome: str, remover_sufixos: bool = True) -> str:
    """
    Limpa e normaliza nome para comparação.
    - Lowercase, strip, normaliza espaços
    - Opcionalmente remove LTDA, ME, EIRELI etc.
    """
    if not nome or pd.isna(nome):
        return ""
    s = str(nome).strip().lower()
    s = re.sub(r'\s+', ' ', s)
    if remover_sufixos:
        s = SUFIXOS_CORPORATIVOS.sub('', s)
        s = re.sub(r'\s+', ' ', s).strip()
    return s


def aplicar_normalizacao(df: pd.DataFrame, ano_ref: Optional[int] = None) -> pd.DataFrame:
    """
    Aplica normalização em um DataFrame já parseado (com fornecedor, data_raw, valor_raw, centro_custo, departamento).
    Adiciona colunas: data (date), data_exib, valor (float), fornecedor_norm.
    """
    out = df.copy()

    out["valor"] = out.get("valor_raw", pd.Series([0.0] * len(out))).apply(normalizar_valor)

    dates = out.get("data_raw", pd.Series([""] * len(out))).apply(
        lambda x: normalizar_data(x, ano_ref)
    )
    out["data"] = dates.apply(lambda t: t[0])
    out["data_exib"] = dates.apply(lambda t: t[1])

    out["fornecedor_norm"] = out.get("fornecedor", pd.Series([""] * len(out))).apply(normalizar_nome)

    if "centro_custo" not in out.columns:
        out["centro_custo"] = ""
    out["centro_custo"] = out["centro_custo"].astype(str).fillna("")

    if "departamento" not in out.columns:
        out["departamento"] = ""
    out["departamento"] = out["departamento"].astype(str).fillna("")

    return out
