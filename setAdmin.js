import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';

// JSON ෆයිල් එක කියවීම
const serviceAccount = JSON.parse(
  fs.readFileSync(new URL('./serviceAccountKey.json', import.meta.url))
);

// Firebase Admin සම්බන්ධ කිරීම (අලුත් ක්‍රමය)
initializeApp({
  credential: cert(serviceAccount)
});

const adminEmail = "thamalidilrukshi7@gmail.com"; 

getAuth().getUserByEmail(adminEmail)
  .then((user) => {
    console.log("ගිණුම හොයාගත්තා! බලතල ලබා දෙමින් පවතී...");
    return getAuth().setCustomUserClaims(user.uid, { admin: true });
  })
  .then(() => {
    console.log("✅ Admin බලතල සාර්ථකව ලබා දුන්නා! දැන් Website එකෙන් Log out වෙලා ආයෙත් Log in වෙන්න.");
    process.exit(0);
  })
  .catch((error) => {
    console.log("❌ Error එකක් ආවා:", error);
    process.exit(1);
  });