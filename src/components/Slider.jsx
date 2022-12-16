import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase.config";
import Spinner from "../components/Spinner";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";
import "swiper/css/scrollbar";
import "swiper/css/a11y";

function Slider() {
  const [listings, setListings] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchListings = async () => {
      const listingsRef = collection(db, "listings");
      const q = query(listingsRef, orderBy("timestamp", "desc"), limit(5));
      const querySnap = await getDocs(q);

      let listings = [];
      querySnap.forEach((doc) => {
        return listings.push({ id: doc.id, data: doc.data() });
      });

      setListings(listings);
      setLoading(false);
    };
    fetchListings();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  if (listings.length === 0) {
    return <></>;
  }
  return (
    listings && (
      <>
        <p className="exploreHeading">Recommended</p>

        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          style={{ height: "400px" }}
        >
          {listings.map(({ data, id }) => (
            <SwiperSlide
              key={id}
              onClick={() => navigate(`/category/${data.type}/${id}`)}
            >
              <div
                className="swiperSlideDiv"
                style={{
                  background: `center no-repeat`,
                  //   background: `url(${data.imageUrls[0]}) center no-repeat`,
                  backgroundSize: "cover",
                }}
              >
                <img
                  src={data.imageUrls[0]}
                  style={{ width: "100%", height: "100%" }}
                  alt={data.name}
                />
                <p className="swiperSlideText">{data.name}</p>
                <p className="swiperSlidePrice">
                  ${data.discountedPrice ?? data.regularPrice}{" "}
                  {data.type === "rent" && "/ month"}
                </p>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </>
    )
  );
}
export default Slider;
