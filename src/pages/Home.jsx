import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  FiArrowDown,
  FiArrowUpRight,
  FiBriefcase,
  FiMap,
  FiMapPin,
  FiPhone,
  FiShield,
  FiUsers,
  FiWind,
  FiWifi,
} from "react-icons/fi";
import emailjs from "@emailjs/browser";
import { firebaseApp, firebaseConfigured } from "../firebase";
import SocialLinks from "../components/SocialLinks.jsx";
const ReviewSection = lazy(() => import("../components/ReviewSection.jsx"));

const EMAILJS_SERVICE_ID =
  import.meta.env.VITE_EMAILJS_SERVICE_ID || "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID =
  import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY =
  import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "YOUR_PUBLIC_KEY";

function DeferredReviews({ user }) {
  const sectionRef = useRef(null);
  const [isNearViewport, setIsNearViewport] = useState(false);

  if (!firebaseConfigured) {
    return (
      <section className="reviews-section section-wrap" id="reviews">
        <span className="eyebrow">Notes from the road</span>
        <h2>Stories worth bringing home.</h2>
        <p className="reviews-message">
          Connect Firebase to publish and read guest reviews. Setup steps are in the project README.
        </p>
      </section>
    );
  }

  useEffect(() => {
    const target = sectionRef.current;
    if (!target || !("IntersectionObserver" in window)) {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} id="reviews">
      {isNearViewport ? (
        <Suspense fallback={<div className="reviews-loading section-wrap">Loading guest stories…</div>}>
          <ReviewSection user={user} />
        </Suspense>
      ) : (
        <div className="reviews-loading" aria-hidden="true" />
      )}
    </div>
  );
}

const destinations = [
  {
    name: "Sigiriya",
    region: "Cultural Triangle",
    description: "Rise early for the ancient rock fortress and its far-reaching views.",
    image: "https://images.unsplash.com/photo-1612862862126-865765df2ded?auto=format&fit=crop&w=950&q=85",
    alt: "The ancient rock fortress of Sigiriya rising above the Sri Lankan jungle",
  },
  {
    name: "Ella",
    region: "Hill Country",
    description: "Tea-covered hills, cool air and the slow rhythm of the highlands.",
    image: "https://images.unsplash.com/photo-1566296314736-6eaac1ca0cb9?auto=format&fit=crop&w=950&q=85",
    alt: "A train winding through the lush Sri Lankan hill country near Ella",
  },
  {
    name: "Mirissa",
    region: "Southern Coast",
    description: "Settle into a beachside afternoon with warm sand and ocean air.",
    image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=950&q=85",
    alt: "A tropical Sri Lankan beach with clear blue water",
  },
  {
    name: "Yala",
    region: "Wildlife & Nature",
    description: "Head out with a local guide in search of the island's wild side.",
    image: "https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=950&q=85",
    alt: "A wild animal among greenery in Sri Lanka's national parks",
  },
];

function BookingForm() {
  const formRef = useRef(null);
  const [isSending, setIsSending] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState(null);
  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmissionMessage(null);

    const credentials = [
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      EMAILJS_PUBLIC_KEY,
    ];
    if (credentials.some((value) => value.startsWith("YOUR_"))) {
      setSubmissionMessage({
        type: "error",
        text: "The enquiry form isn't configured yet. Add your EmailJS credentials to .env.local.",
      });
      return;
    }

    if (!formRef.current) {
      setSubmissionMessage({
        type: "error",
        text: "The enquiry form is unavailable. Please refresh the page and try again.",
      });
      return;
    }

    setIsSending(true);
    try {
      await emailjs.sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        formRef.current,
        { publicKey: EMAILJS_PUBLIC_KEY },
      );
      formRef.current.reset();
      setSubmissionMessage({
        type: "success",
        text: "Thanks! Your enquiry has been sent. We’ll be in touch soon.",
      });
    } catch (error) {
      console.error("Could not send trip enquiry:", error);
      setSubmissionMessage({
        type: "error",
        text: "We couldn’t send your enquiry. Please try again in a moment.",
      });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="booking-card">
      <div className="booking-card-heading">
        <span className="booking-card-icon"><FiMapPin aria-hidden="true" /></span>
        <div>
          <strong>Your island, your way</strong>
          <span>Tell us a little about the journey you have in mind.</span>
        </div>
      </div>
      <form
        ref={formRef}
        className="booking-form grid grid-cols-1 md:grid-cols-2"
        onSubmit={handleSubmit}
      >
        <label>
          Full name
          <input
            name="user_name"
            autoComplete="name"
            placeholder="e.g. Alex Morgan"
            maxLength={100}
            required
          />
        </label>
        <label>
          Email address
          <input
            name="user_email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            maxLength={254}
            required
          />
        </label>
        <label>
          Contact number
          <input
            name="contact_number"
            type="tel"
            autoComplete="tel"
            placeholder="+94 77 123 4567"
            maxLength={30}
            required
          />
        </label>
        <label>
          Service type
          <select name="service_type" defaultValue="" required>
            <option value="" disabled>Select a journey</option>
            <option value="A day hire">A day hire</option>
            <option value="Airport Drop">Airport Drop</option>
            <option value="Round Trip">Round Trip</option>
          </select>
        </label>
        <label>
          Travel date
          <input name="date" type="date" min={minDate} required />
        </label>
        <label>
          Pickup time
          <input name="time" type="time" required />
        </label>
        <label>
          Pickup location
          <input
            name="start_location"
            autoComplete="street-address"
            placeholder="Hotel, airport, or address"
            maxLength={200}
            required
          />
        </label>
        <label>
          Drop-off location
          <input
            name="end_location"
            placeholder="Where would you like to go?"
            maxLength={200}
            required
          />
        </label>
        <button
          className="button button-dark booking-submit transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSending}
        >
          {isSending ? "Sending your enquiry…" : "Send my trip enquiry"}
          {!isSending && <FiArrowUpRight aria-hidden="true" />}
        </button>
        {submissionMessage && (
          <p
            className={`booking-note ${submissionMessage.type === "success" ? "booking-note-success" : ""}`}
            role={submissionMessage.type === "error" ? "alert" : "status"}
          >
            {submissionMessage.text}
          </p>
        )}
      </form>
    </div>
  );
}

