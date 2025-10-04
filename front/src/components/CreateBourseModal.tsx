import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBoursePercentages, Bourse } from '@/api/boursesApi';

interface CreateBourseModalProps {
  initialData?: Bourse | null;
  onSubmit: (data: Omit<Bourse, 'id' | 'nombreBeneficiaires'>) => void;
  onCancel: () => void;
}

const formSchema = z.object({
  nom: z.string().min(2, { message: 'Le nom doit contenir au moins 2 caractères.' }),
  description: z.string().optional(),
  pourcentage_remise: z.preprocess(
    (val) => val === '' ? null : Number(val), 
    z.number().min(0, { message: 'Le pourcentage doit être au moins 0%.' })
    .max(100, { message: 'Le pourcentage ne peut pas dépasser 100%.' })
    .nullable()
  ).optional(),
  montant_remise: z.preprocess(
    (val) => val === '' ? null : Number(val), 
    z.number().min(0, { message: 'Le montant doit être positif.' })
    .nullable()
  ).optional(),
  isExempt: z.boolean().optional(),
  criteres: z.string().optional(),
  status: z.enum(['active', 'inactive', 'expire']).optional(),
});

const CreateBourseModal: React.FC<CreateBourseModalProps> = ({ initialData, onSubmit, onCancel }) => {
  // Récupérer les pourcentages disponibles depuis le backend
  const { data: availablePercentages = [25, 50, 60], isLoading: isLoadingPercentages } = useQuery({
    queryKey: ['boursePercentages'],
    queryFn: getBoursePercentages,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      nom: initialData.nom,
      description: initialData.description,
      pourcentage_remise: initialData.pourcentage_remise,
      montant_remise: initialData.montant_remise,
      isExempt: initialData.isExempt,
      criteres: initialData.criteres,
      status: initialData.status,
    } : {
      nom: '',
      description: '',
      pourcentage_remise: null,
      montant_remise: null,
      isExempt: false,
      criteres: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nom: initialData.nom,
        description: initialData.description,
        pourcentage_remise: initialData.pourcentage_remise,
        montant_remise: initialData.montant_remise,
        isExempt: initialData.isExempt,
        criteres: initialData.criteres,
        status: initialData.status,
      });
    } else {
      form.reset({
        nom: '',
        description: '',
        pourcentage_remise: null,
        montant_remise: null,
        isExempt: false,
        criteres: '',
        status: 'active',
      });
    }
  }, [initialData, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      ...(initialData && { id: initialData.id }), // Inclure l'ID si c'est une modification
      nom: values.nom,
      description: values.description,
      pourcentage_remise: values.pourcentage_remise,
      montant_remise: values.montant_remise,
      isExempt: values.isExempt,
      criteres: values.criteres,
      status: values.status,
    } as any); // Type assertion temporaire pour la compatibilité
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Nom de la bourse</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Bourse Excellence" {...field} className="text-sm" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ex: Bourse pour les étudiants méritants..." 
                  className="min-h-[60px] text-sm"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="pourcentage_remise"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Pourcentage de réduction</FormLabel>
              <Select onValueChange={(value) => field.onChange(value === 'none' ? null : Number(value))} defaultValue={field.value?.toString() || 'none'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un pourcentage" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Aucun pourcentage</SelectItem>
                  {availablePercentages.map((percentage) => (
                    <SelectItem key={percentage} value={percentage.toString()}>
                      {percentage}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="montant_remise"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Montant de réduction fixe (DH)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Ex: 10000" 
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="criteres"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Critères</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ex: Moyenne > 16/20, faibles revenus" 
                  className="min-h-[60px] text-sm"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isExempt"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value || false}
                  onChange={field.onChange}
                  className="mt-0"
                />
              </FormControl>
              <div className="space-y-0 leading-none">
                <FormLabel className="text-sm">
                  Exonération totale
                </FormLabel>
                <p className="text-xs text-muted-foreground">
                  Étudiant totalement exonéré des frais
                </p>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Statut</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expire">Expirée</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-3 border-t">
          <Button type="button" variant="outline" onClick={onCancel} size="sm">
            Annuler
          </Button>
          <Button type="submit" className="bg-primary hover:bg-primary-hover" size="sm">
            {initialData ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateBourseModal;
