import React from "react";
import { registerStudent, loginStudent } from "../api";
import { useAuth } from "../context/AuthContext";
import AuthScreen from "../components/AuthScreen";

export default function StudentAuth({ onBack, onLoginSuccess }) {
  const { login } = useAuth();

  const handleLogin = async ({ username, password }) => {
    const data = await loginStudent({ username, password });
    login(data.token, data.student, "student");
    onLoginSuccess();
  };

  const handleRegister = async ({ username, password, confirmPassword }) => {
    await registerStudent({ username, password, confirmPassword });
  };

  return (
    <AuthScreen
      title="ÉLÈVE"
      onBack={onBack}
      onSubmitLogin={handleLogin}
      onSubmitRegister={handleRegister}
    />
  );
}
