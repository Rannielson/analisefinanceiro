"use client";

import { useState } from "react";
import type { PorData, ResultadoItem } from "@/app/types";

interface AgrupamentoPorDataProps {
  porData: PorData[];
}

function formatarValor(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function LinhaResultado({ r }: { r: ResultadoItem }) {
  const isDestacar = r.status === "nao_encontrado" || r.status === "divergente";
  return (
    <tr className={isDestacar ? "bg-red-50/50 border-l-4 border-red-400" : ""}>
      <td className="px-3 py-2">
        <span
          className={`inline-flex rounded px-2 py-0.5 text-xs ${
            r.status === "ok" ? "bg-emerald-100 text-emerald-800" :
            r.status === "divergente" ? "bg-amber-100 text-amber-800" :
            r.status === "nao_encontrado" ? "bg-red-100 text-red-800" :
            "bg-zinc-100 text-zinc-700"
          }`}
        >
          {r.status}
        </span>
      </td>
      <td className="px-3 py-2 text-sm">{r.referencia.fornecedor}</td>
      <td className="px-3 py-2 text-sm">{formatarValor(r.referencia.valor)}</td>
      <td className="px-3 py-2 text-sm">{r.comparacao?.fornecedor ?? "—"}</td>
      <td className="px-3 py-2 text-sm">{r.comparacao ? formatarValor(r.comparacao.valor) : "—"}</td>
      <td className="px-3 py-2 text-xs">{r.score_nome != null ? `${(r.score_nome * 100).toFixed(0)}%` : "—"}</td>
      <td className="px-3 py-2 text-xs text-amber-700">{r.alerta || "—"}</td>
    </tr>
  );
}

export default function AgrupamentoPorData({ porData }: AgrupamentoPorDataProps) {
  const [expandido, setExpandido] = useState<Set<string>>(new Set());

  const toggle = (data: string) => {
    setExpandido((prev) => {
      const next = new Set(prev);
      if (next.has(data)) next.delete(data);
      else next.add(data);
      return next;
    });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900">Comparação por Data</h2>
      <p className="text-sm text-zinc-600">
        Total de cada planilha por data. Expanda para ver as inconsistências do dia.
      </p>

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setExpandido(new Set(porData.map((d) => d.data)))}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Expandir todos
        </button>
        <button
          type="button"
          onClick={() => setExpandido(new Set())}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Recolher todos
        </button>
      </div>
      <div className="space-y-2">
        {porData.map((grupo) => {
          const aberto = expandido.has(grupo.data);
          const hasInconsistencias = grupo.resultados.some(
            (r) => r.status === "divergente" || r.status === "nao_encontrado" || r.status === "info_faltante"
          );
          return (
            <div
              key={grupo.data}
              className={`rounded-xl border overflow-hidden ${
                grupo.divergente ? "border-amber-300 bg-amber-50/30" : "border-zinc-200 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(grupo.data)}
                className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-zinc-50/50"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-zinc-900">{grupo.data}</span>
                  {grupo.divergente && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Divergente
                    </span>
                  )}
                  {hasInconsistencias && (
                    <span className="text-xs text-zinc-500">
                      {grupo.resultados.filter((r) => r.status !== "ok").length} inconsistências
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span>
                    <span className="text-zinc-500">Ref:</span> {formatarValor(grupo.total_ref)} ({grupo.qtd_ref})
                  </span>
                  <span>
                    <span className="text-zinc-500">Comp:</span> {formatarValor(grupo.total_comp)} ({grupo.qtd_comp})
                  </span>
                  <span className="text-zinc-400">{aberto ? "▼" : "▶"}</span>
                </div>
              </button>

              {aberto && grupo.resultados.length > 0 && (
                <div className="border-t border-zinc-200 bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-zinc-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-zinc-700">Status</th>
                          <th className="px-3 py-2 text-left font-medium text-zinc-700">Ref. Fornecedor</th>
                          <th className="px-3 py-2 text-left font-medium text-zinc-700">Ref. Valor</th>
                          <th className="px-3 py-2 text-left font-medium text-zinc-700">Comp. Fornecedor</th>
                          <th className="px-3 py-2 text-left font-medium text-zinc-700">Comp. Valor</th>
                          <th className="px-3 py-2 text-left font-medium text-zinc-700">Score</th>
                          <th className="px-3 py-2 text-left font-medium text-zinc-700">Alerta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.resultados.map((r, i) => (
                          <LinhaResultado key={i} r={r} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {aberto && grupo.resultados.length === 0 && (
                <div className="border-t border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500">
                  Nenhum lançamento detalhado para esta data.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
