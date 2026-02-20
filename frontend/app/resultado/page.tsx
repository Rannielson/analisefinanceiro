"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { RespostaConciliacao } from "@/app/types";
import DashboardAnalitico from "@/components/DashboardAnalitico";
import AuditoriaDePara from "@/components/AuditoriaDePara";
import ExportarRelatorio from "@/components/ExportarRelatorio";
import FiltrosResultado, { type FiltroStatus } from "@/components/FiltrosResultado";
import TabelaConciliacao from "@/components/TabelaConciliacao";

type TipoAnalise = "valor_data" | "centro_custo";

export default function ResultadoPage() {
  const [data, setData] = useState<RespostaConciliacao | null>(null);
  const [tipoAnalise, setTipoAnalise] = useState<TipoAnalise>("valor_data");
  const [filtro, setFiltro] = useState<FiltroStatus>("apenas_divergentes");
  const [aba, setAba] = useState<"auditoria" | "lista">("auditoria");
  const [confirmados, setConfirmados] = useState<Set<number>>(new Set());

  useEffect(() => {
    const raw = sessionStorage.getItem("conciliacao_resultado");
    if (raw) {
      try {
        setData(JSON.parse(raw));
      } catch {
        setData(null);
      }
    }
  }, []);

  const handleConfirmarMatch = useCallback((idx: number) => {
    setConfirmados((prev) => new Set(prev).add(idx));
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50">
        <p className="text-slate-600">Nenhum resultado de conciliação encontrado</p>
        <Link
          href="/"
          className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
        >
          Nova conciliação
        </Link>
      </div>
    );
  }

  const { resumo, resultados, alertas_diarios, por_data, analise_centro_custo } = data;
  const analiseAtual =
    tipoAnalise === "centro_custo" && analise_centro_custo
      ? analise_centro_custo
      : { resumo, resultados, por_data: por_data ?? [] };
  const { resumo: resumoAtual, resultados: resultadosAtuais, por_data: porDataAtual } = analiseAtual;
  const porData = porDataAtual ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white shadow-[var(--shadow-sm)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-slate-900">Auditoria DE → PARA</h1>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-500">
                Conciliação
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">
              {resumo.total_referencia} DE · {resumo.total_comparacao} PARA
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportarRelatorio
              resultados={resultadosAtuais}
              resumo={resumoAtual}
              alertas_diarios={alertas_diarios}
              por_data={porData}
            />
            <Link
              href="/"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Nova conciliação
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex gap-1 rounded-lg bg-slate-200/80 p-1">
          <button
            type="button"
            onClick={() => setTipoAnalise("valor_data")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tipoAnalise === "valor_data"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Valor + Data
          </button>
          <button
            type="button"
            onClick={() => setTipoAnalise("centro_custo")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tipoAnalise === "centro_custo"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Data + Valor + Centro de Custo
          </button>
        </div>

        {porData.length > 0 && <DashboardAnalitico resumo={resumoAtual} porData={porData} />}

        <div className="mb-4">
          <FiltrosResultado
            filtro={filtro}
            onFiltroChange={setFiltro}
            counts={{
              total: resultadosAtuais.length,
              divergentes: resumoAtual.divergentes,
              nao_encontrados: resumoAtual.nao_encontrados,
              info_faltante: resumoAtual.info_faltante,
              ok: resumoAtual.matches_confirmados,
            }}
          />
        </div>

        <div className="mb-6 flex gap-1 rounded-lg bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => setAba("auditoria")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              aba === "auditoria"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Por data
          </button>
          <button
            type="button"
            onClick={() => setAba("lista")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              aba === "lista"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Lista completa
          </button>
        </div>

        {aba === "auditoria" ? (
          porData.length > 0 ? (
            <AuditoriaDePara porData={porData} filtro={filtro} />
          ) : (
            <div className="rounded-xl border border-slate-200/80 bg-white p-12 text-center text-slate-600 shadow-[var(--shadow-sm)]">
              Faça uma nova conciliação para ver a auditoria por data
            </div>
          )
        ) : (
          <TabelaConciliacao
            resultados={resultadosAtuais}
            filtro={filtro}
            onConfirmarMatch={handleConfirmarMatch}
          />
        )}
      </main>
    </div>
  );
}
