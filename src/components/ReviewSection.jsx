import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiMessageCircle } from "react-icons/fi";
import { firebaseApp } from "../firebase";
import { getFirestore } from "firebase/firestore";
import ReviewCard from "./ReviewCard.jsx";

if (!firebaseApp) {
  throw new Error("ReviewSection must only load when Firebase is configured.");
}

const db = getFirestore(firebaseApp);

const reviewQuery = query(
  collection(db, "reviews"),
  where("isVisible", "==", true),
  orderBy("createdAt", "desc"),
  limit(5),
);

function StarRating({ value, onChange, interactive = false }) {
  return (
    <div
      className={`star-rating${interactive ? " star-rating-interactive" : ""}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={interactive ? `Choose a rating, currently ${value} of 5` : `${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        interactive ? (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onClick={() => onChange(star)}
            className={star <= value ? "star-filled" : ""}
          >
            ★
          </button>
        ) : (
          <span key={star} className={star <= value ? "star-filled" : ""}>★</span>
        )
      ))}
    </div>
  );
}

function ReviewAvatar({ photoURL, displayName }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initial = (displayName || "T").charAt(0).toUpperCase();

  if (photoURL && !imageFailed) {
    return (
      <img
        className="review-avatar-image"
        src={photoURL}
        alt=""
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <span className="review-avatar">{initial}</span>;
}

export default function ReviewSection({ user }) {
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      reviewQuery,
      (snapshot) => {
        setReviews(snapshot.docs.map((review) => ({ id: review.id, ...review.data() })));
        setLoadError("");
        setReviewsLoading(false);
      },
      (error) => {
        console.error("Could not load guest reviews:", error);
        setLoadError("Guest stories aren't available right now. Please try again in a moment.");
        setReviewsLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user) return;
    const cleanComment = comment.trim();
    if (!cleanComment) {
      setFormError("Add a few words about your experience before sharing.");
      return;
    }

    setSubmitting(true);
    setFormError("");
    setSubmitted(false);
    try {
      await addDoc(collection(db, "reviews"), {
        uid: user.uid,
        displayName: user.displayName?.trim() || user.email?.split("@")[0] || "Traveler",
        photoURL: user.photoURL || "",
        rating,
        comment: cleanComment,
        isVisible: true,
        createdAt: serverTimestamp(),
      });
      setComment("");
      setRating(5);
      setSubmitted(true);
    } catch (error) {
      console.error("Could not save guest review:", error);
      setFormError("Your review couldn't be saved. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="reviews-section section-wrap">
      <div className="reviews-heading">
        <div>
          <span className="eyebrow">Notes from the road</span>
          <h2>Stories worth<br className="mobile-break" /> bringing home.</h2>
        </div>
        <p>Some journeys stay with you long after the suitcase is unpacked. Here are a few from our fellow wanderers.</p>
      </div>

      {user ? (
        <form className="review-form" onSubmit={handleSubmit}>
          <div className="review-form-intro">
            <ReviewAvatar
              photoURL={user.photoURL}
              displayName={user.displayName || user.email}
            />
            <div>
              <strong>How was your island journey?</strong>
              <span>Your note might inspire someone's next adventure.</span>
            </div>
          </div>
          <StarRating value={rating} onChange={setRating} interactive />
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Tell us what made your trip special…"
            rows={3}
            maxLength={1000}
            aria-label="Your review"
          />
          <div className="review-form-footer">
            <span>{comment.length}/1000</span>
            <button type="submit" className="button button-dark" disabled={submitting}>
              {submitting ? "Sharing…" : "Share your story"} <FiArrowUpRight />
            </button>
          </div>
          {formError && <p className="form-error" role="alert">{formError}</p>}
          {submitted && <p className="form-success" role="status">Thanks for sharing a little piece of your journey.</p>}
        </form>
      ) : (
        <div className="review-signin">
          <FiMessageCircle aria-hidden="true" />
          <p><strong>Been on an island adventure?</strong> Sign in to leave a note for the next traveler.</p>
          <Link to="/auth">Sign in to share <FiArrowUpRight /></Link>
        </div>
      )}

      {loadError ? (
        <p className="reviews-message form-error" role="alert">{loadError}</p>
      ) : reviewsLoading ? (
        <p className="reviews-message">Gathering stories from the island…</p>
      ) : reviews.length === 0 ? (
        <p className="reviews-message">Your story could be the first. Come back after your trip and tell us all about it.</p>
      ) : (
        <>
          <div className="reviews-grid">
            {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
          </div>
          <p className="reviews-all-link">
            <Link to="/reviews">View all comments <FiArrowUpRight aria-hidden="true" /></Link>
          </p>
        </>
      )}
    </section>
  );
}
