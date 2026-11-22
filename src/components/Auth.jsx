import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { FiArrowLeft, FiArrowUpRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { auth, firebaseConfigured, googleProvider } from "../firebase";

function getAuthErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "An account already exists for this email. Try logging in.",
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/invalid-credential": "Email or password is incorrect. Please try again.",
    "auth/weak-password": "Choose a password with at least 6 characters.",
    "auth/popup-closed-by-user": "The Google sign-in window was closed before finishing.",
    "auth/popup-blocked": "Your browser blocked the sign-in window. Allow pop-ups and try again.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
  };
  return messages[error.code] || "We couldn't complete sign-in. Please try again.";
}

export default function Auth({ user, authLoading }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!firebaseConfigured) {
    return (
      <main className="auth-page">
        <section className="auth-panel">
          <div className="auth-card">
            <span className="eyebrow">A little setup first</span>
            <h2>Connect your Firebase project.</h2>
            <p className="auth-intro">
              Add your Firebase web app settings to <code>.env.local</code>, then restart the development server to enable sign-in.
            </p>
            <Link to="/" className="button button-dark">Back to exploring <FiArrowUpRight /></Link>
          </div>
        </section>
      </main>
    );
  }

  if (!authLoading && user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) {
          await updateProfile(credential.user, { displayName: name.trim() });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Email authentication failed:", error);
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage("");
    setSubmitting(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Google authentication failed:", error);
      setErrorMessage(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-photo" role="img" aria-label="Sri Lankan tea country at sunrise">
        <div className="auth-photo-caption">
          <span className="eyebrow eyebrow-light">A little further, a little freer</span>
          <h1>Your island story<br />starts here.</h1>
          <p>One beautiful road at a time.</p>
        </div>
      </div>
      <section className="auth-panel">
        <Link to="/" className="back-link"><FiArrowLeft /> Back to exploring</Link>
        <div className="auth-card">
          <span className="eyebrow">{mode === "signup" ? "Join the journey" : "Welcome back"}</span>
          <h2>{mode === "signup" ? "Make room for wonder." : "Good to see you again."}</h2>
          <p className="auth-intro">
            {mode === "signup"
              ? "Create an account to share your island memories with fellow travelers."
              : "Log in to share a review and keep your travel plans close."}
          </p>

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleSignIn}
            disabled={submitting}
          >
            <FcGoogle aria-hidden="true" /> Continue with Google
          </button>
          <div className="auth-divider"><span>or with email</span></div>

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "signup" && (
              <label>
                Your name
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="How should we call you?"
                  maxLength={80}
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                required
              />
            </label>
            {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? "One moment…" : mode === "signup" ? "Create my account" : "Log in"}
              <FiArrowUpRight aria-hidden="true" />
            </button>
          </form>

          <p className="auth-switch">
            {mode === "signup" ? "Already have an account?" : "New to Ceylone Vibe?"}{" "}
            <button
              type="button"
              onClick={() => {
                setErrorMessage("");
                setMode(mode === "signup" ? "login" : "signup");
              }}
            >
              {mode === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
        </div>
        <p className="auth-footnote">By continuing, you agree to travel kindly and leave every place a little better.</p>
      </section>
    </main>
  );
}
