'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { PROBLEM_CATEGORIES, PROBLEM_CATEGORY_LABELS_HU, PROBLEM_TITLE_MAX_LENGTH } from '@/types';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCreateProblem } from '@/lib/api/queries/problems';
import { useInstitutions } from '@/lib/api/queries/institutions';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth-context';
import { USE_API, SUPABASE_CONFIGURED } from '@/lib/env';
import { toast } from '@/components/ui/toaster';

/**
 * ProblemForm — wraps react-hook-form + Zod for new-pin submission.
 *
 *  - Title (3..200 chars), description (>=10), category (enum), location
 *    (either from URL ?lat=&lng= on /submit, or from the browser geolocation
 *    fallback), optional institution (autocomplete fetching from Supabase).
 *
 *  On success we invalidate the [`problems`] query keys and push the
 *  user to the freshly-created detail page.
 */

const submitSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'A cím legalább 3 karakter')
    .max(PROBLEM_TITLE_MAX_LENGTH, `A cím maximum ${PROBLEM_TITLE_MAX_LENGTH} karakter`),
  description: z.string().trim().min(10, 'Adj meg legalább 10 karakter leírást').max(5000, 'Maximum 5000 karakter'),
  category: z.enum(PROBLEM_CATEGORIES),
  institutionId: z.string().optional(),
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
});

export type SubmitFormValues = z.infer<typeof submitSchema>;

export interface ProblemFormProps {
  initialLocation?: { latitude: number; longitude: number };
}

export function ProblemForm({ initialLocation }: ProblemFormProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const fallback = { latitude: 47.9025, longitude: 20.3772 }; // Eger centre

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubmitFormValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'infrastructure',
      institutionId: undefined,
      latitude: initialLocation?.latitude ?? fallback.latitude,
      longitude: initialLocation?.longitude ?? fallback.longitude,
    },
  });

  const lat = watch('latitude');
  const lng = watch('longitude');

  const institutionsQuery = useInstitutions({});
  const [institutionQuery, setInstitutionQuery] = React.useState('');

  const submission = useCreateProblem();

  const onSubmit = (values: SubmitFormValues) => {
    if (USE_API && !isAuthenticated) {
      toast({
        title: 'A bejelentéshez jelentkezz be.',
        variant: 'warning',
      });
      router.push(`/login?next=${encodeURIComponent('/submit')}`);
      return;
    }
    submission.mutate(
      {
        title: values.title,
        description: values.description,
        category: values.category,
        institutionId: values.institutionId || null,
        latitude: values.latitude,
        longitude: values.longitude,
      },
      {
        onSuccess: (data: { id: string }) => {
          toast.success('Bejelentésed rögzítettük.');
          router.push(`/problems/${data.id}`);
        },
        onError: (err: unknown) => {
          if (err instanceof ApiError && err.status === 401) {
            toast({
              title: 'A bejelentéshez jelentkezz be.',
              variant: 'warning',
            });
            router.push(`/login?next=${encodeURIComponent('/submit')}`);
            return;
          }
          toast({
            title: 'Nem sikerült elküldeni a bejelentést.',
            description: err instanceof Error ? err.message : undefined,
            variant: 'destructive',
          });
        },
      },
    );
  };

  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4"
      onSubmit={handleSubmit(onSubmit)}
      data-testid="submit-form"
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Új bejelentés</h1>
        <p className="text-sm text-muted-foreground">
          Röviden írd le, hol és mi a gond. Minél több részlet, annál gyorsabban tudunk cselekedni.
        </p>
      </header>

      {!SUPABASE_CONFIGURED ? (
        <div className="rounded-md border border-warning-200 bg-warning-50 p-3 text-sm text-warning-900">
          <strong>Demo mód:</strong> a Supabase nincs bekötve (hiányzik a <code>.env</code>). A submit gomb nem fog működni, de a validáció igen.
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Cím *</Label>
        <Input
          id="title"
          placeholder="Pl.: Kátyú a Kossuth utcán a 12-es ház előtt"
          {...register('title')}
          invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
          data-testid="submit-title"
        />
        {errors.title ? <p id="title-error" className="text-xs text-destructive">{errors.title.message}</p> : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Leírás *</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder="Mi történt, mióta áll fenn, bármi ami segíthet…"
          {...register('description')}
          invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'description-error' : undefined}
          data-testid="submit-description"
        />
        {errors.description ? <p id="description-error" className="text-xs text-destructive">{errors.description.message}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category">Kategória *</Label>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="category" data-testid="submit-category-trigger">
                  <SelectValue placeholder="Válassz kategóriát" />
                </SelectTrigger>
                <SelectContent>
                  {PROBLEM_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {PROBLEM_CATEGORY_LABELS_HU[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.category ? <p className="text-xs text-destructive">{errors.category.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="institution">Érintett intézmény (opcionális)</Label>
          <Input
            id="institution"
            placeholder="Pl.: Egri iskola, városháza…"
            list="institutions"
            onChange={(e) => {
              setInstitutionQuery(e.target.value);
              setValue('institutionId', undefined);
            }}
            data-testid="submit-institution"
          />
          <datalist id="institutions">
            {(institutionsQuery.data ?? [])
              .filter((i) => !institutionQuery || i.name.toLowerCase().includes(institutionQuery.toLowerCase()))
              .slice(0, 12)
              .map((i) => (
                <option key={i.id} value={i.name} data-id={i.id}>
                  {i.name}
                </option>
              ))}
          </datalist>
        </div>
      </div>

      <div className="rounded-md border border-dashed border-border bg-muted-50 p-3">
        <p className="text-xs font-medium text-muted-foreground">Hely</p>
        <p className="font-mono text-sm" data-testid="submit-coords">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Ha rossz, kattints a térképen vagy használd a böngésző helymeghatározását.
        </p>
      </div>
      <input type="hidden" {...register('latitude')} />
      <input type="hidden" {...register('longitude')} />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Mégse
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting || submission.isPending} data-testid="submit-cta">
          Bejelentés beküldése
        </Button>
      </div>
    </form>
  );
}
