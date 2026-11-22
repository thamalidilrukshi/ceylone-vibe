import { useState } from "react";

function StarRating({ value }) {
  return (
    <div className="star-rating" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= value ? "star-filled" : ""}>★</span>
      ))}
    </div>
  );
}

function formatReviewDate(timestamp) {
  if (!timestamp?.toDate) return "Just now";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(timestamp.toDate());
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

export default function ReviewCard({ review }) {
  return (
    <article className="review-card" key={review.id}>
      <div className="review-card-top">
        <StarRating value={review.rating || 5} />
        <span>{formatReviewDate(review.createdAt)}</span>
      </div>
      <p className="review-quote">“{review.comment}”</p>
      <div className="review-author">
        <ReviewAvatar
          photoURL={review.photoURL}
          displayName={review.displayName}
        />
        <strong>{review.displayName || "Traveler"}</strong>
      </div>
    </article>
  );
}
