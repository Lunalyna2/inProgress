import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

type Props = {
  children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const token = localStorage.getItem("userToken");

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}