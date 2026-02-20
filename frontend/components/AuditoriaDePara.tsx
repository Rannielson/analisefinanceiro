"use client";

import { useState } from "react";
import type { PorData, ResultadoItem } from "@/app/types";
import type { FiltroStatus } from "./FiltrosResultado";

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

interface AuditoriaDeParaProps {
  porData: PorData[];
  filtro?: FiltroStatus;
}

function formatarValor(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function statusInfo(status: string) {
  switch (status) {
    case "ok":
      return { label: "OK", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200", icon: "✓" };
    case "divergente":
      return { label: "Divergente", color: "bg-amber-500/10 text-amber-700 border-amber-200", icon: "≠" };
    case "nao_encontrado":
      return { label: "Não encontrado", color: "bg-red-500/10 text-red-700 border-red-200", icon: "!" };
    case "info_faltante":
      return { label: "Info faltante", color: "bg-slate-500/10 text-slate-600 border-slate-200", icon: "○" };
    default:
      return { label: status, color: "bg-slate-100 text-slate-600", icon: "?" };
  }
}

function LinhaAuditoria({ r }: { r: ResultadoItem }) {
  const info = statusInfo(r.status);
  const isProblema = r.status === "nao_encontrado" || r.status === "divergente";

  return (
    <div
      className={`grid grid-cols-1 gap-3 border-b border-slate-100 py-3 last:border-0 sm:grid-cols-[1fr_auto_1fr] ${
        isProblema ? "bg-red-50/50 -mx-3 px-3 rounded-lg" : ""
      }`}
    >
      <div className="min-w-0 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-600/80">DE</p>
        <p className="mt-0.5 truncate font-medium text-slate-800">{r.referencia.fornecedor}</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-teal-700">{formatarValor(r.referencia.valor)}</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
              r.referencia.centro_custo?.trim()
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-amber-500/10 text-amber-600"
            }`}
            title={r.referencia.centro_custo?.trim() ? "Centro de custo preenchido" : "Centro de custo ausente"}
          >
            CC {r.referencia.centro_custo?.trim() ? "✓" : "—"}
          </span>
          {r.referencia.centro_custo?.trim() && (
            <span className="truncate text-xs text-slate-500">{r.referencia.centro_custo}</span>
          )}
        </div>
      </div>

      <div className="flex flex-row items-center justify-center gap-2 sm:flex-col sm:gap-1">
        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${info.color}`}>
          {info.icon} {info.label}
        </span>
        {r.score_nome != null && (
          <span className="text-[10px] text-slate-400">{Math.round(r.score_nome * 100)}%</span>
        )}
        {r.diferenca_valor != null && r.diferenca_valor > 0 && (
          <span className="text-[10px] font-medium text-amber-600">{formatarValor(r.diferenca_valor)}</span>
        )}
        {r.alerta && (
          <span className="max-w-[80px] truncate text-center text-[10px] text-amber-600" title={r.alerta}>
            {r.alerta}
          </span>
        )}
      </div>

      <div className={`min-w-0 rounded-lg border p-3 ${r.comparacao ? "border-slate-100 bg-blue-50/30" : "border-dashed border-slate-200 bg-slate-50/30"}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600/80">PARA</p>
        {r.comparacao ? (
          <>
            <p className="mt-0.5 truncate font-medium text-slate-800">{r.comparacao.fornecedor}</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-blue-700">{formatarValor(r.comparacao.valor)}</p>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                  r.comparacao.centro_custo?.trim()
                    ? "bg-emerald-500/10 text-emerald-700"
                    : "bg-amber-500/10 text-amber-600"
                }`}
                title={r.comparacao.centro_custo?.trim() ? "Centro de custo preenchido" : "Centro de custo ausente"}
              >
                CC {r.comparacao.centro_custo?.trim() ? "✓" : "—"}
              </span>
              {r.comparacao.centro_custo?.trim() && (
                <span className="truncate text-xs text-slate-500">{r.comparacao.centro_custo}</span>
              )}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm italic text-slate-400">— sem correspondência</p>
        )}
      </div>
    </div>
  );
}

export default function AuditoriaDePara({ porData, filtro = "todos" }: AuditoriaDeParaProps) {
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
    <section>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Auditoria DE → PARA</h2>
          <p className="mt-1 text-slate-600">Clique em uma data para ver o detalhamento dos lançamentos</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExpandido(new Set(porData.map((d) => d.data)))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Expandir todos
          </button>
          <button
            type="button"
            onClick={() => setExpandido(new Set())}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Recolher todos
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {(() => {
          const gruposFiltrados = porData
            .map((grupo) => ({
              ...grupo,
              resultadosFiltrados: grupo.resultados.filter((r) => aplicarFiltro(filtro, r)),
            }))
            .filter((g) => g.resultadosFiltrados.length > 0 || filtro === "todos");
          if (gruposFiltrados.length === 0) {
            return (
              <div className="rounded-xl border border-slate-200/80 bg-white px-6 py-12 text-center text-sm text-slate-500 shadow-[var(--shadow-sm)]">
                Nenhum resultado para o filtro selecionado
              </div>
            );
          }
          return gruposFiltrados.map((grupo) => {
          const aberto = expandido.has(grupo.data);
          const resultados = filtro === "todos" ? grupo.resultados : grupo.resultadosFiltrados;
          const problemas = resultados.filter(
            (r) => r.status === "divergente" || r.status === "nao_encontrado" || r.status === "info_faltante"
          );

          return (
            <div
              key={grupo.data}
              className={`overflow-hidden rounded-xl border shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)] ${
                grupo.divergente ? "border-amber-200 bg-amber-50/20" : "border-slate-200/80 bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(grupo.data)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold tabular-nums text-slate-800">{grupo.data}</span>
                  {grupo.divergente && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
                      Divergência
                    </span>
                  )}
                  {problemas.length > 0 && (
                    <span className="text-xs text-slate-500">
                      {problemas.length} {problemas.length === 1 ? "item" : "itens"} a revisar
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-8 text-sm tabular-nums">
                  <div className="text-left">
                    <p className="text-[10px] font-semibold uppercase text-teal-600/80">DE</p>
                    <p className="font-semibold text-teal-700">{formatarValor(grupo.total_ref)}</p>
                    <p className="text-xs text-slate-500">{grupo.qtd_ref} lanç.</p>
                  </div>
                  <div className="text-slate-300">→</div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold uppercase text-blue-600/80">PARA</p>
                    <p className="font-semibold text-blue-700">{formatarValor(grupo.total_comp)}</p>
                    <p className="text-xs text-slate-500">{grupo.qtd_comp} lanç.</p>
                  </div>
                  <span className={`ml-2 text-slate-400 transition-transform ${aberto ? "rotate-180" : ""}`}>▼</span>
                </div>
              </button>

              {aberto && resultados.length > 0 && (
                <div className="border-t border-slate-200/80 bg-white px-4 py-4">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Lançamentos
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {resultados.map((r, i) => (
                      <LinhaAuditoria key={i} r={r} />
                    ))}
                  </div>
                </div>
              )}

              {aberto && resultados.length === 0 && (
                <div className="border-t border-slate-200/80 px-4 py-8 text-center text-sm text-slate-500">
                  Nenhum lançamento para esta data
                </div>
              )}
            </div>
          );
          });
        })()}
      </div>
    </section>
  );
}
