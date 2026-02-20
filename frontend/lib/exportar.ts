import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ResultadoItem, Resumo, AlertaDiario, PorData } from "@/app/types";

const STATUS_LABEL: Record<string, string> = {
  ok: "OK",
  divergente: "Divergente",
  nao_encontrado: "Não encontrado",
  info_faltante: "Info faltante",
};

function formatarValor(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v);
}

function resultadoParaLinha(r: ResultadoItem) {
  return {
    Status: STATUS_LABEL[r.status] ?? r.status,
    Data: r.referencia.data,
    "Fornecedor DE": r.referencia.fornecedor,
    "Valor DE": r.referencia.valor,
    "Centro Custo DE": r.referencia.centro_custo || "",
    "Fornecedor PARA": r.comparacao?.fornecedor ?? "",
    "Valor PARA": r.comparacao?.valor ?? "",
    "Centro Custo PARA": r.comparacao?.centro_custo ?? "",
    Score: r.score_nome != null ? `${Math.round(r.score_nome * 100)}%` : "",
    "Diferença": r.diferenca_valor ?? "",
    Alerta: r.alerta || "",
  };
}

export type TipoRelatorio = "divergentes" | "total";

function filtrarResultados(resultados: ResultadoItem[], tipo: TipoRelatorio): ResultadoItem[] {
  if (tipo === "divergentes") {
    return resultados.filter(
      (r) => r.status === "divergente" || r.status === "nao_encontrado" || r.status === "info_faltante"
    );
  }
  return resultados;
}

export function exportarExcel(
  resultados: ResultadoItem[],
  resumo: Resumo,
  alertas_diarios: AlertaDiario[],
  tipo: TipoRelatorio,
  porData: PorData[]
) {
  const items = filtrarResultados(resultados, tipo);
  const linhas = items.map(resultadoParaLinha);

  const wb = XLSX.utils.book_new();

  // Aba: Resumo
  const resumoData = [
    ["Relatório de Conciliação DE - PARA"],
    [],
    ["Resumo", ""],
    ["Total DE", resumo.total_referencia],
    ["Total PARA", resumo.total_comparacao],
    ["Matches OK", resumo.matches_confirmados],
    ["Divergentes", resumo.divergentes],
    ["Não encontrados", resumo.nao_encontrados],
    ["Info faltante", resumo.info_faltante],
  ];
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  // Aba: Dados
  const cabecalho: string[] = linhas.length > 0
    ? Object.keys(linhas[0])
    : ["Status", "Data", "Fornecedor DE", "Valor DE", "Centro Custo DE", "Fornecedor PARA", "Valor PARA", "Centro Custo PARA", "Score", "Diferença", "Alerta"];
  const dados = [cabecalho, ...linhas.map((l) => Object.values(l))];
  const wsDados = XLSX.utils.aoa_to_sheet(dados);
  XLSX.utils.book_append_sheet(wb, wsDados, tipo === "divergentes" ? "Divergentes" : "Todos");

  // Aba: Alertas
  if (alertas_diarios.length > 0) {
    const alertasAoa = [["Data", "Mensagem"], ...alertas_diarios.map((a) => [a.data, a.mensagem])];
    const wsAlertas = XLSX.utils.aoa_to_sheet(alertasAoa);
    XLSX.utils.book_append_sheet(wb, wsAlertas, "Alertas");
  }

  // Aba: Por data
  if (porData.length > 0) {
    const porDataAoa = [
      ["Data", "Qtd DE", "Qtd PARA", "Total DE", "Total PARA", "Divergente"],
      ...porData.map((g) => [
        g.data,
        g.qtd_ref,
        g.qtd_comp,
        g.total_ref,
        g.total_comp,
        g.divergente ? "Sim" : "Não",
      ]),
    ];
    const wsPorData = XLSX.utils.aoa_to_sheet(porDataAoa);
    XLSX.utils.book_append_sheet(wb, wsPorData, "Por data");
  }

  const nome = `conciliao_${tipo}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, nome);
}

export function exportarPDF(
  resultados: ResultadoItem[],
  resumo: Resumo,
  alertas_diarios: AlertaDiario[],
  tipo: TipoRelatorio,
  porData: PorData[]
) {
  const items = filtrarResultados(resultados, tipo);
  const linhas = items.map(resultadoParaLinha);

  const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
  let y = 15;

  doc.setFontSize(14);
  doc.text("Relatório de Conciliação DE - PARA", 14, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(
    `Resumo: ${resumo.total_referencia} DE | ${resumo.total_comparacao} PARA | OK: ${resumo.matches_confirmados} | Divergentes: ${resumo.divergentes} | Não encontrados: ${resumo.nao_encontrados}`,
    14,
    y
  );
  y += 8;

  if (tipo === "divergentes") {
    doc.text(`Relatório: Apenas divergentes (${items.length} itens)`, 14, y);
  } else {
    doc.text(`Relatório: Total (${items.length} itens)`, 14, y);
  }
  y += 12;

  const headers = ["Status", "Data", "Fornecedor DE", "Valor DE", "Fornecedor PARA", "Valor PARA", "Alerta"];
  const body = linhas.map((l) => [
    l.Status,
    l.Data,
    String(l["Fornecedor DE"] ?? ""),
    typeof l["Valor DE"] === "number" ? formatarValor(l["Valor DE"]) : String(l["Valor DE"] ?? "—"),
    String(l["Fornecedor PARA"] ?? ""),
    l["Valor PARA"]
      ? typeof l["Valor PARA"] === "number"
        ? formatarValor(l["Valor PARA"])
        : String(l["Valor PARA"])
      : "—",
    String(l.Alerta ?? "").trim() || "—",
  ]);

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const tableWidth = pageWidth - margin * 2;
  const colWidths = [
    tableWidth * 0.11,  // Status
    tableWidth * 0.09,  // Data
    tableWidth * 0.20,  // Fornecedor DE
    tableWidth * 0.11,  // Valor DE
    tableWidth * 0.20,  // Fornecedor PARA
    tableWidth * 0.11,  // Valor PARA
    tableWidth * 0.18,  // Alerta (mais espaço para mensagens completas)
  ];

  autoTable(doc, {
    head: [headers],
    body,
    startY: y,
    theme: "grid",
    styles: { fontSize: 8, overflow: "linebreak", cellPadding: 2 },
    columnStyles: Object.fromEntries(
      headers.map((_, i) => [i, { cellWidth: colWidths[i], overflow: "linebreak" }])
    ),
    headStyles: { fillColor: [20, 128, 120] },
    margin: { left: margin },
  });

  const docWithTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  y = (docWithTable.lastAutoTable?.finalY ?? y) + 10;

  if (alertas_diarios.length > 0 && y < 250) {
    doc.setFontSize(11);
    doc.text("Alertas por data", 14, y);
    y += 6;
    const alertasTableWidth = doc.internal.pageSize.getWidth() - margin * 2;
    autoTable(doc, {
      head: [["Data", "Mensagem"]],
      body: alertas_diarios.map((a) => [a.data, a.mensagem]),
      startY: y,
      theme: "grid",
      styles: { fontSize: 8, overflow: "linebreak", cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: alertasTableWidth * 0.15, overflow: "linebreak" },
        1: { cellWidth: alertasTableWidth * 0.85, overflow: "linebreak" },
      },
      headStyles: { fillColor: [251, 191, 36] },
      margin: { left: margin },
    });
  }

  const nome = `conciliao_${tipo}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(nome);
}
