'use client';

import * as React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { toast } from '@/components/ui/toaster';
import {
  useCreateInstitution,
  useDeleteInstitution,
  useUpdateInstitution,
} from '@/lib/api/queries/institutions';
import { useInstitution } from '@/lib/api/queries/institutions';
import { ApiError } from '@/lib/api/client';
import {
  INSTITUTION_TYPES,
  INSTITUTION_TYPE_LABELS_HU,
  type Institution,
} from '@/types';
import { MapPicker } from '@/components/map/MapPicker';
import { cn } from '@/lib/cn';

/**
 * InstitutionForm — admin CRUD form.
 *
 * - Mode = "create" when no `institutionId` is passed.
 * - Mode = "edit"   when an `institutionId` is passed; the form
 *   pre-fills from the cached institution.
 *
 * On success we invalidate every institution query and push to the
 * admin list.  Deletion is also handled here (a destructive button at
 * the bottom in edit mode).
 */
const urlSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : null))
  .refine(
    (v) => v === null || /^https?:\/\//i.test(v),
    'Adj meg érvényes URL-t (https:// kezdettel)',
  );

const formSchema = z.object({
  name: z.string().trim().min(2, 'A név legalább 2 karakter').max(200, 'Maximum 200 karakter'),
  type: z.enum(INSTITUTION_TYPES),
  address: z.string().trim().min(3, 'Adj meg egy címet').max(300, 'Maximum 300 karakter'),
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
  officialUrl: urlSchema,
});
export type InstitutionFormValues = z.infer<typeof formSchema>;

export interface InstitutionFormProps {
  /** When set, the form is in edit mode and pre-fills from this id. */
  institutionId?: string;
}

