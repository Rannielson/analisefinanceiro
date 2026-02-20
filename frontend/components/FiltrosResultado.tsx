"use client";

export type FiltroStatus = "todos" | "apenas_divergentes" | "divergentes" | "nao_encontrados" | "info_faltante" | "ok";

interface FiltrosResultadoProps {
  filtro: FiltroStatus;
  onFiltroChange: (f: FiltroStatus) => void;
  counts: {
    total: number;
    divergentes: number;
    nao_encontrados: number;
    info_faltante: number;
    ok: number;
  };
}

export default function FiltrosResultado({ filtro, onFiltroChange, counts }: FiltrosResultadoProps) {
  const totalDivergentes = counts.divergentes + counts.nao_encontrados + counts.info_faltante;

  const chips: { value: FiltroStatus; label: string; count?: number }[] = [
    { value: "todos", label: "Todos", count: counts.total },
    { value: "apenas_divergentes", label: "Apenas divergentes", count: totalDivergentes },
    { value: "ok", label: "OK", count: counts.ok },
    { value: "divergentes", label: "Divergentes", count: counts.divergentes },
    { value: "nao_encontrados", label: "Não encontrados", count: counts.nao_encontrados },
    { value: "info_faltante", label: "Info faltante", count: counts.info_faltante },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map(({ value, label, count }) => (
        <button
          key={value}
          type="button"
          onClick={() => onFiltroChange(value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            filtro === value
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {label}
          {count !== undefined && <span className="ml-1.5 tabular-nums opacity-90">({count})</span>}
        </button>
      ))}
    </div>
  );
}
