'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  INSTITUTION_TYPES,
  INSTITUTION_TYPE_LABELS_HU,
} from '@/types';

/**
 * InstitutionFilter — search + type picker for the institution catalog.
 *
 * Stateless: the parent owns `value` and updates via `onChange`.  The
 * search field is debounced (300ms) so typing doesn't fire a query
 * per keystroke; the parent receives the settled string.
 */
export interface InstitutionFilterValue {
  q: string;
  type: string;
}

export interface InstitutionFilterProps {
  value: InstitutionFilterValue;
  onChange: (next: InstitutionFilterValue) => void;
  /** Total result count, rendered as a small label next to the filter. */
  resultCount?: number;
  className?: string;
}

const ALL_TYPES_VALUE = '__all__';

export function InstitutionFilter({ value, onChange, resultCount, className }: InstitutionFilterProps) {
  const [local, setLocal] = React.useState(value.q);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value → local input (e.g. when a reset clears the search).
  React.useEffect(() => {
    setLocal(value.q);
  }, [value.q]);

  const setQ = (next: string) => {
    setLocal(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange({ ...value, q: next });
    }, 300);
  };

  const setType = (next: string) => {
    onChange({ ...value, type: next === ALL_TYPES_VALUE ? '' : next });
  };

  const clear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLocal('');
    onChange({ q: '', type: '' });
  };

  const dirty = value.q !== '' || value.type !== '';

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div
      className={
        'flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-end' +
        (className ? ` ${className}` : '')
      }
      data-testid="institution-filter"
    >
      <div className="flex-1 space-y-1">
        <label htmlFor="inst-filter-q" className="text-xs font-medium text-muted-foreground">
          Keresés
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="inst-filter-q"
            type="search"
            placeholder="Név vagy cím…"
            value={local}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
            data-testid="institution-filter-q"
          />
        </div>
      </div>
      <div className="space-y-1 sm:w-56">
        <label htmlFor="inst-filter-type" className="text-xs font-medium text-muted-foreground">
          Típus
        </label>
        <Select value={value.type || ALL_TYPES_VALUE} onValueChange={setType}>
          <SelectTrigger id="inst-filter-type" data-testid="institution-filter-type">
            <SelectValue placeholder="Összes típus" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TYPES_VALUE}>Összes típus</SelectItem>
            {INSTITUTION_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {INSTITUTION_TYPE_LABELS_HU[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {typeof resultCount === 'number' ? (
        <span className="self-center text-xs text-muted-foreground sm:self-end sm:pb-2" data-testid="institution-filter-count">
          {resultCount} találat
        </span>
      ) : null}
      {dirty ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={clear}
          data-testid="institution-filter-clear"
        >
          <X className="size-3" aria-hidden /> Törlés
        </Button>
      ) : null}
    </div>
  );
}