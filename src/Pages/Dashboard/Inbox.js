import axios from 'axios';
import { useEffect, useState } from 'react';
import InboxItem from '../../components/InboxItem';
import LoadingAnim from '../../components/LoadingAnim';
import Swal from 'sweetalert2';

const { discordUrl, apiUrl } = require('../../config/config.json');

export default function Inbox() {
  const [user, setUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [shown, setShown] = useState([]);

  useEffect(() => {
    axios
      .get(discordUrl + '/users/@me', {
        headers: {
          Authorization: localStorage.getItem('disfuse-token'),
        },
      })
      .then(({ data }) => {
        axios
          .get(apiUrl + `/users/${data.id}`, {
            headers: { Authorization: localStorage.getItem('disfuse-token') },
          })
          .then(({ data: user }) => {
            setUser(user);
            setLoading(false);
            setShown(user.inbox);

            setTimeout(() => {
              user.inbox = user.inbox.map((i) => {
                i.read = true;
                return i;
              });

              axios.put(apiUrl + `/users/${user.id}/inbox`, user.inbox, {
                headers: {
                  Authorization: localStorage.getItem('disfuse-token'),
                },
              });
            }, 700);
          });
      });
  }, []);

  function clearAll() {
    Swal.fire({
      title: 'Clear inbox?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, clear all',
    }).then((response) => {
      if (response.isConfirmed) {
        axios
          .put(apiUrl + `/users/${user.id}/inbox`, [], {
            headers: {
              Authorization: localStorage.getItem('disfuse-token'),
            },
          })
          .then(({ data }) => setUser(data))
          .then(() => window.location.reload());
      }
    });
  }

  return (
    <div className="inbox-container">
      <div className="head">
        <i class="fa-solid fa-inbox"></i> Inbox
      </div>

      <div className="buttons">
        <button onClick={clearAll} id="red">
          <i class="fa-solid fa-trash"></i> Clear All
        </button>
      </div>

      <div className="notifications">
        {loading ? (
          <LoadingAnim />
        ) : shown?.length ? (
          shown
            ?.slice()
            .reverse()
            .map((item, index) => (
              <InboxItem item={item} user={user} index={index} />
            ))
        ) : (
          'No notifications'
        )}
      </div>
    </div>
  );
}
