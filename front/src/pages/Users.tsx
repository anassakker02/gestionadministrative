import React, { useEffect, useState } from "react";
import { userService, blockUser } from "../services/userService";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Dialog } from "../components/ui/dialog"; // Assurez-vous d'avoir ce composant

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "comptable", label: "Comptable" },
  { value: "etudiant", label: "Étudiant" },
];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    userService.getAllUsers().then((data) => {
      setUsers(Array.isArray(data) ? data : []);
    });
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (userService.updateUserRole) {
      await userService.updateUserRole(userId, newRole);
    }
    setUsers((users) =>
      users.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const handleBlock = async (userId: string, blocked: boolean) => {
    await blockUser(userId, blocked);
    setUsers((users) =>
      users.map((u) => (u.id === userId ? { ...u, blocked } : u))
    );
  };

  const handleShowDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Liste des utilisateurs</h2>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Bloqué</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.nom}</td>
              <td>{user.email}</td>
              <td>
                <Select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                >
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </td>
              <td>
                <Button
                  variant={user.blocked ? "destructive" : "outline"}
                  onClick={() => handleBlock(user.id, !user.blocked)}
                >
                  {user.blocked ? "Débloquer" : "Bloquer"}
                </Button>
              </td>
              <td>
                <Button onClick={() => handleShowDetails(user)}>Détails</Button>
                <Button onClick={() => handleShowDetails(user)}>
                  Modifier
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal d'affichage/modification */}
      {showModal && selectedUser && (
        <Dialog open={showModal} onOpenChange={handleCloseModal}>
          <div className="p-4">
            <h3 className="font-bold mb-2">Détails de l'utilisateur</h3>
            <p>
              <strong>Nom:</strong> {selectedUser.nom}
            </p>
            <p>
              <strong>Email:</strong> {selectedUser.email}
            </p>
            <p>
              <strong>Rôle:</strong> {selectedUser.role}
            </p>
            <p>
              <strong>Bloqué:</strong> {selectedUser.blocked ? "Oui" : "Non"}
            </p>
            {/* Ajoutez ici un formulaire pour modifier si besoin */}
            <Button onClick={handleCloseModal} className="mt-4">
              Fermer
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
