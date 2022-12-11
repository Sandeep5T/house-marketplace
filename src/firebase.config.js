import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTporeS4Xmyip2Mm6krOYx-oSOTY1Lzjc",
  authDomain: "house-marketplace-fdb3a.firebaseapp.com",
  projectId: "house-marketplace-fdb3a",
  storageBucket: "house-marketplace-fdb3a.appspot.com",
  messagingSenderId: "38673183978",
  appId: "1:38673183978:web:1d07c1c0b0602db53cd393",
};

// Initialize Firebase
initializeApp(firebaseConfig);
export const db = getFirestore();
