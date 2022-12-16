import { getAuth, updateProfile } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDocs,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase.config";
import { toast } from "react-toastify";
import homeIcon from "../assets/svg/homeIcon.svg";
import rightArrowIcon from "../assets/svg/keyboardArrowRightIcon.svg";
import { Link } from "react-router-dom";
import ListingItem from "../components/ListingItem";

function Profile() {
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState(null);
  const [formData, setFormData] = useState({
    name: auth.currentUser.displayName,
    email: auth.currentUser.email,
  });

  const [changeDetails, setChangeDetails] = useState(false);

  useEffect(() => {
    const fetchUserListings = async () => {
      const listingsRef = collection(db, "listings");
      const q = query(
        listingsRef,
        where("userRef", "==", auth.currentUser.uid),
        orderBy("timestamp", "desc")
      );

      const docs = await getDocs(q);

      const listings = [];

      docs.forEach((doc) => {
        return listings.push({ id: doc.id, data: doc.data() });
      });

      setListings(listings);
      setLoading(false);
    };

    fetchUserListings();
  }, [auth.currentUser.uid]);
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

  const onDelete = async (listingId) => {
    if (window.confirm("Are you sure you want to delete the listing?")) {
      await deleteDoc(doc(db, "listings", listingId));
      const updatedListings = listings.filter(
        (listing) => listing.id !== listingId
      );

      setListings(updatedListings);
      toast.success("Listing is successfully deleted");
    }
  };

  const onEdit = async (listingId) => {
    navigate(`/edit-listing/${listingId}`);
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

        <Link to="/create-listing" className="createListing">
          <img src={homeIcon} alt="home" />
          <p>Sell or Rent your home</p>
          <img src={rightArrowIcon} alt="arrow right" />
        </Link>

        {!loading && listings?.length > 0 && (
          <>
            <p className="listingText">Your Listings</p>
            <ul className="listingsList">
              {listings.map((listing) => (
                <ListingItem
                  id={listing.id}
                  key={listing.id}
                  listing={listing.data}
                  onDelete={() => onDelete(listing.id)}
                  onEdit={() => onEdit(listing.id)}
                />
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}

export default Profile;
