import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Mail, 
  MessageSquare, 
  Eye,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { smsService, SMSTemplate } from '@/services/smsService';

interface NotificationTemplatesProps {
  type: 'email' | 'sms';
  templates?: SMSTemplate[];
  onTemplateUpdate?: () => void;
}

const NotificationTemplates: React.FC<NotificationTemplatesProps> = ({
  type,
  templates = [],
  onTemplateUpdate
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SMSTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    variables: [] as string[],
    isActive: true
  });
  const { toast } = useToast();

  // Templates par défaut
  const defaultTemplates = smsService.getDefaultTemplates();
  const allTemplates = [...templates, ...defaultTemplates];

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      content: '',
      variables: [],
      isActive: true
    });
    setIsDialogOpen(true);
  };

  const handleEditTemplate = (template: SMSTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      variables: template.variables,
      isActive: template.isActive
    });
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      if (editingTemplate) {
        await smsService.updateSMSTemplate(editingTemplate.id, formData);
        toast({
          title: "Template mis à jour",
          description: "Le template a été mis à jour avec succès."
        });
      } else {
        await smsService.createSMSTemplate(formData);
        toast({
          title: "Template créé",
          description: "Le nouveau template a été créé avec succès."
        });
      }
      
      setIsDialogOpen(false);
      onTemplateUpdate?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await smsService.deleteSMSTemplate(templateId);
      toast({
        title: "Template supprimé",
        description: "Le template a été supprimé avec succès."
      });
      onTemplateUpdate?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression.",
        variant: "destructive"
      });
    }
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      variables: extractVariables(content)
    }));
  };

  const copyTemplate = (template: SMSTemplate) => {
    navigator.clipboard.writeText(template.content);
    toast({
      title: "Template copié",
      description: "Le contenu du template a été copié dans le presse-papiers."
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Templates de {type === 'email' ? 'Email' : 'SMS'}
          </h2>
          <p className="text-gray-600">
            Gérez vos templates de notifications personnalisés
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allTemplates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                  {template.id.startsWith('payment-') && (
                    <Badge variant="outline">Défaut</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Contenu:</p>
                <p className="text-sm bg-gray-50 p-3 rounded-md line-clamp-3">
                  {template.content}
                </p>
              </div>
              
              {template.variables.length > 0 && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">Variables:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline" className="text-xs">
                        {`{${variable}}`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditTemplate(template)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyTemplate(template)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {!template.id.startsWith('payment-') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center">
                  {type === 'email' ? (
                    <Mail className="h-4 w-4 text-blue-600" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog pour créer/éditer un template */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Modifier le template' : 'Nouveau template'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom du template</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Première relance de paiement"
              />
            </div>

            <div>
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Ex: Bonjour {parent_name}, votre enfant {student_name} a une facture en attente..."
                rows={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                Utilisez des variables entre accolades: {`{parent_name}`, `{student_name}`, `{amount}`}
              </p>
            </div>

            {formData.variables.length > 0 && (
              <div>
                <Label>Variables détectées</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.variables.map((variable) => (
                    <Badge key={variable} variant="outline">
                      {`{${variable}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Template actif</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSaveTemplate}>
                {editingTemplate ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationTemplates;
