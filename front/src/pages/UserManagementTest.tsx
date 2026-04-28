import React from "react";
import UserManagement from "@/components/UserManagement";

const UserManagementTestPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Test - Gestion des Utilisateurs
      </h1>
      <UserManagement />
    </div>
  );
};

export default UserManagementTestPage;
