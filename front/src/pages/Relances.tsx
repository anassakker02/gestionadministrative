import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { relanceService } from "@/services/relanceService"; // Import relanceService
import { getAllPaiements } from "@/api/paiementsApi";
import { getEtudiants } from "@/api/etudiantsApi";
import { getRelancesHistorique, sendMessageRelance, recordCallRelance, createRelance, getAllRelances } from "@/api/relancesApi";
// Import supprimé - utilisation des données du backend uniquement
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // Add DialogDescription here
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"; // Import DropdownMenu components
import { 
  Bell, 
  Send, 
  Mail, 
  Phone, 
  MessageSquare, 
  Clock, 
  User,
  Plus,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Calendar as CalendarIcon, // Import CalendarIcon
  BellOff // Import BellOff for mute icon
} from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

interface Relance {
  id: string;
  etudiantId: string;
  etudiantNom: string;
  etudiantEmail: string;
  etudiantTelephone?: string;
  factureId: string;
  factureNumero: string;
  montantDu: number;
  joursRetard: number;
  typeRelance: 'email' | 'sms' | 'appel' | 'courrier';
  statusRelance: 'en_attente' | 'envoye' | 'recu' | 'ignore' | 'appel_effectue'; // Added appel_effectue
  priorite: 'basse' | 'normale' | 'haute' | 'urgente';
  dateCreation: string;
  dateEnvoi?: string;
  message?: string; // Made optional, to be replaced by messageContent for user-editable content
  reponse?: string;
  messageContent?: string; // Main field for message content
  // New fields for call details
  dateAppel?: string;
  outcomeAppel?: 'atteint' | 'pas_atteint' | 'messagerie';
  notesAppel?: string;
  // New fields for payment period details
  periodeCible?: string;
  montantPeriodeDu?: number;
  // New fields for payment status from backend
  isOverdue?: boolean;
  expectedPaidPercentage?: number;
  overdueNotificationsMutedUntil?: string; // New field for mute status
}

const CallFormSchema = z.object({
  dateAppel: z.date({
    required_error: "La date de l'appel est requise.",
  }),
  outcomeAppel: z.enum(['atteint', 'pas_atteint', 'messagerie'], {
    required_error: "Le résultat de l'appel est requis.",
  }),
  messageContent: z.string().optional(), // Renamed from notesAppel
});

