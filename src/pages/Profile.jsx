import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";

function Profile() {
  const [user, setUser] = useState(null);
  const auth = getAuth();
  useEffect(() => {
    setUser(auth.currentUser);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return user ? <h1>{user.displayName}</h1> : "Not Logged in";
}

export default Profile;
