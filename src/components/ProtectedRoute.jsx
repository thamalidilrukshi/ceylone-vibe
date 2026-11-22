import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [accessStatus, setAccessStatus] = useState("checking");

  useEffect(() => {
    if (!auth) {
      setAccessStatus("denied");
      return undefined;
    }

    let active = true;
    let checkId = 0;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        const currentCheckId = ++checkId;

        if (!user) {
          setAccessStatus("denied");
          return;
        }

        setAccessStatus("checking");

        try {
          const tokenResult = await user.getIdTokenResult(true);
          if (active && currentCheckId === checkId) {
            setAccessStatus(tokenResult.claims.admin === true ? "allowed" : "denied");
          }
        } catch (error) {
          console.error("Unable to verify admin authorization:", error);
          if (active && currentCheckId === checkId) {
            setAccessStatus("denied");
          }
        }
      },
      (error) => {
        console.error("Unable to observe Firebase authentication state:", error);
        if (active) setAccessStatus("denied");
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (accessStatus === "checking") {
    return (
      <main
        className="grid min-h-[60vh] place-items-center text-sm text-slate-600"
        role="status"
        aria-live="polite"
      >
        <span className="flex items-center gap-3">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-leaf"
            aria-hidden="true"
          />
          Verifying admin access…
        </span>
      </main>
    );
  }

  if (accessStatus === "denied") return <Navigate to="/" replace />;

  return children;
}
