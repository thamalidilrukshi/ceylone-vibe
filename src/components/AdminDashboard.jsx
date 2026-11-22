import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getIdTokenResult } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import {
  FiCheck,
  FiClock,
  FiImage,
  FiLayout,
  FiLogOut,
  FiMessageSquare,
  FiRefreshCw,
  FiShield,
  FiTrash2,
  FiUploadCloud,
  FiX,
} from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth, firebaseApp } from "../firebase";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

// Cloudinary විස්තර දෙක මෙතනට එකතු කරලා තියෙන්නේ
const CLOUDINARY_CLOUD_NAME = "fuprje2q";
const CLOUDINARY_UPLOAD_PRESET = "islandrove_images";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_SLOTS = [
  { id: "mainHero", label: "Main hero image", hint: "Large background image at the top of the home page." },
  { id: "vehicleImage", label: "Vehicle image", hint: "Used in both the vehicle showcase and hero vehicle card." },
];
const cloudinaryConfigured =
  CLOUDINARY_CLOUD_NAME !== "YOUR_CLOUD_NAME" &&
  CLOUDINARY_UPLOAD_PRESET !== "YOUR_UNSIGNED_UPLOAD_PRESET";
const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: FiLayout },
  { id: "reviews", label: "Manage Reviews", icon: FiMessageSquare },
  { id: "images", label: "Manage Images", icon: FiImage },
];

function formatReviewDate(timestamp) {
  if (!timestamp?.toDate) return "Date unavailable";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(timestamp.toDate());
}

function AdminLoading({ message }) {
  return (
    <main className="grid min-h-[60vh] place-items-center px-6 text-center">
      <div>
        <FiRefreshCw className="mx-auto mb-4 animate-spin text-2xl text-leaf" aria-hidden="true" />
        <p className="text-sm text-slate-600">{message}</p>
      </div>
    </main>
  );
}

function AdminDenied({ onSignOut }) {
  const [signOutError, setSignOutError] = useState("");

  async function handleSignOut() {
    try {
      await onSignOut();
    } catch (error) {
      console.error("Could not sign out from the admin dashboard:", error);
      setSignOutError("Sign out failed. Please try again.");
    }
  }

  return (
    <main className="grid min-h-[70vh] place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
          <FiShield className="text-2xl" aria-hidden="true" />
        </span>
        <h1 className="font-display text-2xl font-bold text-ink">Admin access required</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This account is signed in, but it does not have the administrator permission.
        </p>
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf"
        >
          <FiLogOut aria-hidden="true" /> Sign out
        </button>
        {signOutError && <p className="mt-3 text-sm text-rose-700" role="alert">{signOutError}</p>}
      </section>
    </main>
  );
}

