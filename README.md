# Conciliação Financeira

Aplicação híbrida para conciliação de planilhas financeiras: backend em Python (FastAPI) e frontend em Next.js.

## Estrutura

- **backend/** – API FastAPI com motor de conciliação (Pandas, RapidFuzz)
- **frontend/** – Interface Next.js para upload e visualização dos resultados

## Modelos de Planilha Suportados

### Modelo 1 (Referência)
- FORNECEDOR/COLABORADOR
- DATA (DD/MM)
- VALOR (R$ 1.178,93)
- CENTRO DE CUSTO
- Departamento

### Modelo 2 (Comparação)
- Fornecedor - nome
- Data pagamento (DD/MM/YYYY)
- Valor pagamento
- Centro custo
- Descrição / Suboperação

## Requisitos

- Python 3.11+
- Node.js 18+
- npm

## Instalação

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Execução

### 1. Backend (porta 8000)

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend (porta 3000)

```bash
cd frontend
npm run dev
```

### 3. Acesso

- Frontend: http://localhost:3000
- API: http://localhost:8000
- Docs da API: http://localhost:8000/docs

## Uso

1. Acesse http://localhost:3000
2. Faça upload da planilha de **Referência** (.xlsx)
3. Faça upload da planilha de **Comparação** (.xlsx)
4. Clique em **Conciliar**
5. Visualize o resultado lado a lado, com filtros e alertas diários

## Funcionalidades

- **Matching por similaridade:** RapidFuzz compara nomes de fornecedores (ex: "Barbosa Comércio" vs "Barbosa LTDA")
- **Divergências de valor:** destaque quando valores não batem
- **Quantidade e total do dia:** alerta se o número de lançamentos ou o total diário divergir
- **Info faltante:** alerta quando o centro de custo está vazio
