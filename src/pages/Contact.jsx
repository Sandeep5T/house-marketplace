import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { db } from "../firebase.config";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import Spinner from "../components/Spinner";

function Contact() {
  const [landlord, setLandlord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const params = useParams();
  //eslint-disable-next-line
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const getLandlord = async () => {
      const docRef = doc(db, "users", params.landlordId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setLandlord(docSnap.data());
      } else {
        toast.error("Could not fetch landlord details");
        navigate("/sign-in");
      }
      setLoading(false);
    };
    getLandlord();
  }, [params.landlordId, navigate]);

  const onChange = (e) => {
    setMessage(e.target.value);
  };

  if (loading) {
    return <Spinner />;
  }
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
