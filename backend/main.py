"""
API FastAPI para conciliação financeira.
"""
import os
from io import BytesIO

from typing import Union

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from conciliacao.parsers import carregar_e_detectar
from conciliacao.normalizacao import aplicar_normalizacao
from conciliacao.matching import executar_matching, ResultadoMatch
from conciliacao.matching_centro_custo import executar_matching_centro_custo, ResultadoMatchCentroCusto
from conciliacao.cheques import checar_info_faltante, checar_alertas_diarios, agrupar_por_data
from schemas import RespostaConciliacaoSchema, ResumoSchema, ResultadoItemSchema, AlertaDiarioSchema, PorDataSchema, AnaliseSchema

app = FastAPI(title="API Conciliação Financeira")

_cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _resultado_to_dict(r: Union[ResultadoMatch, ResultadoMatchCentroCusto]) -> dict:
    return {
        "status": r.status,
        "referencia": r.referencia,
        "comparacao": r.comparacao,
        "score_nome": r.score_nome,
        "diferenca_valor": r.diferenca_valor,
        "alerta": r.alerta,
    }


@app.post("/conciliar", response_model=RespostaConciliacaoSchema)
async def conciliar(
    arquivo_referencia: UploadFile = File(...),
    arquivo_comparacao: UploadFile = File(...),
):
    """
    Recebe dois arquivos .xlsx (referência e comparação), processa em memória
    e retorna o resultado da conciliação.
    """
    if not arquivo_referencia.filename or not arquivo_referencia.filename.lower().endswith(".xlsx"):
        raise HTTPException(400, "arquivo_referencia deve ser um arquivo .xlsx")
    if not arquivo_comparacao.filename or not arquivo_comparacao.filename.lower().endswith(".xlsx"):
        raise HTTPException(400, "arquivo_comparacao deve ser um arquivo .xlsx")

    try:
        ref_bytes = await arquivo_referencia.read()
        comp_bytes = await arquivo_comparacao.read()
    except Exception as e:
        raise HTTPException(400, f"Erro ao ler arquivos: {e}")

    try:
        df_ref_raw, _ = carregar_e_detectar(ref_bytes)
        df_comp_raw, _ = carregar_e_detectar(comp_bytes)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, f"Erro ao processar planilhas: {e}")

    # Normalizar (usar ano da comparação se houver datas com ano)
    ano_ref = 2026  # default; poderia inferir da planilha de comparação
    df_ref = aplicar_normalizacao(df_ref_raw, ano_ref=ano_ref)
    df_comp = aplicar_normalizacao(df_comp_raw, ano_ref=ano_ref)

    # Matching (valor + data)
    resultados_match = executar_matching(df_ref, df_comp, tolerancia_valor=0.01)

    # Matching (valor + data + centro de custo)
    resultados_centro = executar_matching_centro_custo(df_ref, df_comp, tolerancia_valor=0.01)

    # Cheques adicionais
    alertas_info = checar_info_faltante(df_ref, "ref")
    alertas_diarios = checar_alertas_diarios(df_ref, df_comp)
    grupos_data = agrupar_por_data(df_ref, df_comp)

    # Montar lista de resultados (match + info_faltante)
    resultados: list[dict] = [_resultado_to_dict(r) for r in resultados_match]
    resultados.extend(alertas_info)

    # Resumo
    ok = sum(1 for r in resultados_match if r.status == "ok")
    div = sum(1 for r in resultados_match if r.status == "divergente")
    nao = sum(1 for r in resultados_match if r.status == "nao_encontrado")
    info = len(alertas_info)

    resumo = ResumoSchema(
        total_referencia=len(df_ref),
        total_comparacao=len(df_comp),
        matches_confirmados=ok,
        divergentes=div,
        nao_encontrados=nao,
        info_faltante=info,
        total_alertas_diarios=len(alertas_diarios),
    )

    # Vincular resultados a cada data
    por_data_map = {g["data"]: {**g, "resultados": []} for g in grupos_data}
    for r in resultados:
        data_ref = r.get("referencia", {}).get("data", "")
        if data_ref and data_ref in por_data_map:
            por_data_map[data_ref]["resultados"].append(r)

    por_data_list = [PorDataSchema(**v) for v in por_data_map.values()]

    # Montar analise_centro_custo
    resultados_centro_dict = [_resultado_to_dict(r) for r in resultados_centro]
    ok_cc = sum(1 for r in resultados_centro if r.status == "ok")
    div_cc = sum(1 for r in resultados_centro if r.status == "divergente")
    nao_cc = sum(1 for r in resultados_centro if r.status == "nao_encontrado")
    resumo_cc = ResumoSchema(
        total_referencia=len(df_ref),
        total_comparacao=len(df_comp),
        matches_confirmados=ok_cc,
        divergentes=div_cc,
        nao_encontrados=nao_cc,
        info_faltante=0,
        total_alertas_diarios=len(alertas_diarios),
    )
    por_data_map_cc = {g["data"]: {**g, "resultados": []} for g in grupos_data}
    for r in resultados_centro_dict:
        data_ref = r.get("referencia", {}).get("data", "")
        if data_ref and data_ref in por_data_map_cc:
            por_data_map_cc[data_ref]["resultados"].append(r)
    por_data_list_cc = [PorDataSchema(**v) for v in por_data_map_cc.values()]

    return RespostaConciliacaoSchema(
        resumo=resumo,
        resultados=resultados,
        alertas_diarios=[AlertaDiarioSchema(**a) for a in alertas_diarios],
        por_data=por_data_list,
        analise_centro_custo=AnaliseSchema(
            resumo=resumo_cc,
            resultados=resultados_centro_dict,
            por_data=por_data_list_cc,
        ),
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
