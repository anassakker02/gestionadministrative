import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ nom: "", prenom: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({ old: "", new: "" });

  useEffect(() => {
    if (user) {
      setForm({ nom: user.nom, prenom: user.prenom, email: user.email });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await userService.updateProfile(user.id, form);
      updateUser(form);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été mises à jour avec succès",
      });
      setEditMode(false);
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await userService.changePassword(user.id, {
        oldPassword: passwords.old,
        newPassword: passwords.new,
      });
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès",
      });
      setPasswords({ old: "", new: "" });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Erreur lors du changement de mot de passe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Chargement du profil...</div>;

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Mon profil</CardTitle>
        </CardHeader>
        <CardContent>
          {editMode ? (
            <div className="space-y-4">
              <Input
                name="nom"
                value={form.nom}
                onChange={handleChange}
                placeholder="Nom"
              />
              <Input
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                placeholder="Prénom"
              />
              <Input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditMode(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div>
                <b>Nom:</b> {user.nom}
              </div>
              <div>
                <b>Prénom:</b> {user.prenom}
              </div>
              <div>
                <b>Email:</b> {user.email}
              </div>
              <Button variant="outline" onClick={() => setEditMode(true)}>
                Modifier mes infos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Changer le mot de passe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Input
              type="password"
              placeholder="Ancien mot de passe"
              value={passwords.old}
              onChange={(e) =>
                setPasswords({ ...passwords, old: e.target.value })
              }
            />
            <Input
              type="password"
              placeholder="Nouveau mot de passe"
              value={passwords.new}
              onChange={(e) =>
                setPasswords({ ...passwords, new: e.target.value })
              }
            />
            <Button onClick={handlePasswordChange} disabled={loading}>
              {loading ? "Modification..." : "Modifier"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
