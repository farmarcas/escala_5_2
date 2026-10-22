import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('bg-li-30 animate-pulse rounded-lg', className)} />;
}
