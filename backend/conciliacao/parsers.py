"""
Parsers para leitura e detecção de modelo de planilha.
Reconhece Modelo 1 (Referência) e Modelo 2 (Comparação) pelos cabeçalhos.
"""
from io import BytesIO

import pandas as pd
from typing import Literal, Optional

# Cabeçalhos esperados para cada modelo
MODELO1_COLS = {
    "FORNECEDOR/COLABORADOR",
    "DATA",
    "VALOR",
    "CENTRO DE CUSTO",
    "Departamento",
}

MODELO2_COLS = {
    "Fornecedor - nome",
    "Data pagamento",
    "Valor pagamento",
    "Centro custo",
}

# Variações de colunas (case-insensitive matching)
MODELO1_ALT = {
    "fornecedor/colaborador",
    "data",
    "valor",
    "centro de custo",
    "departamento",
}

MODELO2_ALT = {
    "fornecedor - nome",
    "data pagamento",
    "valor pagamento",
    "centro custo",
}


def _cols_present(df: pd.DataFrame, expected: set, expected_alt: set) -> int:
    """Conta quantas colunas esperadas existem no DataFrame (case-insensitive)."""
    cols_lower = {c.strip().lower(): c for c in df.columns if isinstance(c, str)}
    count = 0
    for alt in expected_alt:
        if alt in cols_lower:
            count += 1
    return count


def detectar_modelo(df: pd.DataFrame) -> Optional[Literal["modelo1", "modelo2"]]:
    """
    Verifica os cabeçalhos e retorna 'modelo1' ou 'modelo2'.
    Retorna None se não conseguir identificar.
    """
    if df is None or df.empty:
        return None

    c1 = _cols_present(df, MODELO1_COLS, MODELO1_ALT)
    c2 = _cols_present(df, MODELO2_COLS, MODELO2_ALT)

    # Precisa de pelo menos 3 colunas chave para cada modelo
    if c1 >= 3 and c1 >= c2:
        return "modelo1"
    if c2 >= 3 and c2 >= c1:
        return "modelo2"
    return None


def _find_col(df: pd.DataFrame, options: list) -> Optional[str]:
    """Encontra coluna por nome (case-insensitive)."""
    cols_lower = {c.strip().lower(): c for c in df.columns if isinstance(c, str)}
    for opt in options:
        if opt.lower() in cols_lower:
            return cols_lower[opt.lower()]
    return None


def ler_modelo1(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extrai e normaliza colunas do Modelo 1 para schema interno:
    fornecedor, data, valor, centro_custo, departamento
    """
    result = pd.DataFrame()

    col_fornecedor = _find_col(df, ["FORNECEDOR/COLABORADOR"])
    col_data = _find_col(df, ["DATA"])
    col_valor = _find_col(df, ["VALOR"])
    col_centro = _find_col(df, ["CENTRO DE CUSTO"])
    col_dept = _find_col(df, ["Departamento", "DEPARTAMENTO"])

    result["fornecedor"] = df[col_fornecedor].astype(str).fillna("") if col_fornecedor else ""
    result["data_raw"] = df[col_data].astype(str).fillna("") if col_data else ""
    result["valor_raw"] = df[col_valor] if col_valor else 0
    result["centro_custo"] = df[col_centro].astype(str).fillna("") if col_centro else ""
    result["departamento"] = df[col_dept].astype(str).fillna("") if col_dept else ""

    return result


def ler_modelo2(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extrai e normaliza colunas do Modelo 2 para schema interno:
    fornecedor, data, valor, centro_custo, departamento
    """
    result = pd.DataFrame()

    col_fornecedor = _find_col(df, ["Fornecedor - nome"])
    col_data = _find_col(df, ["Data pagamento"])
    col_valor = _find_col(df, ["Valor pagamento"])
    col_centro = _find_col(df, ["Centro custo", "Centro de custo"])
    col_desc = _find_col(df, ["Descrição", "Suboperação"])

    result["fornecedor"] = df[col_fornecedor].astype(str).fillna("") if col_fornecedor else ""
    result["data_raw"] = df[col_data].astype(str).fillna("") if col_data else ""
    result["valor_raw"] = df[col_valor] if col_valor else 0
    result["centro_custo"] = df[col_centro].astype(str).fillna("") if col_centro else ""
    result["departamento"] = df[col_desc].astype(str).fillna("") if col_desc else ""

    return result


def carregar_e_detectar(arquivo_bytes: bytes) -> tuple[pd.DataFrame, Optional[Literal["modelo1", "modelo2"]]]:
    """
    Carrega arquivo .xlsx e retorna (DataFrame normalizado, modelo detectado).
    """
    df = pd.read_excel(BytesIO(arquivo_bytes), engine="openpyxl")
    modelo = detectar_modelo(df)

    if modelo == "modelo1":
        parsed = ler_modelo1(df)
    elif modelo == "modelo2":
        parsed = ler_modelo2(df)
    else:
        raise ValueError("Não foi possível identificar o modelo da planilha. Verifique os cabeçalhos.")

    return parsed, modelo
