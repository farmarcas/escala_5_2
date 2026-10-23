import { useEffect, useRef, type ReactNode } from 'react';

type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

// Usa o <dialog> nativo: prende o foco, fecha com Escape e devolve o foco a quem abriu.
export function Modal({ isOpen, title, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="modal-title"
      className="bg-surface text-foreground border-border m-auto w-[min(32rem,calc(100vw-2rem))] rounded-lg border p-6 shadow-xl backdrop:bg-black/50"
    >
      <h2 id="modal-title" className="mb-4 text-lg font-semibold">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
