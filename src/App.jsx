import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Navbar from "./components/Navbar.jsx";
import Auth from "./components/Auth.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";

const AdminDashboard = lazy(() => import("./components/AdminDashboard.jsx"));
const Reviews = lazy(() => import("./pages/Reviews.jsx"));

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }

    return onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      },
      (error) => {
        console.error("Unable to observe Firebase authentication state:", error);
        setAuthLoading(false);
      },
    );
  }, []);

  return (
    <div className="min-h-screen bg-sand">
      <Navbar user={user} />
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route
          path="/reviews"
          element={(
            <Suspense fallback={<div className="reviews-loading section-wrap">Loading guest stories…</div>}>
              <Reviews />
            </Suspense>
          )}
        />
        <Route
          path="/auth"
          element={<Auth user={user} authLoading={authLoading} />}
        />
        <Route
          path="/loku"
          element={(
            <ProtectedRoute>
              <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-sm text-slate-600">Loading admin dashboard…</div>}>
                <AdminDashboard user={user} authLoading={authLoading} />
              </Suspense>
            </ProtectedRoute>
          )}
        />
        <Route path="*" element={<Home user={user} />} />
      </Routes>
    </div>
  );
}
