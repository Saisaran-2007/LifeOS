import { useEffect, useState } from "react";
import axios from "axios";
import Login from "./Login";
import App from "./App";

const API_URL = "http://127.0.0.1:8000";

function AuthGate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  const fetchUser = (token) => {
    return axios
      .get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setUser(res.data);
        setAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem("lifeos_token");
        setUser(null);
        setAuthenticated(false);
      });
  };

  useEffect(() => {
    const token = localStorage.getItem("lifeos_token");

    if (!token) {
      setChecking(false);
      return;
    }

    fetchUser(token).finally(() => {
      setChecking(false);
    });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("lifeos_token");
    setUser(null);
    setAuthenticated(false);
  };

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#080a0f",
          color: "#8b5cf6",
          fontFamily: "Inter, sans-serif",
          fontSize: "12px",
        }}
      >
        Loading LifeOS...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <Login
        onLogin={(token) => {
          fetchUser(token);
        }}
      />
    );
  }

  return <App user={user} onLogout={handleLogout} />;
}

export default AuthGate;