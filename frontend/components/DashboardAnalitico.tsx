"use client";

import { useState } from "react";
import type { PorData, Resumo } from "@/app/types";

interface DashboardAnaliticoProps {
  resumo: Resumo;
  porData: PorData[];
}

function formatarValor(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function DashboardAnalitico({ resumo, porData }: DashboardAnaliticoProps) {
  const totalDe = porData.reduce((s, d) => s + d.total_ref, 0);
  const totalPara = porData.reduce((s, d) => s + d.total_comp, 0);
  const datasComDivergencia = porData.filter((d) => d.divergente).length;
  const [ordenarPor, setOrdenarPor] = useState<"data" | "valor" | "divergente">("data");

  const porDataOrdenado = [...porData].sort((a, b) => {
    if (ordenarPor === "data") return 0;
    if (ordenarPor === "valor") {
      const maxA = Math.max(a.total_ref, a.total_comp);
      const maxB = Math.max(b.total_ref, b.total_comp);
      return maxB - maxA;
    }
    if (ordenarPor === "divergente") {
      if (a.divergente && !b.divergente) return -1;
      if (!a.divergente && b.divergente) return 1;
      return 0;
    }
    return 0;
  });

  return (
    <section className="mb-10">
      <div className="mb-6 flex items-baseline gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Resumo da Auditoria
        </h2>
        <span className="text-slate-300">DE → PARA</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">DE</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-teal-700">{formatarValor(totalDe)}</p>
          <p className="mt-1 text-xs text-slate-500">{resumo.total_referencia} lançamentos</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">PARA</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-blue-600">{formatarValor(totalPara)}</p>
          <p className="mt-1 text-xs text-slate-500">{resumo.total_comparacao} lançamentos</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Diferença</p>
          <p className={`mt-0.5 text-xl font-bold tabular-nums ${Math.abs(totalDe - totalPara) > 0.01 ? "text-amber-600" : "text-emerald-600"}`}>
            {formatarValor(Math.abs(totalDe - totalPara))}
          </p>
          <p className="mt-1 text-xs text-slate-500">{totalDe >= totalPara ? "DE ≥ PARA" : "PARA ≥ DE"}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Conciliados</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-600">{resumo.matches_confirmados}</p>
          <p className="mt-1 text-xs text-slate-500">OK</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Divergentes</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-amber-600">{resumo.divergentes}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Não encontrados</p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-red-600">{resumo.nao_encontrados}</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Total por Data</h3>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-500">Ordenar:</span>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
              {(["data", "valor", "divergente"] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setOrdenarPor(opt)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    ordenarPor === opt
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {opt === "data" ? "Data" : opt === "valor" ? "Valor" : "Divergentes"}
                </button>
              ))}
            </div>
            {datasComDivergencia > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                {datasComDivergencia} data{datasComDivergencia !== 1 ? "s" : ""} com divergência
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200/80 text-left text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-teal-600">Qtd DE</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-teal-600">Total DE</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-blue-600">Qtd PARA</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-blue-600">Total PARA</th>
                <th className="px-5 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-slate-500">Diferença</th>
                <th className="px-5 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {porDataOrdenado.map((d) => {
                const diff = Math.abs(d.total_ref - d.total_comp);
                const temDiff = diff > 0.01;
                return (
                  <tr
                    key={d.data}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      d.divergente ? "bg-amber-50/50" : ""
                    }`}
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-800">{d.data}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600">{d.qtd_ref}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-teal-700">
                      {formatarValor(d.total_ref)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums text-slate-600">{d.qtd_comp}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium text-blue-700">
                      {formatarValor(d.total_comp)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-5 py-3 text-right tabular-nums font-medium ${
                        temDiff ? "text-amber-600" : "text-slate-400"
                      }`}
                    >
                      {formatarValor(diff)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {d.divergente ? (
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          ≠
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-semibold">
                <td className="px-5 py-3 text-slate-800">Total</td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">{resumo.total_referencia}</td>
                <td className="px-5 py-3 text-right tabular-nums text-teal-700">{formatarValor(totalDe)}</td>
                <td className="px-5 py-3 text-right tabular-nums text-slate-600">{resumo.total_comparacao}</td>
                <td className="px-5 py-3 text-right tabular-nums text-blue-700">{formatarValor(totalPara)}</td>
                <td
                  className={`px-5 py-3 text-right tabular-nums ${
                    Math.abs(totalDe - totalPara) > 0.01 ? "text-amber-600" : "text-slate-500"
                  }`}
                >
                  {formatarValor(Math.abs(totalDe - totalPara))}
                </td>
                <td className="px-5 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
