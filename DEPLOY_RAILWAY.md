# Deploy no Railway

O projeto tem **backend (FastAPI)** e **frontend (Next.js)**. No Railway, crie **dois serviços** na mesma stack.

## 1. Backend

1. **New Project** → **Deploy from GitHub** (ou CLI)
2. Conecte o repositório e selecione o **Root Directory**: `backend`
3. Railway detecta Python e usa o Procfile
4. **Variables** (Settings → Variables):
   - `CORS_ORIGINS` = URL do frontend (ex: `https://seu-app.up.railway.app`)
5. Após o deploy, copie a URL pública do backend (ex: `https://backend-production-xxxx.up.railway.app`)

## 2. Frontend

1. **New Service** no mesmo projeto
2. **Deploy from GitHub** com **Root Directory**: `frontend`
3. Railway detecta Node.js e executa `npm run build` + `npm start`
4. **Variables** (Settings → Variables):
   - `NEXT_PUBLIC_API_URL` = URL do backend (ex: `https://backend-production-xxxx.up.railway.app`)
   - `NIXPACKS_NODE_VERSION` = `20` — obrigatório (Next.js 16 requer Node ≥ 20)
5. O frontend será publicado em uma URL própria (ex: `https://frontend-production-yyyy.up.railway.app`)

## 3. CORS

Atualize `CORS_ORIGINS` no backend com a URL exata do frontend (com `https://` e sem barra no final):

```
https://frontend-production-yyyy.up.railway.app
```

## 4. Resumo de variáveis

| Serviço  | Variável              | Valor                                   |
|----------|------------------------|-----------------------------------------|
| Backend  | `CORS_ORIGINS`         | URL do frontend                         |
| Frontend | `NEXT_PUBLIC_API_URL`  | URL do backend                          |

## 5. Alternativa: Railway CLI

```bash
# Instalar CLI: npm i -g @railway/cli
railway login

# Backend
cd backend
railway init
railway up

# Frontend (outro terminal)
cd frontend
railway init
railway up
```

Depois configure as variáveis no painel do Railway.
