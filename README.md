# Mural da Escola

Este é um projeto para listagem de eventos escolares (provas, reuniões, entregas, avisos importantes) usando Next.js 15, React 19, Firebase Auth, Firestore e Tailwind CSS. O sistema permite acesso público sem necessidade de login para visualizar os eventos, e acesso autenticado exclusivo para administradores criarem e deletarem os eventos.

## Configuração Local

1. Clone o projeto e instale as dependências:
```bash
npm install
```

2. Configure o seu arquivo `.env.local` na raiz com as variáveis do Firebase:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_ADMIN_EMAIL=admin@escola.com
```

3. Rode o projeto:
```bash
npm run dev
```

Abra `http://localhost:3000`.

## Deploy na Vercel

1. Envie este repositório para o GitHub.
2. Importe o projeto na Vercel.
3. Configure as variáveis de ambiente acima em **Project Settings > Environment Variables**.
4. Faça o deploy.

## Firebase

### Autenticação

Ative o provedor **Email/Password** no Firebase Authentication.

Crie o usuário administrador com o mesmo e-mail definido em:
```env
NEXT_PUBLIC_ADMIN_EMAIL=admin@escola.com
```

### Firestore

Crie um banco Firestore e publique as regras de segurança presentes em `firestore.rules`.

Coleção usada:
```txt
events
```

Campos principais:
- `title`
- `description`
- `date`
- `time`
- `type`
- `location`
- `createdAt`

## Scripts

```bash
npm run dev
npm run build
npm start
npm run lint
```

## Estrutura

```txt
app/
components/
hooks/
lib/
firestore.rules
firebase-blueprint.json
```

## Observações

- Visitantes conseguem ver, pesquisar e filtrar eventos.
- Apenas o admin autenticado consegue criar e excluir eventos.
- O app já possui suporte visual para avisos, provas, reuniões e entregas.
