# Correções aplicadas no Mural da Escola

## Build e dependências

- Atualizei o Next.js para a versão instalada mais recente no ambiente (`^16.2.6`).
- Adicionei `overrides.postcss` para resolver o alerta de vulnerabilidade do PostCSS usado indiretamente pelo Next.
- Removi `export const dynamic = 'force-dynamic'` do layout, porque o app pode ser prerenderizado como página estática e carregar dados pelo Firebase no cliente.
- Rodei `npx tsc --noEmit` com sucesso.
- Rodei `npm run build` com sucesso.
- Rodei `npm audit --omit=dev --audit-level=moderate` com 0 vulnerabilidades.

## Firestore

- As funções de validação das regras agora são usadas de verdade.
- Leitura pública limitada a documentos com `isPublic == true`.
- Escrita, edição e exclusão limitadas ao e-mail admin.
- Criação exige ID válido, título válido, data em timestamp, `authorId` do usuário autenticado e `isPublic == true`.
- Update impede troca de `authorId` e `createdAt`.

## UX e interface

- O mural agora é público: qualquer pessoa pode ver eventos.
- Login é usado apenas para administração.
- Botão de excluir aparece corretamente no mobile, sem depender de hover.
- Modal de criação virou bottom sheet no mobile e modal central no desktop.
- FAB respeita `safe-area-inset-bottom` em celulares.
- Adicionei estados de loading ao salvar, excluir e sair.
- Adicionei toasts de sucesso/erro.
- Adicionei `aria-label`, `role="dialog"` e `aria-modal` em pontos importantes.
- Busca usa `useDeferredValue`.
- Filtros e lista usam tipagem forte, sem `as any`.

## Notificações

- Removi a lógica frágil baseada em `diff === 60` e `diff === 1440`.
- Agora as notificações usam janelas de tempo, reduzindo risco de falhar por atraso do timer.
- Eventos já notificados são salvos em `localStorage` para evitar duplicação.
- As notificações continuam sendo locais do navegador. Para notificação real com app fechado, o próximo passo é Firebase Cloud Messaging + Service Worker.

## Organização

- Adicionei `lib/constants.ts` para centralizar e tipar o e-mail admin e filtros.
- Reescrevi o README removendo referências incorretas ao Gemini.
- Atualizei `metadata.json` para refletir o app real.
- Adicionei `.gitignore`.
