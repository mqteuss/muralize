# Mural da Escola

Aplicativo web em Next.js para publicar e consultar eventos escolares como provas, reuniões, entregas e avisos importantes.

## Stack

- Next.js 15
- React 19
- Firebase Auth
- Firestore
- Tailwind CSS 4
- Motion
- Lucide React

## Funcionalidades

- Mural público de eventos.
- Login com Google para administração.
- Criação e exclusão de eventos apenas pelo e-mail admin configurado.
- Busca por título e descrição.
- Filtros por hoje, semana e mês.
- Notificações locais no navegador para eventos próximos.
- Layout responsivo com modal estilo bottom sheet no mobile.

## Configuração do admin

Por padrão, o administrador é:

```txt
mh.umateus@gmail.com
```

Para trocar no frontend, crie um arquivo `.env.local`:

```env
NEXT_PUBLIC_ADMIN_EMAIL=seu-email@gmail.com
```

Atenção: também troque o e-mail em `firestore.rules`, porque a proteção real fica nas regras do Firestore.

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

## Firestore

A coleção usada é:

```txt
events
```

Campos esperados:

```ts
title: string
description: string
date: Timestamp
authorId: string
createdAt: Timestamp
isPublic: boolean
```

As regras em `firestore.rules` permitem leitura pública apenas de eventos com `isPublic == true` e restringem escrita ao admin.

## Observação sobre notificações

As notificações atuais são locais do navegador. Elas funcionam melhor com o site aberto ou em segundo plano pelo navegador. Para notificações reais com app fechado, implemente Firebase Cloud Messaging com Service Worker.