const Relances = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [prioriteFilter, setPrioriteFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRelance, setSelectedRelance] = useState<Relance | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCallModalOpen, setIsCallModalOpen] = useState(false); // New state for call modal
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false); // New state for message modal
  const [messageContent, setMessageContent] = useState(""); // State to hold message content
  const [callNotes, setCallNotes] = useState(""); // State to hold call notes
  const [activeTab, setActiveTab] = useState("a_relancer"); // State for active tab
  const [relancesHistorique, setRelancesHistorique] = useState<Relance[]>([]); // State for relances history
  const [relancesLocales, setRelancesLocales] = useState<Relance[]>([]); // State for locally created relances

  // Call form setup
  const callForm = useForm<z.infer<typeof CallFormSchema>>({
    resolver: zodResolver(CallFormSchema),
    defaultValues: {
      dateAppel: new Date(),
      outcomeAppel: 'atteint',
      messageContent: '',
    },
  });

  // Mutation to update relance
  const updateRelanceMutation = useMutation({
    mutationFn: async (updatedRelance: Partial<Relance>) => {
      // This is a mock API call. Replace with actual API call to update relance.
      console.log("Updating relance with:", updatedRelance);
      return new Promise<Relance>(resolve => {
        setTimeout(() => {
          const currentRelances = queryClient.getQueryData<Relance[]>(['relances']) || [];
          const newRelances = currentRelances.map(r =>
            r.id === updatedRelance.id ? { ...r, ...updatedRelance } : r
          );
          queryClient.setQueryData(['relances'], newRelances);
          const updated = newRelances.find(r => r.id === updatedRelance.id);
          resolve(updated!); // Resolve with the updated relance
        }, 500);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relances'] });
      toast({ title: "Relance mise à jour", description: "Les détails de l'appel ont été enregistrés." });
      setIsCallModalOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erreur", description: `Échec de la mise à jour de la relance: ${error.message}`, variant: "destructive" });
    }
  });

  // Mutation to update relance status (for mute/remind actions)
  const updateRelanceStatusMutation = useMutation({
    mutationFn: async (payload: { id: string; statusRelance: Relance['statusRelance']; overdueNotificationsMutedUntil?: string }) => {
      // In a real application, this would call a backend API to update student's relance/payment override status
      // For now, we update the mock data
      console.log("Updating relance status with:", payload);
      // Simulate updating student data for override/mute
      const updatedRelance: Partial<Relance> = {
        id: payload.id,
        statusRelance: payload.statusRelance,
      };
      if (payload.overdueNotificationsMutedUntil) {
        // This part would ideally update the student's profile directly, not the relance itself
        // For mock, we can just reflect the mute in relance
        updatedRelance.overdueNotificationsMutedUntil = payload.overdueNotificationsMutedUntil;
      }
      return await relanceService.updateRelance(payload.id, updatedRelance);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relances'] });
      toast({ title: "Statut de relance mis à jour", description: "Le statut de la relance a été modifié avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: `Échec de la modification du statut de relance: ${error.message}`, variant: "destructive" });
    }
  });

  // Mutation for sending email reminders
  const sendEmailReminderMutation = useMutation({
    mutationFn: async (payload: { relanceId: string; to: string; subject: string; message: string }) => {
      return await relanceService.sendEmailReminder(payload.relanceId, payload.to, payload.subject, payload.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relances'] });
      toast({ title: "Email envoyé", description: "L'email de relance a été envoyé avec succès." });
    },
    onError: (error) => {
      toast({ title: "Erreur", description: `Échec de l'envoi de l'email: ${error.message}`, variant: "destructive" });
    }
  });

  // Mutation for sending message reminders
  const sendMessageReminderMutation = useMutation({
    mutationFn: async (payload: { relanceId: string; message: string }) => {
      return await relanceService.sendMessageReminder(payload.relanceId, payload.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relances'] });
      toast({ title: "Message envoyé", description: "Le message de relance a été envoyé avec succès." });
      setIsMessageModalOpen(false);
    },
    onError: (error) => {
      toast({ title: "Erreur", description: `Échec de l'envoi du message: ${error.message}`, variant: "destructive" });
    }
  });

  // Mock data for development
  // const mockRelances: Relance[] = [
  //   {
  //     id: '1',
  //     etudiantId: 'E001',
  //     etudiantNom: 'Ahmed Khalil',
  //     etudiantEmail: 'ahmed.khalil@email.com',
  //     etudiantTelephone: '+212 6 12 34 56 78',
  //     factureId: 'F001',
  //     factureNumero: 'FAC-2025-001',
  //     montantDu: 20000,
  //     joursRetard: 15,
  //     typeRelance: 'email',
  //     statusRelance: 'envoye',
  //     priorite: 'normale',
  //     dateCreation: '2024-12-20',
  //     dateEnvoi: '2024-12-21',
  //     message: 'Rappel de paiement pour la facture de janvier 2025. Merci de régulariser votre situation.',
  //   },
  //   {
  //     id: '2',
  //     etudiantId: 'E002',
  //     etudiantNom: 'Fatima Zahra',
  //     etudiantEmail: 'fatima.zahra@email.com',
  //     etudiantTelephone: '+212 6 98 76 54 32',
  //     factureId: 'F002',
  //     factureNumero: 'FAC-2024-123',
  //     montantDu: 15000,
  //     joursRetard: 30,
  //     typeRelance: 'sms',
  //     statusRelance: 'en_attente',
  //     priorite: 'haute',
  //     dateCreation: '2024-12-15',
  //     message: 'Dernière relance avant procédure de recouvrement.',
  //   },
  //   {
  //     id: '3',
  //     etudiantId: 'E003',
  //     etudiantNom: 'Omar Benali',
  //     etudiantEmail: 'omar.benali@email.com',
  //     factureId: 'F003',
  //     factureNumero: 'FAC-2024-122',
  //     montantDu: 25000,
  //     joursRetard: 45,
  //     typeRelance: 'appel',
  //     statusRelance: 'recu',
  //     priorite: 'urgente',
  //     dateCreation: '2024-12-01',
  //     dateEnvoi: '2024-12-02',
  //     message: 'Appel téléphonique effectué concernant les factures en retard.',
  //     reponse: 'Étudiant contacté, promesse de paiement sous 48h'
  //   }
  // ];

  // Récupérer les étudiants et paiements pour calculer les soldes impayés
  const { data: etudiants = [], isLoading: isLoadingEtudiants } = useQuery({
    queryKey: ['etudiants'],
    queryFn: async () => {
      const res = await getEtudiants();
      return Array.isArray(res) ? res : (res?.data || []);
    }
  });

  const { data: paiements = [], isLoading: isLoadingPaiements } = useQuery({
    queryKey: ['paiements'],
    queryFn: async () => {
      const res = await getAllPaiements();
      return Array.isArray(res) ? res : (res?.data || []);
    }
  });

  // Fonction pour formater les dates pour l'affichage
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
      const day = date.getDate();
      const month = months[date.getMonth()];
      return `${day} ${month}`;
    } catch (error) {
      return 'N/A';
    }
  };

  // Fonction pour mapper les données du backend vers le format frontend
  const mapBackendRelanceToFrontend = (backendRelance: any): Relance => {
    // Convertir les dates Firestore
    const formatFirestoreDate = (firestoreDate: any) => {
      if (firestoreDate && firestoreDate._seconds) {
        return new Date(firestoreDate._seconds * 1000).toISOString().split('T')[0];
      }
      return new Date().toISOString().split('T')[0];
    };

    return {
      id: backendRelance.id,
      etudiantId: backendRelance.etudiantId || 'unknown',
      etudiantNom: backendRelance.etudiantNom || 'Étudiant inconnu',
      etudiantEmail: backendRelance.etudiantEmail || '',
      etudiantTelephone: backendRelance.etudiantTelephone || '',
      factureId: backendRelance.facture_id || backendRelance.factureId || '',
      factureNumero: backendRelance.factureNumero || `FAC-${backendRelance.id}`,
      montantDu: backendRelance.montantDu || 0,
      joursRetard: backendRelance.joursRetard || 0,
      typeRelance: backendRelance.type === 'message' ? 'email' : 'appel',
      statusRelance: backendRelance.statutEnvoi === 'en attente' ? 'en_attente' : 'envoye',
      priorite: backendRelance.priorite || 'normale',
      dateCreation: formatFirestoreDate(backendRelance.createdAt),
      messageContent: backendRelance.messageContent || '',
      dateEnvoi: formatFirestoreDate(backendRelance.dateEnvoi),
    };
  };

  // Récupérer l'historique des relances depuis le backend
  const { data: historiqueFromBackend = [], isLoading: isLoadingHistorique } = useQuery({
    queryKey: ['relances-historique'],
    queryFn: async () => {
      try {
        console.log('Récupération des relances depuis la table relances...');
        
        // Récupérer toutes les relances depuis la table relances
        const allRelances = await getAllRelances();
        console.log('Relances récupérées:', allRelances);
        
        if (Array.isArray(allRelances)) {
          // Mapper les données du backend vers le format frontend
          const mappedRelances = allRelances.map(mapBackendRelanceToFrontend);
          console.log('Relances mappées:', mappedRelances);
          
          // Filtrer les relances envoyées
          const relancesEnvoyees = mappedRelances.filter(relance => {
            return relance.statusRelance === 'envoye' || relance.statusRelance === 'en_attente';
          });
          console.log('Relances envoyées filtrées:', relancesEnvoyees);
          return relancesEnvoyees;
        }
        
        return [];
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique:', error);
        return [];
      }
    }
  });

  // Calculer les étudiants avec solde impayé
  console.log('Debug - etudiants:', etudiants, 'Type:', typeof etudiants, 'IsArray:', Array.isArray(etudiants));
  console.log('Debug - paiements:', paiements, 'Type:', typeof paiements, 'IsArray:', Array.isArray(paiements));
  
  const etudiantsAvecSoldeImpaye = (Array.isArray(etudiants) ? etudiants : []).map(etudiant => {
    const paiementsEtudiant = (Array.isArray(paiements) ? paiements : []).filter(p => p.etudiant_id === etudiant.id);
    const totalPaye = paiementsEtudiant.reduce((sum, p) => sum + (p.montantPaye || 0), 0);
    const fraisAPayer = etudiant.frais_payment || 0;
    const soldeDu = fraisAPayer - totalPaye;
    
    return {
      ...etudiant,
      totalPaye,
      soldeDu: Math.max(0, soldeDu), // Ne pas afficher de montants négatifs
      aUnSoldeImpaye: soldeDu > 0
    };
  }).filter(etudiant => etudiant.aUnSoldeImpaye);

  // Convertir en format Relance pour l'affichage
  const relances = etudiantsAvecSoldeImpaye.map((etudiant, index) => ({
    id: `relance-${etudiant.id}`,
    etudiantId: etudiant.id,
    etudiantNom: `${etudiant.prenom} ${etudiant.nom}`,
    etudiantEmail: etudiant.email || 'N/A',
    etudiantTelephone: etudiant.telephone || 'N/A',
    factureId: `facture-${etudiant.id}`,
    factureNumero: `FAC-2024-${String(index + 1).padStart(3, '0')}`,
    montantDu: etudiant.soldeDu,
    joursRetard: Math.floor(Math.random() * 60) + 1, // Générer un retard aléatoire pour la démo
    typeRelance: 'email' as const,
    statusRelance: 'en_attente' as const,
    priorite: etudiant.soldeDu > 2000 ? 'haute' as const : 'normale' as const,
    dateCreation: new Date().toISOString().split('T')[0],
    message: `Rappel de paiement pour les frais de scolarité en retard. Solde dû: ${etudiant.soldeDu.toLocaleString()} MAD`,
  }));

  const isLoading = isLoadingEtudiants || isLoadingPaiements;

  const filteredRelances = relances.filter(relance => {
    const matchesSearch = relance.etudiantNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         relance.factureNumero.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         relance.etudiantEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || relance.typeRelance === typeFilter;
    const matchesPriorite = prioriteFilter === 'all' || relance.priorite === prioriteFilter;
    const matchesStatus = statusFilter === 'all' || relance.statusRelance === statusFilter;
    
    return matchesSearch && matchesType && matchesPriorite && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge className="bg-warning text-warning-foreground">En attente</Badge>;
      case 'envoye':
        return <Badge className="bg-info text-info-foreground">Envoyé</Badge>;
      case 'recu':
        return <Badge className="bg-success text-success-foreground">Reçu</Badge>;
      case 'appel_effectue':
        return <Badge className="bg-blue-500 text-white">Appel effectué</Badge>; // New badge for call status
      case 'ignore':
        return <Badge variant="destructive">Ignoré</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case 'urgente':
        return <Badge variant="destructive" className="animate-pulse">Urgente</Badge>;
      case 'haute':
        return <Badge className="bg-orange-500 text-white">Haute</Badge>;
      case 'normale':
        return <Badge variant="secondary">Normale</Badge>;
      case 'basse':
        return <Badge variant="outline">Basse</Badge>;
      default:
        return <Badge variant="outline">-</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'appel':
        return <Phone className="h-4 w-4" />;
      case 'courrier':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getRetardLevel = (jours: number) => {
    if (jours >= 60) return { level: 'critique', color: 'text-red-600' };
    if (jours >= 30) return { level: 'sévère', color: 'text-orange-500' };
    if (jours >= 15) return { level: 'modéré', color: 'text-yellow-600' };
    return { level: 'léger', color: 'text-blue-500' };
  };

  // New functions for Mute/Rappel actions
  const handleMuteNotifications = (relance: Relance) => {
    // Simulate muting for 30 days
    const mutedUntil = new Date();
    mutedUntil.setDate(mutedUntil.getDate() + 30);
    updateRelanceStatusMutation.mutate({
      id: relance.id,
      statusRelance: 'ignore',
      overdueNotificationsMutedUntil: mutedUntil.toISOString(),
    });
  };

  const handleReactivateNotifications = (relance: Relance) => {
    updateRelanceStatusMutation.mutate({
      id: relance.id,
      statusRelance: 'en_attente',
      overdueNotificationsMutedUntil: null, // Clear mute
    });
  };

  const handleCreateRelance = () => {
    setSelectedRelance(null);
    setIsDialogOpen(true);
  };

  const handleViewRelance = (relance: Relance) => {
    setSelectedRelance(relance);
    setIsDialogOpen(true);
  };

  const handleMakeCall = (relance: Relance) => {
    setSelectedRelance(relance);
    // Message pré-rempli comme dans l'image
    const messagePreRempli = `Discuté du solde de ${relance.montantDu.toLocaleString()} MAD, paiement promis pour la fin de semaine.`;
    setCallNotes(messagePreRempli);
    setIsCallModalOpen(true);
  };

  const onSubmitCallForm = async () => {
    if (selectedRelance) {
      try {
        // D'abord créer la relance si elle n'existe pas
        const relanceData = {
          etudiantId: selectedRelance.etudiantId,
          etudiantNom: selectedRelance.etudiantNom,
          etudiantEmail: selectedRelance.etudiantEmail,
          etudiantTelephone: selectedRelance.etudiantTelephone,
          factureId: selectedRelance.factureId,
          factureNumero: selectedRelance.factureNumero,
          montantDu: selectedRelance.montantDu,
          joursRetard: selectedRelance.joursRetard,
          typeRelance: 'appel' as const,
          statusRelance: 'envoye' as const,
          priorite: (selectedRelance.priorite === 'urgente' ? 'haute' : selectedRelance.priorite) as 'basse' | 'normale' | 'haute',
          dateCreation: new Date().toISOString().split('T')[0],
          messageContent: callNotes,
          dateAppel: new Date().toISOString().split('T')[0],
          outcomeAppel: 'atteint' as const,
          // Champs requis par le backend
          facture_id: selectedRelance.factureId,
          dateEnvoi: new Date().toISOString().split('T')[0],
          type: 'appel' as const,
        };

        // Créer la relance dans le backend
        try {
          const nouvelleRelance = await createRelance(relanceData);
          console.log('Relance créée avec succès:', nouvelleRelance);
        } catch (createError) {
          console.log('Erreur lors de la création, ajout en local:', createError);
          // En cas d'erreur, ajouter à l'état local
          const relanceLocale: Relance = {
            ...relanceData,
            id: `local-${Date.now()}`,
          };
          setRelancesLocales(prev => [relanceLocale, ...prev]);
        }
        
        setIsCallModalOpen(false);
        setCallNotes("");
        
        // Rafraîchir l'historique depuis le backend
        queryClient.invalidateQueries({ queryKey: ['relances-historique'] });
        
        toast({
          title: "Relance enregistrée",
          description: "L'appel de relance a été enregistré avec succès.",
        });
      } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'appel:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'enregistrement de l'appel.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSendMessage = (relance: Relance) => {
    setSelectedRelance(relance);
    // Message pré-rempli comme dans l'image
    const messagePreRempli = `Bonjour ${relance.etudiantNom.split(' ')[0]}, sauf erreur de notre part, vous avez un solde impayé de ${relance.montantDu.toLocaleString()} MAD. Veuillez régulariser votre situation.`;
    setMessageContent(messagePreRempli);
    setIsMessageModalOpen(true);
  };

  const onSubmitMessageForm = async () => {
    if (selectedRelance) {
      try {
        // D'abord créer la relance si elle n'existe pas
        const relanceData = {
          etudiantId: selectedRelance.etudiantId,
          etudiantNom: selectedRelance.etudiantNom,
          etudiantEmail: selectedRelance.etudiantEmail,
          etudiantTelephone: selectedRelance.etudiantTelephone,
          factureId: selectedRelance.factureId,
          factureNumero: selectedRelance.factureNumero,
          montantDu: selectedRelance.montantDu,
          joursRetard: selectedRelance.joursRetard,
          typeRelance: 'email' as const,
          statusRelance: 'envoye' as const,
          priorite: (selectedRelance.priorite === 'urgente' ? 'haute' : selectedRelance.priorite) as 'basse' | 'normale' | 'haute',
          dateCreation: new Date().toISOString().split('T')[0],
          messageContent: messageContent,
          // Champs requis par le backend
          facture_id: selectedRelance.factureId,
          dateEnvoi: new Date().toISOString().split('T')[0],
          type: 'message' as const,
        };

        // Créer la relance dans le backend
        try {
          const nouvelleRelance = await createRelance(relanceData);
          console.log('Relance créée avec succès:', nouvelleRelance);
        } catch (createError) {
          console.log('Erreur lors de la création, ajout en local:', createError);
          // En cas d'erreur, ajouter à l'état local
          const relanceLocale: Relance = {
            ...relanceData,
            id: `local-${Date.now()}`,
          };
          setRelancesLocales(prev => [relanceLocale, ...prev]);
        }
        
        setIsMessageModalOpen(false);
        setMessageContent("");
        
        // Rafraîchir l'historique depuis le backend
        queryClient.invalidateQueries({ queryKey: ['relances-historique'] });
        
        toast({
          title: "Relance envoyée",
          description: "Le message de relance a été envoyé avec succès.",
        });
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de l'envoi du message.",
          variant: "destructive",
        });
      }
    }
  };

  // Stats
  const stats = {
    total: relances.length,
    montantTotal: relances.reduce((sum, r) => sum + r.montantDu, 0)
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Relances</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("a_relancer")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "a_relancer"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          À Relancer
        </button>
        <button
          onClick={() => setActiveTab("historique")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === "historique"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Historique
        </button>
      </div>

      {/* Section Title */}
                        <div>
        <h2 className="text-xl font-bold text-gray-900">
          {activeTab === "a_relancer" ? "Étudiants avec Solde Impayé" : "Historique des Relances"}
        </h2>
                      </div>
                      
      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeTab === "a_relancer" ? (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Étudiant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Solde Dû
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frais en Retard
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRelances.map((relance) => (
                    <tr key={relance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {relance.etudiantNom}
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {relance.montantDu.toLocaleString()} MAD
                      </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div>Frais de scolarité {new Date().getFullYear()},</div>
                          <div>Frais d'inscription {new Date().getFullYear()},</div>
                          <div>Frais d'examen Semestre 1</div>
                    </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button className="bg-black text-white hover:bg-gray-800">
                              <Send className="h-4 w-4 mr-2" />
                              Relancer
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-48">
                            <DropdownMenuItem onClick={() => handleSendMessage(relance)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Par Message
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMakeCall(relance)}>
                              <Phone className="h-4 w-4 mr-2" />
                              Par Appel
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Étudiant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contenu/Sujet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingHistorique ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                          <span className="ml-2 text-gray-600">Chargement de l'historique...</span>
                        </div>
                      </td>
                    </tr>
                  ) : (historiqueFromBackend.length === 0 && relancesLocales.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Aucune relance dans l'historique
                        <br />
                        <small className="text-xs text-gray-400">
                          Debug: Backend={historiqueFromBackend.length}, Local={relancesLocales.length}
                        </small>
                      </td>
                    </tr>
                  ) : (
                    [...historiqueFromBackend, ...relancesLocales].map((relance, index) => {
                      console.log('Affichage de la relance:', relance);
                      return (
                    <tr key={`${relance.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {relance.etudiantNom}
                          {relance.id?.startsWith('local-') && (
                            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              Local
                            </span>
                      )}
                    </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {relance.montantDu.toLocaleString()} MAD
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {relance.dateEnvoi || relance.dateCreation}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {relance.messageContent || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {relance.typeRelance === 'email' ? 'Message Envoyé' : 'Appel Effectué'} ({formatDateForDisplay(relance.dateEnvoi || relance.dateCreation)})
                        </button>
                      </td>
                    </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            )}
                  </div>
                </CardContent>
              </Card>

      {isLoading && (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {filteredRelances.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Aucun étudiant avec solde impayé trouvé.</p>
          </CardContent>
        </Card>
      )}

      {/* Call Details Dialog */}
      <Dialog open={isCallModalOpen} onOpenChange={setIsCallModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enregistrer un Appel de Relance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                Pour l'étudiant : <span className="font-semibold">{selectedRelance?.etudiantNom}</span> (Solde: {selectedRelance?.montantDu.toLocaleString()} MAD)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="callNotes" className="text-sm font-medium">Sujet de l'appel</Label>
              <Textarea
                id="callNotes"
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                className="min-h-[120px]"
                rows={6}
                placeholder="Détails de l'appel..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
                          <Button
              variant="outline" 
              onClick={() => setIsCallModalOpen(false)}
            >
              Annuler
                          </Button>
            <Button 
              onClick={onSubmitCallForm} 
              disabled={updateRelanceMutation.isPending}
              className="bg-black text-white hover:bg-gray-800"
            >
              {updateRelanceMutation.isPending ? "Enregistrement..." : "Envoyer la relance"}
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Message Sending Dialog */}
      <Dialog open={isMessageModalOpen} onOpenChange={setIsMessageModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Envoyer un Message de Relance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                Pour l'étudiant : <span className="font-semibold">{selectedRelance?.etudiantNom}</span> (Solde: {selectedRelance?.montantDu.toLocaleString()} MAD)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">Message</Label>
              <Textarea
                id="message"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="min-h-[120px]"
                rows={6}
                placeholder="Votre message de relance..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsMessageModalOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={onSubmitMessageForm} 
              disabled={sendMessageReminderMutation.isPending}
              className="bg-black text-white hover:bg-gray-800"
            >
              {sendMessageReminderMutation.isPending ? "Envoi en cours..." : "Envoyer la relance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRelance ? 'Détails de la relance' : 'Créer une nouvelle relance'}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {selectedRelance ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Étudiant</label>
                    <p className="text-lg">{selectedRelance.etudiantNom}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p>{selectedRelance.etudiantEmail}</p>
                  </div>
                </div>
                
                {selectedRelance.etudiantTelephone && (
                  <div>
                    <label className="text-sm font-medium">Téléphone</label>
                    <p>{selectedRelance.etudiantTelephone}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Type de relance</label>
                    <p>{selectedRelance.typeRelance}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Statut</label>
                    <p>{getStatusBadge(selectedRelance.statusRelance)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Priorité</label>
                    <p>{getPrioriteBadge(selectedRelance.priorite)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Date de création</label>
                    <p>{new Date(selectedRelance.dateCreation).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedRelance.dateEnvoi && (
                  <div>
                    <label className="text-sm font-medium">Date d'envoi</label>
                    <p>{new Date(selectedRelance.dateEnvoi).toLocaleDateString()}</p>
                  </div>
                )}
                
                {selectedRelance.dateAppel && (
                  <div>
                    <label className="text-sm font-medium">Date d'appel</label>
                    <p>{new Date(selectedRelance.dateAppel).toLocaleDateString()}</p>
                  </div>
                )}

                {selectedRelance.outcomeAppel && (
                  <div>
                    <label className="text-sm font-medium">Résultat d'appel</label>
                    <p>{selectedRelance.outcomeAppel}</p>
                  </div>
                )}

                {selectedRelance.notesAppel && (
                  <div>
                    <label className="text-sm font-medium">Notes d'appel</label>
                    <p>{selectedRelance.notesAppel}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Facture</label>
                    <p>{selectedRelance.factureNumero}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Montant</label>
                    <p className="font-bold text-primary">{selectedRelance.montantDu.toLocaleString()} MAD</p>
                  </div>
                </div>
                
                {selectedRelance.periodeCible && selectedRelance.montantPeriodeDu !== undefined && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Période Cible</label>
                      <p>{selectedRelance.periodeCible}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Montant dû pour la période</label>
                      <p className="font-bold text-lg text-purple-600">{selectedRelance.montantPeriodeDu.toLocaleString()} MAD</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Contenu du message</label>
                  <Textarea
                    value={selectedRelance.messageContent || ''}
                    onChange={(e) => {
                      if (selectedRelance) {
                        setSelectedRelance({ ...selectedRelance, messageContent: e.target.value });
                      }
                    }}
                    className="mt-1 p-3 bg-muted rounded-lg"
                    rows={5}
                    readOnly={!selectedRelance || selectedRelance.typeRelance === 'email'} // Allow editing for SMS and call notes
                  />
                </div>
                
                {selectedRelance.reponse && (
                  <div>
                    <label className="text-sm font-medium">Réponse</label>
                    <div className="mt-1 p-3 bg-success/10 border border-success/20 rounded-lg">
                      <p>{selectedRelance.reponse}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                Formulaire de création de relance à implémenter selon les besoins spécifiques.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Relances;