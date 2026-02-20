"use client";

import type { ResultadoItem } from "@/app/types";
import type { FiltroStatus } from "./FiltrosResultado";

interface TabelaConciliacaoProps {
  resultados: ResultadoItem[];
  filtro: FiltroStatus;
  onConfirmarMatch?: (idx: number) => void;
}

function formatarValor(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

const STATUS_DIVERGENTES = ["divergente", "nao_encontrado", "info_faltante"];
const MAP_FILTRO_STATUS: Record<string, string> = {
  divergentes: "divergente",
  nao_encontrados: "nao_encontrado",
};

function aplicarFiltro(filtro: FiltroStatus, r: ResultadoItem): boolean {
  if (filtro === "todos") return true;
  if (filtro === "apenas_divergentes") return STATUS_DIVERGENTES.includes(r.status);
  const status = MAP_FILTRO_STATUS[filtro] ?? filtro;
  return r.status === status;
}

export default function TabelaConciliacao({
  resultados,
  filtro,
  onConfirmarMatch,
}: TabelaConciliacaoProps) {
  const comIndice = resultados.map((r, idx) => ({ r, idx }));
  const filtrados = comIndice.filter(({ r }) => aplicarFiltro(filtro, r));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-[var(--shadow-sm)]">
      <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
        <thead>
          <tr className="bg-slate-50/80">
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-teal-600">DE</th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-blue-600">PARA</th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Score</th>
            <th className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Alerta</th>
            {onConfirmarMatch && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {filtrados.map(({ r, idx: origIdx }) => {
            const isProblema = r.status === "nao_encontrado" || r.status === "divergente";
            return (
              <tr
                key={origIdx}
                className={isProblema ? "bg-red-50/50" : "hover:bg-slate-50/50"}
              >
                <td className="border-l-4 border-transparent px-4 py-3 align-top" style={isProblema ? { borderLeftColor: "var(--falta-color)" } : undefined}>
                  <span
                    className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      r.status === "ok" ? "bg-emerald-500/10 text-emerald-700" :
                      r.status === "divergente" ? "bg-amber-500/10 text-amber-700" :
                      r.status === "nao_encontrado" ? "bg-red-500/10 text-red-700" :
                      "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.status === "ok" ? "OK" : r.status === "divergente" ? "≠" : r.status === "nao_encontrado" ? "!" : r.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-2">
                    <p className="font-medium text-slate-800">{r.referencia.fornecedor}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-teal-700">{formatarValor(r.referencia.valor)}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          r.referencia.centro_custo?.trim()
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                        title={r.referencia.centro_custo?.trim() ? "Centro de custo preenchido" : "Centro de custo ausente"}
                      >
                        CC {r.referencia.centro_custo?.trim() ? "✓" : "—"}
                      </span>
                      {r.referencia.centro_custo?.trim() && (
                        <span className="text-xs text-slate-500">{r.referencia.centro_custo}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {r.comparacao ? (
                    <div className="rounded-lg border border-slate-100 bg-blue-50/30 p-2">
                      <p className="font-medium text-slate-800">{r.comparacao.fornecedor}</p>
                      <p className="mt-0.5 text-xs tabular-nums text-blue-700">{formatarValor(r.comparacao.valor)}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            r.comparacao.centro_custo?.trim()
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                          title={r.comparacao.centro_custo?.trim() ? "Centro de custo preenchido" : "Centro de custo ausente"}
                        >
                          CC {r.comparacao.centro_custo?.trim() ? "✓" : "—"}
                        </span>
                        {r.comparacao.centro_custo?.trim() && (
                          <span className="text-xs text-slate-500">{r.comparacao.centro_custo}</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/30 px-2 py-3 text-xs italic text-slate-400">
                      — sem correspondência
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.score_nome != null ? (
                    <span className="tabular-nums">{(r.score_nome * 100).toFixed(0)}%</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3 max-w-[180px]">
                  {r.alerta ? (
                    <span className="text-xs text-amber-600">{r.alerta}</span>
                  ) : r.diferenca_valor != null ? (
                    <span className="text-xs font-medium text-amber-600">{formatarValor(r.diferenca_valor)}</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                {onConfirmarMatch && r.status !== "ok" && r.comparacao && (
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => onConfirmarMatch(origIdx)}
                      className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-500/20"
                    >
                      Confirmar
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {filtrados.length === 0 && (
        <div className="px-4 py-12 text-center text-sm text-slate-500">
          Nenhum resultado para o filtro selecionado
        </div>
      )}
    </div>
  );
}
