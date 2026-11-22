# Ceylone Vibe — Sri Lanka travel and van hire

Responsive React + Vite site for Ceylone Vibe private van hire, Sri Lanka trip enquiries, Firebase authentication, and guest reviews.

## Project structure

```text
ceylone-vibe/
├── .env.example
├── firestore.indexes.json
├── firestore.rules
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src/
    ├── App.jsx
    ├── firebase.js
    ├── index.css
    ├── main.jsx
    ├── components/
    │   ├── Auth.jsx
    │   ├── AdminDashboard.jsx
    │   ├── Navbar.jsx
    │   └── ReviewSection.jsx
    └── pages/
        └── Home.jsx
```

## Run locally

1. Install Node.js 18+.
2. From this folder, install dependencies:

   ```sh
   npm install
   ```

3. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
4. In **Project settings → General → Your apps**, register a Web app and copy its Firebase config values.
5. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**. Add your local and production hostnames under **Authentication → Settings → Authorized domains**.
6. In **Firestore Database**, create a database, then publish the contents of `firestore.rules` using the Rules tab (or Firebase CLI).
7. Copy `.env.example` to `.env.local` and fill in the Web app config values:

   ```dotenv
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_CONTACT_EMAIL=hello@your-domain.com
   VITE_EMAILJS_SERVICE_ID=YOUR_SERVICE_ID
   VITE_EMAILJS_TEMPLATE_ID=YOUR_TEMPLATE_ID
   VITE_EMAILJS_PUBLIC_KEY=YOUR_PUBLIC_KEY
   ```

   Firebase web configuration is intended to be present in client applications; Firestore access is protected by `firestore.rules`. Never put service-account credentials in this file.

8. In the [EmailJS dashboard](https://dashboard.emailjs.com/), connect an email service and create a template using these form variables:

   ```text
   {{user_name}}
   {{user_email}}
   {{contact_number}}
   {{service_type}}
   {{date}}
   {{time}}
   {{start_location}}
   {{end_location}}
   ```

   Set the template's **Reply To** field to `{{user_email}}`. Copy the service ID, template ID, and public key into the matching `VITE_EMAILJS_*` entries in `.env.local`. The EmailJS public key is intended for browser use; restrict allowed origins in the EmailJS dashboard.

9. Start the development server:

   ```sh
   npm run dev
   ```

10. Create a production build with `npm run build`.

The trip enquiry form sends directly from the site through EmailJS. Replace all three `YOUR_*` values before submitting enquiries. The sample package prices and contact details are illustrative and should be replaced with current business information.

## Firebase behavior

- Email/password sign-up and login and Google popup sign-in are handled in `src/components/Auth.jsx`.
- `src/App.jsx` observes Firebase auth state and shares the current user with the page and review form.
- `src/components/ReviewSection.jsx` listens to the latest approved public reviews in Firestore and creates authenticated reviews with a 1–5 star rating. New reviews are hidden until an admin approves them.
- `firestore.rules` allows public review reads, validates signed-in review creation, and restricts moderation, deletion, and site settings writes to admins.

## Admin dashboard

The protected dashboard is available at **`/loku`**. The route checks for a Firebase Authentication custom claim named `admin`; being signed in alone does not grant access. Firestore rules also enforce this claim, so bypassing the dashboard UI does not grant moderation or site-settings write access.

1. In Firebase Console, open **Authentication → Users** and create or identify the account that should administer the site.
2. In a trusted server environment with Firebase Admin SDK credentials (never in the Vite app), assign the custom claim to that account. For example:

   ```js
   import { applicationDefault, initializeApp } from "firebase-admin/app";
   import { getAuth } from "firebase-admin/auth";

   initializeApp({ credential: applicationDefault() });
   const auth = getAuth();
   const user = await auth.getUserByEmail("admin@example.com");
   await auth.setCustomUserClaims(user.uid, {
     ...user.customClaims,
     admin: true,
   });
   ```

   Run this only from a secured environment where `firebase-admin` is installed and Application Default Credentials are configured. Never put a service-account key in this repository or any `VITE_*` variable. Sign out and back in after setting the claim; the dashboard also refreshes the ID token when checking access.
3. In Cloudinary, create an **unsigned upload preset** for image uploads. Copy your Cloudinary cloud name and preset name into `CLOUDINARY_CLOUD_NAME` and `CLOUDINARY_UPLOAD_PRESET` at the top of `src/components/AdminDashboard.jsx`. Configure the preset's upload restrictions (allowed image formats and maximum file size); unsigned presets are public and must not be treated as secrets.
4. Paste and publish `firestore.rules` in **Firestore Database → Rules**. Create the composite index from `firestore.indexes.json` in **Firestore Database → Indexes** (or deploy it with the Firebase CLI). New reviews start hidden; open `/loku` and approve existing reviews as desired.
5. In **Firestore Database → Data**, uploaded Cloudinary URLs are saved at `site_settings/homepage` in the `images` map (`mainHero` and `vehicleImage`). The public home page listens to these settings and keeps its bundled vehicle image as a fallback.

The public review query filters by `isVisible` before ordering and limiting:

```js
const publicReviewsQuery = query(
  collection(db, "reviews"),
  where("isVisible", "==", true),
  orderBy("createdAt", "desc"),
  limit(9),
);
```

The matching composite index is included in `firestore.indexes.json`.