export default function Home({ user }) {
  const [siteImages, setSiteImages] = useState({});

  useEffect(() => {
    if (!firebaseApp) return undefined;

    let active = true;
    let unsubscribe;

    import("firebase/firestore")
      .then(({ doc, getFirestore, onSnapshot }) => {
        if (!active) return;
        unsubscribe = onSnapshot(
          doc(getFirestore(firebaseApp), "site_settings", "homepage"),
          (snapshot) => setSiteImages(snapshot.data()?.images || {}),
          (error) => console.error("Could not load website image settings:", error),
        );
      })
      .catch((error) => console.error("Could not initialize website image settings:", error));

    return () => {
      active = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <main id="top">
      <section className="home-hero">
        <div
          className="home-hero-image"
          style={siteImages.mainHero ? { backgroundImage: `url("${siteImages.mainHero}")` } : undefined}
        />
        <div className="home-hero-shade" />
        <div className="home-hero-content">
          <span className="hero-kicker"><span /> Private journeys · Sri Lanka</span>
          <h1>Explore Sri Lanka<br />in <em>ultimate comfort.</em></h1>
          <p>From airport arrivals to winding hill-country roads, discover the island at your own pace in a spacious, air-conditioned van.</p>
          <div className="hero-actions">
            <a className="button button-mango" href="#plan">Plan your ride <FiArrowUpRight aria-hidden="true" /></a>
            <a className="hero-discover" href="#vehicle"><span className="discover-icon"><FiArrowDown aria-hidden="true" /></span> Meet your ride</a>
          </div>
        </div>
        <div className="home-hero-location"><FiMapPin aria-hidden="true" /> Your Sri Lankan story starts here</div>
        <a className="hero-vehicle-card" href="#vehicle">
          <img
            src={siteImages.vehicleImage || siteImages.vehicleCard || siteImages.vehicleShowcase || "/images/toyota-kdh.png"}
            alt="Silver Toyota KDH passenger van"
          />
          <span className="hero-vehicle-copy">
            <small>THE CEYLONE VIBE RIDE</small>
            <strong>Toyota KDH Passenger Van</strong>
            <span>Made for Sri Lankan roads.</span>
          </span>
          <span className="hero-vehicle-arrow"><FiArrowUpRight aria-hidden="true" /></span>
        </a>
        <a className="home-hero-scroll" href="#plan"><span /> Scroll to plan your trip</a>
      </section>

      <section className="trust-row" aria-label="Travel with Ceylone Vibe">
        <div><FiShield aria-hidden="true" /><span>Friendly local drivers</span></div>
        <div><FiWind aria-hidden="true" /><span>Air-conditioned comfort</span></div>
        <div><FiMap aria-hidden="true" /><span>Flexible island routes</span></div>
      </section>

      <section className="booking-section" id="plan">
        <div className="booking-section-heading">
          <span className="eyebrow">A better way around the island</span>
          <h2>Where will the road<br />take <em>you?</em></h2>
          <p>Share a few details and we’ll help make your Sri Lankan trip feel effortless.</p>
        </div>
        <BookingForm />
      </section>

      <section className="vehicle-section" id="vehicle">
        <div className="vehicle-image">
          <div className="vehicle-showcase-top">
              <span className="vehicle-showcase-mark">CV<span>.</span></span>
              <span>CEYLONE VIBE <i>·</i> PRIVATE HIRE</span>
          </div>
          <div className="vehicle-sun" aria-hidden="true" />
          <img
            src={siteImages.vehicleImage || siteImages.vehicleShowcase || siteImages.vehicleCard || "/images/toyota-kdh.png"}
            alt="Silver Toyota KDH passenger van, the Ceylone Vibe vehicle"
            loading="lazy"
          />
          <div className="vehicle-spec-card">
            <span>YOUR ISLAND COMPANION</span>
            <strong>Toyota <em>KDH</em></strong>
            <small>Comfort for the long way round</small>
          </div>
          <span className="vehicle-image-badge"><FiShield aria-hidden="true" /> Your comfort comes first</span>
        </div>
        <div className="vehicle-copy">
          <span className="eyebrow eyebrow-light">Your island ride</span>
          <h2>Toyota KDH.<br /><em>Island comfort.</em></h2>
          <p className="vehicle-intro">Travel Sri Lanka in a Toyota KDH passenger van, with room to relax, space for your luggage, and a comfortable ride between all the places you came to see.</p>
          <div className="vehicle-features">
            <article><span><FiWind aria-hidden="true" /></span><div><strong>Fully air-conditioned</strong><small>Cool, comfortable journeys in every season.</small></div></article>
            <article><span><FiBriefcase aria-hidden="true" /></span><div><strong>Room for your luggage</strong><small>Generous space for bags and travel essentials.</small></div></article>
            <article><span><FiUsers aria-hidden="true" /></span><div><strong>Flexible group seating</strong><small>9–14 seat configurations, depending on vehicle setup.</small></div></article>
            <article><span><FiWifi aria-hidden="true" /></span><div><strong>Little comforts onboard</strong><small>Complimentary Wi-Fi and bottled water.</small></div></article>
          </div>
          <a className="button button-mango" href="#plan">Book your van <FiArrowUpRight aria-hidden="true" /></a>
        </div>
      </section>

      <section className="destinations-section section-wrap" id="journeys">
        <div className="destinations-heading">
          <div>
            <span className="eyebrow">A few places to fall for</span>
            <h2>Small island.<br /><em>Big adventures.</em></h2>
          </div>
          <p>From misty mountains to wild open plains and sun-warmed shores, Sri Lanka is best discovered one beautiful stop at a time.</p>
        </div>
        <div className="destinations-grid">
          {destinations.map((destination, index) => (
            <article className={`destination-card destination-card-${index + 1}`} key={destination.name}>
              <img src={destination.image} alt={destination.alt} loading="lazy" />
              <div className="destination-overlay" />
              <div className="destination-copy">
                <span>{destination.region}</span>
                <h3>{destination.name}</h3>
                <p>{destination.description}</p>
                <a href="#plan" aria-label={`Plan a trip to ${destination.name}`}>
                  Plan this trip <FiArrowUpRight aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <DeferredReviews user={user} />

      <footer className="site-footer">
        <a className="brand brand-footer" href="#top" aria-label="Ceylone Vibe home"><span className="brand-mark">C</span><span>Ceylone<span className="brand-period"> Vibe</span></span></a>
        <span>Made for the long way round.</span>
        <a className="footer-phone" href="tel:+94382292953"><FiPhone aria-hidden="true" /> 0382292953</a>
        <a href="#journeys">Back to the beginning ↑</a>
        <SocialLinks className="footer-social-links" />
        <small>© {new Date().getFullYear()} Ceylone Vibe · Sri Lanka</small>
      </footer>
    </main>
  );
}
