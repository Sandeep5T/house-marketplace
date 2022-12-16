import { useEffect, useState, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useNavigate, useParams } from "react-router-dom";
import Spinner from "../components/Spinner";
import { toast } from "react-toastify";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { getDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.config";

function EditListing() {
  //eslint-disable-next-line
  const [geoLocationEnabled, setGeoLocationEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const isMounted = useRef(true);
  const navigate = useNavigate();
  const auth = getAuth();
  const [listing, setListing] = useState(null);
  const params = useParams();

  //Redirect if listing is not users
  useEffect(() => {
    if (listing && listing.userRef !== auth.currentUser.uid) {
      toast.error("You cannot edit thiss listing");
      navigate("/");
    }
  });

  //Sets userRef in form to logged in user
  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setFormData({ ...formData, userRef: user.uid });
        } else {
          navigate("/sign-in");
        }
      });
    }

    return () => {
      isMounted.current = false;
    };
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  //fetch Listing to edit
  useEffect(() => {
    setLoading(true);
    const fetchListing = async () => {
      const docRef = doc(db, "listings", params.listingId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setListing(docSnap.data());
        setFormData({ ...docSnap.data(), address: docSnap.data().location });
        setLoading(false);
      } else {
        navigate("/");
        toast.error("Listing does not exist");
      }
    };
    fetchListing();
  }, [navigate, params.listingId]);
  const [formData, setFormData] = useState({
    type: "rent",
    name: "",
    address: "",
    bedrooms: 1,
    bathrooms: 1,
    offer: true,
    images: {},
    regularPrice: 0,
    discountedPrice: 0,
    parking: false,
    furnished: false,
    latitude: 0,
    longitude: 0,
    userRef: "",
  });

  const {
    type,
    name,
    address,
    bedrooms,
    bathrooms,
    offer,
    images,
    regularPrice,
    discountedPrice,
    parking,
    furnished,
    latitude,
    longitude,
  } = formData;

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (Number(discountedPrice) >= Number(regularPrice)) {
      setLoading(false);
      toast.error("Discounted Price needs to be less than regular price");
      return;
    }

    if (images.length > 6) {
      setLoading(false);
      toast.error("You cannot upload more than 6 images");
      return;
    }

    let geolocation = {};
    let location;

    if (geoLocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
      );
      const data = await response.json();
      geolocation.latitude = data.results[0]?.geometry.location.lat ?? 0;
      geolocation.longitude = data.results[0]?.geometry.location.lng ?? 0;
      location =
        data.status === "ZERO_RESULTS"
          ? undefined
          : data.results[0]?.formatted_address;

      if (location === undefined || location.includes("undefined")) {
        setLoading(false);
        toast.error("Please enter a correct address");
        return;
      }
    } else {
      geolocation.latitude = latitude;
      geolocation.longitude = longitude;
      location = address;
    }

    // Store image in firebase
    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;

        const storageRef = ref(storage, "images/" + fileName);

        const uploadTask = uploadBytesResumable(storageRef, image);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            toast.info("Upload is " + progress + "% done");
            switch (snapshot.state) {
              case "paused":
                toast.info("Upload is paused");
                break;
              case "running":
                toast.info("Upload is running");
                break;
              default:
                break;
            }
          },
          (error) => {
            reject(error);
          },
          () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    };

    const imageUrls = await Promise.all(
      [...images].map((image) => {
        return storeImage(image);
      })
    ).catch((error) => {
      setLoading(false);
      toast.error("Images not uploaded");
      return;
    });

    const formDataCopy = {
      ...formData,
      imageUrls,
      geolocation,
      timestamp: serverTimestamp(),
    };

    formDataCopy.location = address;
    delete formDataCopy.images;
    delete formDataCopy.address;
    !formDataCopy.offer && delete formDataCopy.discountedPrice;

    const docRef = doc(db, "listings", params.listingId);
    await updateDoc(docRef, formDataCopy);
    setLoading(false);
    toast.success("Listing saved");
    navigate(`/category/${formDataCopy.type}/${docRef.id}`);
  };

  const onMutate = (e) => {
    let boolean = null;
    if (
      e.target.value === "true" &&
      !(
        e.target.tagName.toUpperCase() === "INPUT" ||
        e.target.tagName.toUpperCase() === "TEXTAREA"
      )
    ) {
      boolean = true;
    }

    if (
      e.target.value === "false" &&
      !(
        e.target.tagName.toUpperCase() === "INPUT" ||
        e.target.tagName.toUpperCase() === "TEXTAREA"
      )
    ) {
      boolean = false;
    }

    if (e.target.files) {
      setFormData((prevState) => ({ ...prevState, images: e.target.files }));
    }

    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="profile">
      <header>
        <p className="pageHeader">Edit Listing</p>
      </header>

      <main>
        <form onSubmit={onSubmit}>
          <label className="formLabel">Sell / Rent</label>
          <div className="formButtons">
            <button
              type="button"
              className={type === "sale" ? "formButtonActive" : "formButton"}
              id="type"
              value="sale"
              onClick={onMutate}
            >
              Sell
            </button>
            <button
              type="button"
              className={type === "rent" ? "formButtonActive" : "formButton"}
              id="type"
              value="rent"
              onClick={onMutate}
            >
              Rent
            </button>
          </div>
          <label className="formLabel">Name</label>
          <input
            type="text"
            id="name"
            value={name}
            className="formInputName"
            onChange={onMutate}
            required
            minLength={10}
            maxLength={32}
          />
          <div className="formRooms flex">
            <div>
              <label className="formLabel">Bedrooms</label>
              <input
                type="number"
                id="bedrooms"
                className="formInputSmall"
                value={bedrooms}
                onChange={onMutate}
                min={1}
                max={50}
                required
              />
            </div>

            <div>
              <label className="formLabel">Bathrooms</label>
              <input
                type="number"
                id="bathrooms"
                className="formInputSmall"
                value={bathrooms}
                onChange={onMutate}
                min={1}
                max={50}
                required
              />
            </div>
          </div>
          <label className="formLabel">Parking</label>
          <div className="formButtons">
            <button
              type="button"
              id="parking"
              value="true"
              className={parking ? "formButtonActive" : "formButton"}
              onClick={onMutate}
            >
              Yes
            </button>

            <button
              type="button"
              id="parking"
              value="false"
              className={
                !parking && parking !== null ? "formButtonActive" : "formButton"
              }
              onClick={onMutate}
            >
              No
            </button>
          </div>
          <label className="formLabel">Furnished</label>
          <div className="formButtons">
            <button
              type="button"
              className={furnished ? "formButtonActive" : "formButton"}
              id="furnished"
              value="true"
              onClick={onMutate}
            >
              Yes
            </button>

            <button
              type="button"
              className={
                !furnished & (furnished !== null)
                  ? "formButtonActive"
                  : "formButton"
              }
              id="furnished"
              value="false"
              onClick={onMutate}
            >
              No
            </button>
          </div>
          <label className="formLabel">Address</label>
          <textarea
            id="address"
            type="text"
            value={address}
            className="formInputAddress"
            onChange={onMutate}
            required
          />
          {!geoLocationEnabled && (
            <div className="formLatLng flex">
              <div>
                <label className="formLabel">Latitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  value={latitude}
                  id="latitude"
                  required
                  onChange={onMutate}
                />
              </div>

              <div>
                <label className="formLabel">Longitude</label>
                <input
                  className="formInputSmall"
                  type="number"
                  value={longitude}
                  id="longitude"
                  required
                  onChange={onMutate}
                />
              </div>
            </div>
          )}
          <label>Offer</label>
          <div className="formButtons">
            <button
              className={offer ? "formButtonActive" : "formButton"}
              id="offer"
              value="true"
              type="button"
              onClick={onMutate}
            >
              Yes
            </button>

            <button
              id="offer"
              value="false"
              className={
                !offer && offer !== null ? "formButtonActive" : "formButton"
              }
              onClick={onMutate}
              type="button"
            >
              No
            </button>
          </div>
          <label className="formLabel">Regular Price</label>
          <div className="formPriceDiv">
            <input
              type="number"
              className="formInputSmall"
              value={regularPrice}
              onChange={onMutate}
              id="regularPrice"
              min={50}
              max={750000000}
              required
            />
            {type === "rent" && <p className="formPriceText">$ / month</p>}
          </div>
          {offer && (
            <>
              <label className="formLabel">Discounted Price</label>
              <div className="formPriceDiv">
                <input
                  type="number"
                  id="discountedPrice"
                  value={discountedPrice}
                  className="formInputSmall"
                  required={offer}
                  min="50"
                  max="750000000"
                  onChange={onMutate}
                />
                {type === "rent" && <p className="formPriceText">$ / month</p>}
              </div>
            </>
          )}
          <label className="formLabel">Images</label>
          <p>The first image will be the cover max(6).</p>
          <input
            type="file"
            id="images"
            required
            multiple
            onChange={onMutate}
            className="formInputFile"
            max="6"
            accept=".jpg,.png,.jpeg"
          />
          <button type="submit" className="primaryButton createListingButton">
            Save Listing
          </button>
        </form>
      </main>
    </div>
  );
}

export default EditListing;
