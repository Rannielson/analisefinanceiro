"use client";

import { useState, useRef, useEffect } from "react";
import type { ResultadoItem, Resumo, AlertaDiario, PorData } from "@/app/types";
import { exportarExcel, exportarPDF, type TipoRelatorio } from "@/lib/exportar";

interface ExportarRelatorioProps {
  resultados: ResultadoItem[];
  resumo: Resumo;
  alertas_diarios: AlertaDiario[];
  por_data: PorData[];
}

export default function ExportarRelatorio({
  resultados,
  resumo,
  alertas_diarios,
  por_data,
}: ExportarRelatorioProps) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    if (aberto) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [aberto]);

  const handleExportar = (tipo: TipoRelatorio, formato: "pdf" | "excel") => {
    if (formato === "pdf") {
      exportarPDF(resultados, resumo, alertas_diarios, tipo, por_data);
    } else {
      exportarExcel(resultados, resumo, alertas_diarios, tipo, por_data);
    }
    setAberto(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Exportar
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
          <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Relatório</p>
          <div className="grid grid-cols-2 gap-1 px-2">
            <button
              type="button"
              onClick={() => handleExportar("divergentes", "pdf")}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="text-red-500">📄</span>
              Divergentes PDF
            </button>
            <button
              type="button"
              onClick={() => handleExportar("divergentes", "excel")}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="text-emerald-600">📊</span>
              Divergentes Excel
            </button>
            <button
              type="button"
              onClick={() => handleExportar("total", "pdf")}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="text-red-500">📄</span>
              Total PDF
            </button>
            <button
              type="button"
              onClick={() => handleExportar("total", "excel")}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <span className="text-emerald-600">📊</span>
              Total Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
