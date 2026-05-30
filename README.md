# Muralize

Aplicativo web em Next.js para publicar e consultar eventos escolares, como provas, reuniões, entregas e avisos importantes.

## Stack

- Next.js 16
- React 19
- Supabase Auth
- Supabase Postgres
- Supabase Realtime
- Tailwind CSS 4
- Motion
- Lucide React

## Funcionalidades

- Mural público de eventos.
- Login com Google via Supabase Auth.
- Criação e exclusão de eventos apenas pelo e-mail admin configurado.
- Busca por título e descrição.
- Filtros por hoje, semana e mês.
- Cards de resumo para eventos publicados, próximo aviso e nível de permissão.
- Aviso visual quando uma conta logada não é admin.
- Notificações locais no navegador para eventos próximos.
- Layout responsivo com modal estilo bottom sheet no mobile.

## Variáveis de ambiente

Crie no `.env.local` e também configure na Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
NEXT_PUBLIC_ADMIN_EMAIL=mh.umateus@gmail.com
```

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. Vá em `SQL Editor`.
3. Execute o arquivo `supabase/schema.sql`.
4. Vá em `Authentication > Providers` e ative Google.
5. Em `Authentication > URL Configuration`, configure:

```txt
Site URL: https://muralize.vercel.app
Redirect URLs:
https://muralize.vercel.app/**
http://localhost:3000/**
```

6. Em `Database > Replication`, habilite Realtime para a tabela `events` se quiser atualização instantânea entre dispositivos.

## Admin

O admin padrão é:

```txt
mh.umateus@gmail.com
```

Para trocar, altere `NEXT_PUBLIC_ADMIN_EMAIL` e também o e-mail nas policies do arquivo `supabase/schema.sql` antes de executar no Supabase.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Next.js no navegador.

## Build

```bash
npm run build
npm run start
```

## Deploy na Vercel

Configure as variáveis de ambiente na Vercel e faça redeploy. O projeto usa `vercel.json` para instalar dependências pelo npm público.
