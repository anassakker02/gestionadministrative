import { apiRequest } from '@/lib/api';

export interface SMSNotification {
  id: string;
  to: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: string;
  error?: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export const smsService = {
  // Envoyer un SMS
  sendSMS: async (to: string, message: string) => {
    return await apiRequest('/sms/send', 'POST', {
      to,
      message
    });
  },

  // Envoyer un SMS avec template
  sendSMSWithTemplate: async (to: string, templateId: string, variables: Record<string, string>) => {
    return await apiRequest('/sms/send-template', 'POST', {
      to,
      templateId,
      variables
    });
  },

  // Récupérer l'historique des SMS
  getSMSHistory: async (limit = 50, offset = 0) => {
    return await apiRequest(`/sms/history?limit=${limit}&offset=${offset}`, 'GET');
  },

  // Récupérer les templates SMS
  getSMSTemplates: async () => {
    return await apiRequest('/sms/templates', 'GET');
  },

  // Créer un template SMS
  createSMSTemplate: async (template: Omit<SMSTemplate, 'id'>) => {
    return await apiRequest('/sms/templates', 'POST', template);
  },

  // Mettre à jour un template SMS
  updateSMSTemplate: async (id: string, template: Partial<SMSTemplate>) => {
    return await apiRequest(`/sms/templates/${id}`, 'PUT', template);
  },

  // Supprimer un template SMS
  deleteSMSTemplate: async (id: string) => {
    return await apiRequest(`/sms/templates/${id}`, 'DELETE');
  },

  // Envoyer des SMS en lot (pour les relances)
  sendBulkSMS: async (recipients: Array<{ to: string; message: string }>) => {
    return await apiRequest('/sms/bulk', 'POST', { recipients });
  },

  // Vérifier le statut d'un SMS
  getSMSStatus: async (smsId: string) => {
    return await apiRequest(`/sms/status/${smsId}`, 'GET');
  },

  // Templates prédéfinis pour les relances
  getDefaultTemplates: (): SMSTemplate[] => [
    {
      id: 'payment-reminder-1',
      name: 'Première relance',
      content: 'Bonjour {parent_name}, votre enfant {student_name} a une facture en attente de {amount} MAD. Échéance: {due_date}. Merci de régulariser.',
      variables: ['parent_name', 'student_name', 'amount', 'due_date'],
      isActive: true
    },
    {
      id: 'payment-reminder-2',
      name: 'Deuxième relance',
      content: 'Bonjour {parent_name}, rappel: facture de {amount} MAD pour {student_name} en retard depuis {days_overdue} jours. Merci de régulariser rapidement.',
      variables: ['parent_name', 'student_name', 'amount', 'days_overdue'],
      isActive: true
    },
    {
      id: 'payment-reminder-3',
      name: 'Relance urgente',
      content: 'URGENT: Facture de {amount} MAD pour {student_name} en retard depuis {days_overdue} jours. Procédure de recouvrement en cours.',
      variables: ['parent_name', 'student_name', 'amount', 'days_overdue'],
      isActive: true
    },
    {
      id: 'payment-confirmation',
      name: 'Confirmation de paiement',
      content: 'Merci {parent_name}! Paiement de {amount} MAD pour {student_name} reçu et confirmé. Facture #{invoice_number} réglée.',
      variables: ['parent_name', 'student_name', 'amount', 'invoice_number'],
      isActive: true
    }
  ]
};
