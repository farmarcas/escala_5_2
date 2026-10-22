import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatPlainNumber, parseBrNumber } from '@/lib/formatPtBr';
import { describedBy, FieldShell } from './FieldShell';
import { fieldControlClass } from './fieldStyles';

type NumberFieldProps = {
  label: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  error?: string;
  className?: string;
};

const toText = (value: number | null) => (value === null ? '' : formatPlainNumber(value));

// Aceita o jeito brasileiro de digitar (1.234,56). Vazio devolve null para a validação explicar o erro.
export function NumberField({
  label,
  value,
  onValueChange,
  prefix,
  suffix,
  hint,
  error,
  className,
}: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(() => toText(value));
  const [lastValue, setLastValue] = useState(value);

  // Quando o valor muda por fora (ex.: "voltar ao padrão"), o texto acompanha.
  if (value !== lastValue) {
    setLastValue(value);
    if (parseBrNumber(text) !== value) setText(toText(value));
  }

  const handleChange = (raw: string) => {
    setText(raw);
    onValueChange(parseBrNumber(raw));
  };

  return (
    <FieldShell id={id} label={label} hint={hint} error={error} className={className}>
      <div className="relative flex items-center">
        {prefix ? (
          <span className="text-muted-foreground pointer-events-none absolute left-3 text-sm">
            {prefix}
          </span>
        ) : null}
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={() => setText(toText(parseBrNumber(text) ?? value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cn(fieldControlClass(Boolean(error)), prefix && 'pl-10', suffix && 'pr-10')}
        />
        {suffix ? (
          <span className="text-muted-foreground pointer-events-none absolute right-3 text-sm">
            {suffix}
          </span>
        ) : null}
      </div>
    </FieldShell>
  );
}
