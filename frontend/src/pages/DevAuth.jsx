import React from "react";
import { registerDeveloper, loginDeveloper } from "../api";
import { useAuth } from "../context/AuthContext";
import AuthScreen from "../components/AuthScreen";

export default function DevAuth({ onBack, onLoginSuccess }) {
  const { login } = useAuth();

  const handleLogin = async ({ username, password }) => {
    const data = await loginDeveloper({ username, password });
    login(data.token, data.developer);
    onLoginSuccess();
  };

  const handleRegister = async ({ username, password, confirmPassword }) => {
    await registerDeveloper({ username, password, confirmPassword });
  };

  return (
    <AuthScreen
      title="DÉVELOPPEUR"
      onBack={onBack}
      onSubmitLogin={handleLogin}
      onSubmitRegister={handleRegister}
    />
  );
}