export function InstitutionForm({ institutionId }: InstitutionFormProps) {
  const router = useRouter();
  const isEdit = Boolean(institutionId);
  const detail = useInstitution(isEdit ? institutionId : null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InstitutionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'school',
      address: '',
      latitude: 47.9025,
      longitude: 20.3772,
      officialUrl: null,
    },
  });

  // Pre-fill when the edit query lands.
  React.useEffect(() => {
    if (!isEdit || !detail.data) return;
    const i = detail.data;
    reset({
      name: i.name,
      type: i.type,
      address: i.address,
      latitude: i.latitude,
      longitude: i.longitude,
      officialUrl: i.officialUrl,
    });
  }, [isEdit, detail.data, reset]);

  const lat = watch('latitude');
  const lng = watch('longitude');

  const createMutation = useCreateInstitution();
  const updateMutation = useUpdateInstitution();
  const deleteMutation = useDeleteInstitution();

  const isBusy = isSubmitting || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const onSubmit = (values: InstitutionFormValues) => {
    if (isEdit && institutionId) {
      updateMutation.mutate(
        {
          id: institutionId,
          name: values.name,
          type: values.type,
          address: values.address,
          latitude: values.latitude,
          longitude: values.longitude,
          officialUrl: values.officialUrl,
        },
        {
          onSuccess: () => {
            toast.success('Intézmény frissítve.');
            router.push('/institutions/admin');
          },
          onError: (err: unknown) => {
            const message = err instanceof ApiError ? err.message : 'Ismeretlen hiba';
            toast({
              title: 'Nem sikerült frissíteni az intézményt.',
              description: message,
              variant: 'destructive',
            });
          },
        },
      );
    } else {
      createMutation.mutate(
        {
          name: values.name,
          type: values.type,
          address: values.address,
          latitude: values.latitude,
          longitude: values.longitude,
          officialUrl: values.officialUrl,
        },
        {
          onSuccess: () => {
            toast.success('Intézmény létrehozva.');
            router.push('/institutions/admin');
          },
          onError: (err: unknown) => {
            const message = err instanceof ApiError ? err.message : 'Ismeretlen hiba';
            toast({
              title: 'Nem sikerült létrehozni az intézményt.',
              description: message,
              variant: 'destructive',
            });
          },
        },
      );
    }
  };

  const onDelete = () => {
    if (!institutionId) return;
    if (!window.confirm('Biztosan törlöd ezt az intézményt? A művelet nem visszavonható.')) return;
    deleteMutation.mutate(
      { id: institutionId },
      {
        onSuccess: () => {
          toast.success('Intézmény törölve.');
          router.push('/institutions/admin');
        },
        onError: (err: unknown) => {
          const message = err instanceof ApiError ? err.message : 'Ismeretlen hiba';
          toast({
            title: 'Nem sikerült törölni az intézményt.',
            description: message,
            variant: 'destructive',
          });
        },
      },
    );
  };

  // Show the loading skeleton in edit mode until the source query lands.
  if (isEdit && detail.isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 p-4">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="80%" lines={3} />
        <Skeleton variant="rect" className="h-72 w-full rounded-md" />
      </div>
    );
  }
  if (isEdit && detail.isError) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <ErrorState
          severity="error"
          title="Nem sikerült betölteni az intézményt."
          primaryAction={{ label: 'Újrapróbálkozás', onClick: () => detail.refetch() }}
        />
      </div>
    );
  }
  if (isEdit && !detail.data) {
    return <ErrorState severity="error" title="Ez az intézmény nem található." variant="full" />;
  }

  return (
    <form
      className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4"
      onSubmit={handleSubmit(onSubmit)}
      data-testid="institution-form"
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? 'Intézmény szerkesztése' : 'Új intézmény'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Az itt megadott adatok a nyilvános katalógusban jelennek meg.
        </p>
      </header>

      <div className="space-y-1.5">
        <Label htmlFor="inst-name">Név *</Label>
        <Input
          id="inst-name"
          placeholder="Pl.: Egri Bolyai János Gimnázium"
          {...register('name')}
          invalid={Boolean(errors.name)}
          data-testid="institution-form-name"
        />
        {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="inst-type">Típus *</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="inst-type" data-testid="institution-form-type">
                  <SelectValue placeholder="Válassz típust" />
                </SelectTrigger>
                <SelectContent>
                  {INSTITUTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {INSTITUTION_TYPE_LABELS_HU[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.type ? <p className="text-xs text-destructive">{errors.type.message}</p> : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="inst-url">Hivatalos weboldal</Label>
          <Input
            id="inst-url"
            type="url"
            placeholder="https://"
            {...register('officialUrl')}
            invalid={Boolean(errors.officialUrl)}
            data-testid="institution-form-url"
          />
          {errors.officialUrl ? <p className="text-xs text-destructive">{errors.officialUrl.message}</p> : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="inst-address">Cím *</Label>
        <Textarea
          id="inst-address"
          rows={2}
          placeholder="Pl.: 3300 Eger, Kossuth Lajos u. 18."
          {...register('address')}
          invalid={Boolean(errors.address)}
          data-testid="institution-form-address"
        />
        {errors.address ? <p className="text-xs text-destructive">{errors.address.message}</p> : null}
      </div>

      <div className="space-y-2">
        <Label>Helyszín *</Label>
        <p className="text-xs text-muted-foreground">
          Kattints a térképre a pontos hely kijelöléséhez. A koordinátákat manuálisan is módosíthatod lentebb.
        </p>
        <MapPicker
          latitude={lat}
          longitude={lng}
          onPick={(picked) => {
            setValue('latitude', Number(picked.latitude.toFixed(6)), { shouldValidate: true });
            setValue('longitude', Number(picked.longitude.toFixed(6)), { shouldValidate: true });
          }}
          className="h-64 w-full overflow-hidden rounded-md border border-border"
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="inst-lat">Szélesség</Label>
            <Input
              id="inst-lat"
              type="number"
              step="0.000001"
              {...register('latitude')}
              invalid={Boolean(errors.latitude)}
              data-testid="institution-form-lat"
            />
            {errors.latitude ? <p className="text-xs text-destructive">{errors.latitude.message}</p> : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="inst-lng">Hosszúság</Label>
            <Input
              id="inst-lng"
              type="number"
              step="0.000001"
              {...register('longitude')}
              invalid={Boolean(errors.longitude)}
              data-testid="institution-form-lng"
            />
            {errors.longitude ? <p className="text-xs text-destructive">{errors.longitude.message}</p> : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {isEdit ? (
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isBusy}
            data-testid="institution-form-delete"
          >
            <Trash2 className="size-4" aria-hidden /> Törlés
          </Button>
        ) : null}
        <button
          type="button"
          className={cn(buttonVariants({ variant: 'outline' }))}
          onClick={() => router.back()}
          disabled={isBusy}
        >
          Mégse
        </button>
        <Button type="submit" variant="primary" loading={isBusy} data-testid="institution-form-submit">
          {isEdit ? 'Mentés' : 'Létrehozás'}
        </Button>
      </div>
    </form>
  );
}