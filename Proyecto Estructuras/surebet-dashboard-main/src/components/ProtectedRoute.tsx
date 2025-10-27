import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("betmaster_user");
    if (!user) {
      navigate("/");
    }
  }, [navigate]);

  const user = localStorage.getItem("betmaster_user");
  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;