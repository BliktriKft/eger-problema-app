import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  PROBLEM_CATEGORIES,
  PROBLEM_CATEGORY_LABELS_HU,
  type ProblemCategory,
} from '@/types';

/**
 * Submit form.  M1 stub — wired against `react-hook-form` + `zod` so the
 * later M2 task only has to add the `useMutation` + API call, not redo the
 * form scaffolding.
 */
const submitSchema = z.object({
  title: z.string().min(4, 'A cím legalább 4 karakter').max(120),
  description: z.string().min(10, 'Adj meg részletesebb leírást').max(2000),
  category: z.enum(PROBLEM_CATEGORIES),
  // Latitude/longitude captured via expo-location *before* the user reaches
  // this screen — submit accepts the resolved coords via initial values.
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type SubmitFormValues = z.infer<typeof submitSchema>;

export interface SubmitFormProps {
  /** Pre-resolved GPS coords from the previous screen. */
  initialLocation: { latitude: number; longitude: number };
  /** Submit handler — wired to the API in M2. */
  onSubmit: (values: SubmitFormValues) => Promise<void>;
}

export function SubmitForm({ initialLocation, onSubmit }: SubmitFormProps) {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubmitFormValues>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'infrastructure',
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.kb}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Cím *</Text>
        <Controller
          control={control}
          name="title"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Pl.: Kátyú a Kossuth utcán"
              testID="submit-title"
            />
          )}
        />
        {errors.title ? <Text style={styles.error}>{errors.title.message}</Text> : null}

        <Text style={styles.label}>Leírás *</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={[styles.input, styles.textarea]}
              multiline
              numberOfLines={4}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder="Részletek…"
              testID="submit-description"
            />
          )}
        />
        {errors.description ? <Text style={styles.error}>{errors.description.message}</Text> : null}

        <Text style={styles.label}>Kategória</Text>
        <Controller
          control={control}
          name="category"
          render={({ field: { value, onChange } }) => (
            <View style={styles.chips} testID="submit-categories">
              {PROBLEM_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => onChange(cat)}
                  style={[styles.chip, value === cat && styles.chipActive]}
                  testID={`submit-cat-${cat}`}
                >
                  <Text style={[styles.chipLabel, value === cat && styles.chipLabelActive]}>
                    {PROBLEM_CATEGORY_LABELS_HU[cat as ProblemCategory]}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        />

        <Text style={styles.muted}>
          Hely: {initialLocation.latitude.toFixed(5)}, {initialLocation.longitude.toFixed(5)}
        </Text>

        <Pressable
          disabled={isSubmitting}
          onPress={handleSubmit(async (values) => {
            try {
              await onSubmit(values);
            } catch (err) {
              Alert.alert('Hiba', err instanceof Error ? err.message : 'Ismeretlen hiba');
            }
          })}
          style={[styles.submit, isSubmitting && styles.submitPending]}
          testID="submit-cta"
        >
          <Text style={styles.submitLabel}>{isSubmitting ? 'Beküldés…' : 'Bejelentés beküldése'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  kb: { flex: 1 },
  scroll: { padding: 16, gap: 6 },
  label: { fontWeight: '600', marginTop: 8, color: '#0f172a' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 15,
  },
  textarea: { minHeight: 96, textAlignVertical: 'top' },
  error: { color: '#dc2626', fontSize: 12, marginTop: 2 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipLabel: { color: '#0f172a', fontSize: 12 },
  chipLabelActive: { color: '#fff' },
  muted: { color: '#64748b', fontSize: 12, marginTop: 8 },
  submit: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitPending: { opacity: 0.6 },
  submitLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
