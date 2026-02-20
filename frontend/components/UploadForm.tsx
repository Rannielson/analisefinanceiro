"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UploadForm() {
  const router = useRouter();
  const [refFile, setRefFile] = useState<File | null>(null);
  const [compFile, setCompFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refFile || !compFile) {
      setError("Selecione os dois arquivos .xlsx");
      return;
    }
    if (!refFile.name.toLowerCase().endsWith(".xlsx") || !compFile.name.toLowerCase().endsWith(".xlsx")) {
      setError("Ambos os arquivos devem ser .xlsx");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("arquivo_referencia", refFile);
    formData.append("arquivo_comparacao", compFile);

    try {
      const res = await fetch(`${API_URL}/conciliar`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = Array.isArray(err.detail) ? err.detail[0]?.msg : err.detail;
        throw new Error(typeof msg === "string" ? msg : "Erro na conciliação");
      }

      const data = await res.json();
      sessionStorage.setItem("conciliacao_resultado", JSON.stringify(data));
      router.push("/resultado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-teal-600/80">
          Planilha DE (referência)
        </label>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setRefFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-teal-50 file:py-2 file:px-4 file:text-teal-700 file:hover:bg-teal-100"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-blue-600/80">
          Planilha PARA (comparação)
        </label>
        <input
          type="file"
          accept=".xlsx"
          onChange={(e) => setCompFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 file:py-2 file:px-4 file:text-blue-700 file:hover:bg-blue-100"
        />
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-teal-600 px-4 py-3 font-medium text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
      >
        {loading ? "Auditando..." : "Iniciar auditoria DE → PARA"}
      </button>
    </form>
  );
}
