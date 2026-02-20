import UploadForm from "@/components/UploadForm";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <h1 className="text-lg font-semibold text-slate-900">Auditoria DE → PARA</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Conciliação financeira: compare planilhas e identifique divergências
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Upload</h2>
            <p className="mt-1 text-slate-700">
              Selecione a planilha <strong>DE</strong> (referência) e a planilha <strong>PARA</strong> (comparação)
            </p>
          </div>
          <UploadForm />
        </div>
      </main>
    </div>
  );
}