function StatCard({ title, value, icon: Icon, tone }) {
  const toneStyles = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 font-display text-3xl font-bold text-ink">{value}</p>
        </div>
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${toneStyles[tone]}`}>
          <Icon className="text-xl" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

function ReviewTable({ reviews, busyReviewId, onVisibilityChange, onDelete }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 px-6 py-14 text-center text-sm text-slate-500">
        There are no guest reviews yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-[900px] w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-4 font-semibold">Name</th>
            <th className="px-5 py-4 font-semibold">Rating</th>
            <th className="px-5 py-4 font-semibold">Comment</th>
            <th className="px-5 py-4 font-semibold">Date</th>
            <th className="px-5 py-4 font-semibold">Status</th>
            <th className="px-5 py-4 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {reviews.map((review) => {
            const isVisible = review.isVisible === true;
            const isBusy = busyReviewId === review.id;

            return (
              <tr key={review.id} className="align-top hover:bg-slate-50/70">
                <td className="max-w-40 px-5 py-4 text-sm font-semibold text-slate-800">
                  <span className="break-words">{review.displayName || "Traveler"}</span>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-amber-600">
                  <span aria-label={`${review.rating || 5} out of 5 stars`}>
                    {"★".repeat(Math.max(0, Math.min(5, Number(review.rating) || 5)))}
                  </span>
                  <span className="ml-1 text-slate-500">{review.rating || 5}/5</span>
                </td>
                <td className="max-w-lg px-5 py-4 text-sm leading-6 text-slate-600">
                  <p className="whitespace-pre-wrap break-words">{review.comment || "No comment"}</p>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                  {formatReviewDate(review.createdAt)}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${isVisible ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"}`}>
                    {isVisible ? "Approved" : "Hidden"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onVisibilityChange(review)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-leaf hover:text-leaf disabled:cursor-wait disabled:opacity-50"
                    >
                      {isVisible ? <FiX aria-hidden="true" /> : <FiCheck aria-hidden="true" />}
                      {isVisible ? "Hide" : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(review)}
                      disabled={isBusy}
                      aria-label={`Delete review by ${review.displayName || "Traveler"}`}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:cursor-wait disabled:opacity-50"
                    >
                      <FiTrash2 aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ImageManager({ images, onUpload, uploadingSlot }) {
  const [validationError, setValidationError] = useState("");

  function handleFileChange(event, slot) {
    const file = event.target.files?.[0];
    event.target.value = "";
    setValidationError("");
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setValidationError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setValidationError("Choose an image smaller than 5 MB.");
      return;
    }
    onUpload(file, slot);
  }

  return (
    <div>
      {!cloudinaryConfigured && (
        <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800" role="status">
          Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET at the top of AdminDashboard.jsx to enable uploads.
        </p>
      )}
      {validationError && (
        <p className="mb-5 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
          {validationError}
        </p>
      )}
      <div className="grid gap-5 xl:grid-cols-2">
        {IMAGE_SLOTS.map((slot) => {
          const isUploading = uploadingSlot === slot.id;
          const imageUrl = slot.id === "vehicleImage"
            ? images.vehicleImage || images.vehicleShowcase || images.vehicleCard || ""
            : images[slot.id] || "";

          return (
            <article key={slot.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex h-48 items-center justify-center bg-slate-100">
                {imageUrl ? (
                  <img className="h-full w-full object-cover" src={imageUrl} alt={slot.label} />
                ) : (
                  <div className="text-center text-slate-400">
                    <FiImage className="mx-auto mb-2 text-3xl" aria-hidden="true" />
                    <span className="text-sm">No image uploaded</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-bold text-ink">{slot.label}</h3>
                <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{slot.hint}</p>
                <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf">
                  {isUploading ? <FiRefreshCw className="animate-spin" aria-hidden="true" /> : <FiUploadCloud aria-hidden="true" />}
                  {isUploading ? "Uploading…" : "Choose and upload"}
                  <input
                    className="sr-only"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={Boolean(uploadingSlot) || !cloudinaryConfigured}
                    onChange={(event) => handleFileChange(event, slot.id)}
                  />
                </label>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function AdminWorkspace({ user }) {
  const [activeSection, setActiveSection] = useState("overview");
  const [reviews, setReviews] = useState([]);
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyReviewId, setBusyReviewId] = useState("");
  const [uploadingSlot, setUploadingSlot] = useState("");

  const loadDashboardData = useCallback(async () => {
    if (!db) return;
    setLoading(true);
    setLoadError("");
    try {
      const [reviewSnapshot, settingsSnapshot] = await Promise.all([
        getDocs(collection(db, "reviews")),
        getDoc(doc(db, "site_settings", "homepage")),
      ]);
      const sortedReviews = reviewSnapshot.docs
        .map((reviewDocument) => ({ id: reviewDocument.id, ...reviewDocument.data() }))
        .sort((first, second) => (second.createdAt?.toMillis?.() || 0) - (first.createdAt?.toMillis?.() || 0));
      setReviews(sortedReviews);
      const savedImages = settingsSnapshot.data()?.images || {};
      setImages({
        ...savedImages,
        vehicleImage:
          savedImages.vehicleImage || savedImages.vehicleShowcase || savedImages.vehicleCard || "",
      });
    } catch (error) {
      console.error("Could not load admin dashboard data:", error);
      setLoadError("Dashboard data could not be loaded. Check your connection and permissions, then try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  async function handleVisibilityChange(review) {
    if (!db) return;
    setBusyReviewId(review.id);
    setActionError("");
    setNotice("");
    try {
      const isVisible = review.isVisible !== true;
      await updateDoc(doc(db, "reviews", review.id), { isVisible });
      setReviews((current) => current.map((item) => item.id === review.id ? { ...item, isVisible } : item));
      setNotice(isVisible ? "Review approved and published." : "Review hidden from the website.");
    } catch (error) {
      console.error("Could not update review visibility:", error);
      setActionError("Review status could not be changed. Check your admin permissions and try again.");
    } finally {
      setBusyReviewId("");
    }
  }

  async function handleDelete(review) {
    if (!db || !window.confirm(`Permanently delete the review by ${review.displayName || "Traveler"}?`)) return;
    setBusyReviewId(review.id);
    setActionError("");
    setNotice("");
    try {
      await deleteDoc(doc(db, "reviews", review.id));
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setNotice("Review permanently deleted.");
    } catch (error) {
      console.error("Could not delete guest review:", error);
      setActionError("Review could not be deleted. Check your admin permissions and try again.");
    } finally {
      setBusyReviewId("");
    }
  }

  async function handleImageUpload(file, slot) {
    if (!db || !cloudinaryConfigured) {
      setActionError("Configure the Cloudinary cloud name and unsigned upload preset before uploading.");
      return;
    }
    setUploadingSlot(slot);
    setActionError("");
    setNotice("");
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      uploadData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: uploadData },
      );
      const uploadResult = await response.json();
      if (!response.ok || !uploadResult.secure_url) {
        throw new Error(uploadResult.error?.message || "Cloudinary did not return a secure image URL.");
      }

      await setDoc(
        doc(db, "site_settings", "homepage"),
        {
          images: { [slot]: uploadResult.secure_url },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      setImages((current) => ({ ...current, [slot]: uploadResult.secure_url }));
      setNotice("Image uploaded. The public website will use it automatically.");
    } catch (error) {
      console.error("Could not upload website image to Cloudinary:", error);
      setActionError(error.message || "Image upload failed. Check Cloudinary configuration and try again.");
    } finally {
      setUploadingSlot("");
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Could not sign out from the admin dashboard:", error);
      setActionError("Sign out failed. Please try again.");
    }
  }

  const approvedCount = reviews.filter((review) => review.isVisible === true).length;
  const pendingCount = reviews.length - approvedCount;

  if (loading) {
    return <AdminLoading message="Loading reviews and site images…" />;
  }

  return (
    <main className="min-h-[calc(100vh-80px)] bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-6">
          <div className="flex items-center gap-3 px-2 py-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-white">
              <FiShield aria-hidden="true" />
            </span>
            <div>
              <p className="font-display font-bold text-ink">Admin dashboard</p>
              <p className="max-w-40 truncate text-xs text-slate-500">{user.email || "Administrator"}</p>
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto lg:flex-col" aria-label="Admin dashboard navigation">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                aria-current={activeSection === id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${activeSection === id ? "bg-emerald-50 text-leaf" : "text-slate-600 hover:bg-slate-100 hover:text-ink"}`}
              >
                <Icon className="text-lg" aria-hidden="true" />
                {label}
              </button>
            ))}
          </nav>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-5 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
          >
            <FiLogOut className="text-lg" aria-hidden="true" /> Sign out
          </button>
        </aside>

        <section className="min-w-0">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-leaf">Ceylone Vibe</p>
              <h1 className="mt-1 font-display text-3xl font-bold text-ink">
                {activeSection === "overview" ? "Overview" : activeSection === "reviews" ? "Manage reviews" : "Manage images"}
              </h1>
            </div>
            <button
              type="button"
              onClick={loadDashboardData}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-leaf hover:text-leaf"
            >
              <FiRefreshCw aria-hidden="true" /> Refresh
            </button>
          </header>

          {(loadError || actionError || notice) && (
            <div
              className={`mb-5 rounded-xl px-4 py-3 text-sm ${loadError || actionError ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}
              role={loadError || actionError ? "alert" : "status"}
            >
              {loadError || actionError || notice}
            </div>
          )}

          {loadError ? (
            <button
              type="button"
              onClick={loadDashboardData}
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-leaf"
            >
              Try again
            </button>
          ) : activeSection === "overview" ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatCard title="All reviews" value={reviews.length} icon={FiMessageSquare} tone="slate" />
                <StatCard title="Approved and public" value={approvedCount} icon={FiCheck} tone="green" />
                <StatCard title="Hidden / awaiting approval" value={pendingCount} icon={FiClock} tone="amber" />
              </div>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-bold text-ink">Recent reviews</h2>
                    <p className="mt-1 text-sm text-slate-500">The latest guest stories from Firestore.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveSection("reviews")}
                    className="rounded-lg px-3 py-2 text-sm font-semibold text-leaf transition hover:bg-emerald-50"
                  >
                    Review all
                  </button>
                </div>
                <ReviewTable
                  reviews={reviews.slice(0, 5)}
                  busyReviewId={busyReviewId}
                  onVisibilityChange={handleVisibilityChange}
                  onDelete={handleDelete}
                />
              </section>
            </div>
          ) : activeSection === "reviews" ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="font-display text-xl font-bold text-ink">Guest reviews</h2>
                <p className="mt-1 text-sm text-slate-500">Approve stories to publish them, or hide and delete them.</p>
              </div>
              <ReviewTable
                reviews={reviews}
                busyReviewId={busyReviewId}
                onVisibilityChange={handleVisibilityChange}
                onDelete={handleDelete}
              />
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="font-display text-xl font-bold text-ink">Website images</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Upload JPEG, PNG, or WebP files up to 5 MB. Image URLs are saved to the public site settings.
                </p>
              </div>
              <ImageManager
                images={images}
                onUpload={handleImageUpload}
                uploadingSlot={uploadingSlot}
              />
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AdminDashboard({ user, authLoading }) {
  const [adminStatus, setAdminStatus] = useState("checking");
  const [verificationError, setVerificationError] = useState("");

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      if (!user) {
        setAdminStatus("signed-out");
        return;
      }

      setAdminStatus("checking");
      setVerificationError("");
      try {
        const tokenResult = await getIdTokenResult(user, true);
        if (active) {
          setAdminStatus(tokenResult.claims.admin === true ? "admin" : "not-admin");
        }
      } catch (error) {
        console.error("Could not verify admin permissions:", error);
        if (active) {
          setVerificationError("Admin permissions could not be verified. Check your connection and sign in again.");
          setAdminStatus("verification-error");
        }
      }
    }

    verifyAdmin();
    return () => {
      active = false;
    };
  }, [user]);

  if (authLoading || adminStatus === "checking") {
    return <AdminLoading message="Verifying administrator access…" />;
  }
  if (!user || adminStatus === "signed-out") {
    return <Navigate to="/auth" replace state={{ from: "/loku" }} />;
  }
  if (adminStatus === "not-admin") {
    return <AdminDenied onSignOut={() => signOut(auth)} />;
  }
  if (adminStatus === "verification-error") {
    return (
      <main className="grid min-h-[60vh] place-items-center px-6">
        <p className="max-w-md rounded-xl bg-rose-50 p-5 text-sm text-rose-700" role="alert">
          {verificationError}
        </p>
      </main>
    );
  }
  return <AdminWorkspace user={user} />;
}