import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";

function Contact() {
  const [landlord, setLandlord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const params = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const getLandlord = async () => {
      const docRef = doc(db, "users", params.landlordId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setLandlord(docSnap.data());
      } else {
        toast.error("Could not fetch landlord details");
      }
    };
    getLandlord();
  }, [params.landlordId]);

  const onChange = (e) => {
    setMessage(e.target.value);
  };
  return (
    <div className="pageContainer">
      <header>
        <p className="pageHeader">Contact Landlord</p>
      </header>

      {landlord !== null && (
        <main>
          <div className="contactLandlord">
            <p className="landlordName">Contact {landlord?.name}</p>
          </div>

          <form className="messageForm">
            <div className="messageDiv">
              <label htmlFor="message" className="messageLabel">
                Message
              </label>
              <textarea
                name="message"
                id="message"
                value={message}
                onChange={onChange}
                className="textarea"
              />
            </div>

            <a
              href={`mailto:${landlord?.email}?subject=${searchParams.get(
                "listingName"
              )}&body=${message}`}
            >
              <button className="primaryButton" type="button">
                Send Message
              </button>
            </a>
          </form>
        </main>
      )}
    </div>
  );
}

export default Contact;
