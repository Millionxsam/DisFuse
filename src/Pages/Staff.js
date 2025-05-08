import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userCache } from "../cache.ts";
const { apiUrl } = require("../config/config.json");

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

  return (
    <div className="staff-container">
      <h1>DisFuse Staff</h1>
      <div className="staff hidden shown">
        {staff.map((i, index) => (
          <Link to={"https://discord.com/users/" + i.id} key={index}>
            <div>
              <img
                src={`https://cdn.discordapp.com/avatars/${i.id}/${i.avatar}.png?size=1024`}
                alt=""
              />
              <h3>{i.username}</h3>
              <p className="staff-roles-card">
                {i.owner ? (
                  <span>Owner</span>
                ) : (
                  <>
                    {i.moderator && <span>Moderator</span>}
                    {i.admin && <span>Admin</span>}
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
