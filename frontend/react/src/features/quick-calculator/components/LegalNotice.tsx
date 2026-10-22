import { LEGAL_NOTICE } from '@/lib/legalNotice';

export function LegalNotice() {
  return <p className="text-muted-foreground text-xs leading-relaxed">{LEGAL_NOTICE}</p>;
}
