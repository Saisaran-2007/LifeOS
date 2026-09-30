import { useState } from "react";
import axios from "axios";
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import "./Auth.css";

const API_URL = "http://127.0.0.1:8000";

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isLogin = mode === "login";

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isLogin) {
        const response = await axios.post(
          `${API_URL}/auth/login`,
          {
            email,
            password,
          }
        );

        const token = response.data.access_token;

        localStorage.setItem(
          "lifeos_token",
          token
        );

        onLogin(token);
      } else {
        await axios.post(
          `${API_URL}/auth/register`,
          {
            name,
            email,
            password,
          }
        );

        setSuccess(
          "Account created successfully. You can now sign in."
        );

        setMode("login");
        setPassword("");
      }
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        "Something went wrong. Please try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(
      isLogin
        ? "register"
        : "login"
    );

    setError("");
    setSuccess("");
  };

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one"></div>
      <div className="auth-orb auth-orb-two"></div>

      <div className="auth-layout">

        {/* LEFT SIDE */}

        <div className="auth-brand-side">

          <div className="auth-brand">
            <div className="auth-logo">
              <Sparkles size={23} />
            </div>

            <div>
              <strong>LifeOS</strong>
              <span>
                Personal Command Center
              </span>
            </div>
          </div>

          <div className="auth-hero">
            <span className="auth-eyebrow">
              YOUR LIFE. ONE SYSTEM.
            </span>

            <h1>
              Everything important.
              <br />
              <span>One place.</span>
            </h1>

            <p>
              Organize your tasks, goals, habits,
              projects, deadlines and expenses —
              then let AI help you understand your day.
            </p>
          </div>

          <div className="auth-features">
            <div>
              <CheckCircle2 size={16} />
              <span>
                Smart daily planning
              </span>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <span>
                AI-powered insights
              </span>
            </div>

            <div>
              <CheckCircle2 size={16} />
              <span>
                One personal dashboard
              </span>
            </div>
          </div>
        </div>

        {/* LOGIN CARD */}

        <div className="auth-card-wrapper">

          <div className="auth-card">

            <div className="auth-mobile-logo">
              <div className="auth-logo">
                <Sparkles size={19} />
              </div>

              <strong>LifeOS</strong>
            </div>

            <div className="auth-heading">

              <span className="auth-card-label">
                {isLogin
                  ? "WELCOME BACK"
                  : "GET STARTED"}
              </span>

              <h2>
                {isLogin
                  ? "Welcome back."
                  : "Create your LifeOS."}
              </h2>

              <p>
                {isLogin
                  ? "Sign in to continue to your personal command center."
                  : "Start organizing your life in one intelligent workspace."}
              </p>

            </div>

            {error && (
              <div className="auth-message auth-error">
                {error}
              </div>
            )}

            {success && (
              <div className="auth-message auth-success">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {!isLogin && (
                <div className="input-group">
                  <label>Name</label>

                  <div className="input-wrapper">
                    <User size={16} />

                    <input
                      type="text"
                      placeholder="Your name"
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label>Email</label>

                <div className="input-wrapper">
                  <Mail size={16} />

                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>

                <div className="input-wrapper">
                  <Lock size={16} />

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                    minLength={6}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="form-options">

                  <label className="remember">
                    <input type="checkbox" />
                    <span>
                      Remember me
                    </span>
                  </label>

                  <button
                    type="button"
                    className="forgot"
                  >
                    Forgot password?
                  </button>

                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={loading}
              >
                {loading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in"
                    : "Create account"}

                {!loading && (
                  <ArrowRight size={17} />
                )}
              </button>

            </form>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <div className="auth-switch">
              <span>
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </span>

              <button
                type="button"
                onClick={switchMode}
              >
                {isLogin
                  ? "Create one"
                  : "Sign in"}
              </button>
            </div>

            <div className="auth-footer">
              Your personal data stays inside
              your LifeOS account.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;