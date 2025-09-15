import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  useEffect(() => {
    localStorage.removeItem("user");
    // Si tu utilises un token, retire-le aussi
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);
  return <div>Déconnexion...</div>;
};

export default Logout;
