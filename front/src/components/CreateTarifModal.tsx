import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Plus, Euro } from 'lucide-react';
import { getCurrentAcademicYear } from '@/utils/academicYear';

// Schéma de validation
const tarifSchema = z.object({
  type: z.enum(['Scolarité', 'Autres frais'], {
    required_error: "Le type de frais est requis",
  }),
  nom: z.string().min(1, { message: "Le nom du frais est requis" }),
  montant: z.number().min(0, { message: "Le montant doit être positif" }),
  annee_scolaire: z.string().min(1, { message: "L'année scolaire est requise" }),
  isActive: z.boolean().default(true),
});

type TarifFormData = z.infer<typeof tarifSchema>;

interface CreateTarifModalProps {
  onSuccess?: () => void;
}

const CreateTarifModal: React.FC<CreateTarifModalProps> = ({ onSuccess }) => {
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');
  const queryClient = useQueryClient();
  const currentAcademicYear = getCurrentAcademicYear();

  const form = useForm<TarifFormData>({
    resolver: zodResolver(tarifSchema),
    defaultValues: {
      type: 'Scolarité',
      nom: '',
      montant: 0,
      annee_scolaire: currentAcademicYear.label,
      isActive: true,
    },
  });


  // Vérifier si on peut modifier les tarifs de scolarité
  const canModifyScolarite = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    return currentMonth >= 6; // Seulement à partir de juin
  };

  const createTarifMutation = useMutation({
    mutationFn: async (data: TarifFormData) => {
      // Simulation de l'API - remplacer par l'appel réel
      const response = await fetch('/api/tarifs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          classe_id: null, // Pas de classe spécifique pour les frais globaux
        }),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la création du tarif');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tarif créé",
        description: "Le tarif a été créé avec succès.",
      });
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tarifs'] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du tarif",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TarifFormData) => {
    // Vérifier si on peut modifier les tarifs de scolarité
    if (data.type === 'Scolarité' && !canModifyScolarite()) {
      toast({
        title: "Modification non autorisée",
        description: "Les tarifs de scolarité ne peuvent être modifiés qu'à partir du mois de juin.",
        variant: "destructive",
      });
      return;
    }

    createTarifMutation.mutate(data);
  };

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    form.setValue('type', value as 'Scolarité' | 'Autres frais');
    form.setValue('nom', ''); // Reset le nom quand on change le type
    form.clearErrors('nom'); // Clear les erreurs du nom
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Créer Tarif
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Créer un nouveau tarif
          </DialogTitle>
          <DialogDescription>
            Créer un tarif pour l'année scolaire {currentAcademicYear.label}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Type de tarif - Premier champ */}
          <div className="space-y-2">
            <Label htmlFor="type">Type de tarif *</Label>
            <Select onValueChange={handleTypeChange} defaultValue="">
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type de tarif" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Scolarité">Scolarité</SelectItem>
                <SelectItem value="Autres frais">Autres frais</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.type && (
              <p className="text-sm text-red-500">
                {form.formState.errors.type.message}
              </p>
            )}
          </div>

          {/* Nom du tarif - Liste déroulante si Scolarité, input libre si Autres */}
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du tarif *</Label>
            {selectedType === 'Scolarité' ? (
              <Select 
                onValueChange={(value) => form.setValue('nom', value)}
                disabled={!selectedType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le nom du frais" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frais Inscription">Frais Inscription</SelectItem>
                  <SelectItem value="Frais Scolarité">Frais Scolarité</SelectItem>
                </SelectContent>
              </Select>
            ) : selectedType === 'Autres frais' ? (
              <Input
                id="nom"
                placeholder="Ex: Cantine, Transport, Matériel..."
                {...form.register("nom")}
              />
            ) : (
              <Input
                id="nom"
                placeholder="Sélectionnez d'abord le type de tarif"
                disabled
              />
            )}
            {form.formState.errors.nom && (
              <p className="text-sm text-red-500">
                {form.formState.errors.nom.message}
              </p>
            )}
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (MAD) *</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...form.register('montant', { valueAsNumber: true })}
            />
            {form.formState.errors.montant && (
              <p className="text-sm text-red-500">
                {form.formState.errors.montant.message}
              </p>
            )}
          </div>

          {/* Année scolaire */}
          <div className="space-y-2">
            <Label htmlFor="annee_scolaire">Année scolaire *</Label>
            <Input
              id="annee_scolaire"
              value={currentAcademicYear.label}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Année scolaire automatiquement définie
            </p>
          </div>

          {/* Statut actif */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={form.watch('isActive')}
              onCheckedChange={(checked) => form.setValue('isActive', checked)}
            />
            <Label htmlFor="isActive">Tarif actif</Label>
          </div>

          {/* Avertissement pour les tarifs de scolarité */}
          {selectedType === 'Scolarité' && !canModifyScolarite() && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ Les tarifs de scolarité ne peuvent être modifiés qu'à partir du mois de juin.
              </p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={createTarifMutation.isPending || (selectedType === 'Scolarité' && !canModifyScolarite())}
            >
              {createTarifMutation.isPending ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTarifModal;
