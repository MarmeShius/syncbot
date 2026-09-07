import { useEffect, useState } from "react";
import { authApi } from "../api";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("syncbot_user") || "null"));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("syncbot_token")));

  useEffect(() => {
    if (!localStorage.getItem("syncbot_token")) return;
    authApi.me().then(({ user: currentUser }) => setUser(currentUser)).catch(() => logout()).finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const result = await authApi.login(credentials);
    localStorage.setItem("syncbot_token", result.token);
    localStorage.setItem("syncbot_user", JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }

  async function register(details) {
    const result = await authApi.register(details);
    localStorage.setItem("syncbot_token", result.token);
    localStorage.setItem("syncbot_user", JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }

  function logout() {
    localStorage.removeItem("syncbot_token");
    localStorage.removeItem("syncbot_user");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}
