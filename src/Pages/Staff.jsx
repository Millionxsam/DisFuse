import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userCache } from "../cache.ts";
import { apiUrl } from "../config/config.js";

export default function Staff() {
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    if (userCache?.allStaff && userCache?.allStaff?.length !== 0) {
      setStaff(userCache.allStaff);
    } else {
      axios.get(apiUrl + "/users/staff").then(({ data }) => {
        userCache.allStaff = data.users;
        setStaff(data.users);
      });
    }
  }, []);

  console.log(staff);

  return (
    <div className="df-staff-page">
      <div className="df-section-head">
        <span className="df-tag">The Team</span>
        <h2>DisFuse Staff</h2>
        <p>The people building and moderating DisFuse.</p>
      </div>

      <div className="df-staff-grid">
        {staff.map((i, index) => (
          <Link
            to={"https://discord.com/users/" + i.id}
            key={index}
            target="_blank"
            rel="noopener"
          >
            <div className="df-staff-card">
              <img src={i.avatar} alt={i.username + "'s Avatar"} />
              <h3>{i.username}</h3>
              <p className="roles">
                {i.owner ? (
                  <span className="owner">Owner</span>
                ) : (
                  <>
                    {i.admin && <span>Admin</span>}
                    {i.moderator && <span>Moderator</span>}
                    {i.developer && <span>Developer</span>}
                  </>
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
