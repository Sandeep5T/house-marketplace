import { getAuth, updateProfile } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";

function Profile() {
  const auth = getAuth();
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  });

  const [changeDetails, setChangeDetails] = useState(false);
  const { name, email } = formData;

  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const logout = () => {
    auth.signOut();
    navigate("/sign-in");
  };

  const onSubmit = async () => {
    try {
      if (auth.currentUser.displayName !== name) {
        await updateProfile(auth.currentUser, { displayName: name });
        const userRef = doc(db, "users", auth.currentUser.uid);
        await updateDoc(userRef, { name });
      }
    } catch (error) {
      toast.error("Could not update profile details");
    }
  };

  return (
    <div className="profile">
      <header className="profileHeader">
        <p className="profileName">My Profile</p>
        <button type="button" className="logOut" onClick={logout}>
          Logout
        </button>
      </header>

      <main>
        <div className="profileDetailsHeader">
          <p className="personalDetailsText">Personal Details</p>
          <p
            className="changePersonalDetails"
            onClick={() => {
              changeDetails && onSubmit();
              setChangeDetails((prevState) => !prevState);
            }}
          >
            {changeDetails ? "Done" : "Change"}
          </p>
        </div>

        <div className="profileCard">
          <form>
            <input
              className={changeDetails ? "profileNameActive" : "profileName"}
              type="text"
              id="name"
              value={name}
              onChange={onChange}
              disabled={!changeDetails}
            ></input>
            <input
              //   className={changeDetails ? "profileEmailActive" : "profileEmail"}
              className="profileEmail"
              type="email"
              id="email"
              value={email}
              readOnly
              //   onChange={onChange}
              //   disabled={!changeDetails}
            />
          </form>
        </div>
      </main>
    </div>
  );
}

export default Profile;
