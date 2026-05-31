'use client';

import { useMemo, useState } from 'react';
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Search, Smartphone, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { InstallPwaButton } from '@/components/pwa/InstallPwaButton';
import { BaseModal } from '@/components/ui/BaseModal';

interface Props {
  onFinish: () => void;
}

const steps = [
  {
    title: 'Bem-vindo ao Muralize',
    description: 'Acompanhe avisos, provas, entregas e eventos da escola em um só lugar, com visual simples e rápido.',
    icon: Sparkles,
  },
  {
    title: 'Tudo organizado por data',
    description: 'Veja o que está chegando, o que acontece hoje, eventos da semana e conteúdos finalizados.',
    icon: CalendarDays,
  },
  {
    title: 'Busque e filtre rápido',
    description: 'Use a busca e os filtros para encontrar provas, reuniões, avisos importantes, rascunhos e eventos fixados.',
    icon: Search,
  },
  {
    title: 'Receba lembretes',
    description: 'Ative as notificações quando quiser ser avisado sobre novidades e eventos importantes do mural.',
    icon: Bell,
  },
  {
    title: 'Instale como app',
    description: 'Adicione o Muralize à tela inicial para abrir mais rápido, com experiência parecida com aplicativo nativo.',
    icon: Smartphone,
  },
];

export function WelcomeOnboarding({ onFinish }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const currentStep = steps[stepIndex];
  const Icon = currentStep.icon;
  const isLastStep = stepIndex === steps.length - 1;

  const progress = useMemo(() => ((stepIndex + 1) / steps.length) * 100, [stepIndex]);

  function goNext() {
    if (isLastStep) {
      onFinish();
      return;
    }

    setStepIndex(index => Math.min(index + 1, steps.length - 1));
  }

  function goBack() {
    setStepIndex(index => Math.max(index - 1, 0));
  }

  return (
    <BaseModal onClose={onFinish}>
      <div className="flex min-h-[460px] flex-col">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/icons/icon-192x192.png"
              alt="Muralize"
              className="h-10 w-10 rounded-2xl border border-[var(--app-border)] bg-[#fefefe] shadow-sm"
            />
            <div>
              <p className="text-sm font-semibold text-[var(--app-text)]">Muralize</p>
              <p className="text-xs text-[var(--app-text-muted)]">Guia rápido</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFinish}
            className="rounded-full p-2 text-[var(--app-text-muted)] transition-colors hover:bg-[var(--app-surface-soft)]"
            aria-label="Fechar tutorial"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--app-surface-soft)]">
          <motion.div
            className="h-full rounded-full bg-[var(--app-primary)]"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          />
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center py-8 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--app-surface-soft)] text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)]">
                <Icon className="h-9 w-9" />
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                Passo {stepIndex + 1} de {steps.length}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--app-text)]">
                {currentStep.title}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-[var(--app-text-muted)]">
                {currentStep.description}
              </p>

              {isLastStep && (
                <div className="mx-auto mt-6 max-w-sm rounded-3xl border border-[var(--app-border-soft)] bg-[var(--app-surface-soft)] p-4 text-left">
                  <p className="mb-3 text-sm font-semibold text-[var(--app-text)]">Instalação do app</p>
                  <InstallPwaButton variant="row" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 -mx-6 border-t border-[var(--app-border-soft)] bg-[var(--app-surface)] px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:static sm:m-0 sm:border-t-0 sm:p-0">
          <div className="mb-4 flex justify-center gap-1.5">
            {steps.map((step, index) => (
              <button
                type="button"
                key={step.title}
                onClick={() => setStepIndex(index)}
                className={`h-2 rounded-full transition-all ${index === stepIndex ? 'w-7 bg-[var(--app-primary)]' : 'w-2 bg-[var(--app-border)]'}`}
                aria-label={`Ir para o passo ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={stepIndex === 0 ? onFinish : goBack}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--app-surface-soft)] px-4 py-3 text-sm font-medium text-[var(--app-text)] ring-1 ring-[var(--app-border-soft)] transition-colors hover:bg-[var(--app-surface-hover)]"
            >
              {stepIndex === 0 ? 'Agora não' : <><ChevronLeft className="h-4 w-4" /> Voltar</>}
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex flex-[1.25] items-center justify-center gap-2 rounded-full bg-[var(--app-primary)] px-4 py-3 text-sm font-medium text-[var(--app-primary-text)] transition-colors hover:bg-[var(--app-primary-hover)]"
            >
              {isLastStep ? 'Começar' : <>Próximo <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
