import { useEffect, useState } from "react";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { FiArrowLeft } from "react-icons/fi";
import { Link } from "react-router-dom";
import ReviewCard from "../components/ReviewCard.jsx";
import { firebaseApp } from "../firebase";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!db) {
      setError("Guest stories aren't available because Firebase isn't configured.");
      setLoading(false);
      return undefined;
    }

    const allReviewsQuery = query(
      collection(db, "reviews"),
      where("isVisible", "==", true),
      orderBy("createdAt", "desc"),
    );

    return onSnapshot(
      allReviewsQuery,
      (snapshot) => {
        setReviews(snapshot.docs.map((review) => ({ id: review.id, ...review.data() })));
        setError("");
        setLoading(false);
      },
      (snapshotError) => {
        console.error("Could not load all guest reviews:", snapshotError);
        setError("Guest stories aren't available right now. Please try again in a moment.");
        setLoading(false);
      },
    );
  }, []);

  return (
    <main className="reviews-page reviews-section section-wrap">
      <Link className="reviews-back-link" to="/">
        <FiArrowLeft aria-hidden="true" /> Back to home
      </Link>
      <div className="reviews-heading">
        <div>
          <span className="eyebrow">Notes from the road</span>
          <h1>All guest stories</h1>
        </div>
        <p>Read stories and recommendations shared by fellow travelers.</p>
      </div>

      {error ? (
        <p className="reviews-message form-error" role="alert">{error}</p>
      ) : loading ? (
        <p className="reviews-message" role="status">Gathering stories from the island…</p>
      ) : reviews.length === 0 ? (
        <p className="reviews-message">No visible stories yet. Be the first to share yours.</p>
      ) : (
        <div className="reviews-grid">
          {reviews.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      )}
    </main>
  );
}
