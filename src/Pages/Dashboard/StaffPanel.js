import axios from 'axios';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
const { apiUrl, discordUrl } = require('../../config/config.json');

export default function StaffPanel() {
    const [users, setUsers] = useState([]);
    useEffect(() => {
        axios
            .get(discordUrl + '/users/@me', {
                headers: {
                    Authorization: localStorage.getItem('disfuse-token'),
                },
            })
            .then(({ data: user }) => {
                axios
                    .get(apiUrl + '/users/staff')
                    .then(({ data: staff }) => {
                        if (!staff.users.some(u => u.id === user.id)) {
                            window.location.replace('/projects');
                            return;
                        }

                        const staffUser = staff.users.find(u => u.id === user.id);
                        if (!staffUser.moderator && !staffUser.admin && !staffUser.owner) {
                            window.location.replace('/projects');
                            return;
                        }
                    });
            });

        axios
            .get(apiUrl + "/users")
            .then(({ data: allUsers }) => {
                setUsers(allUsers);
            })
    }, []);

    async function getIdByName(username) {
        return (users.find((u) => u.username === username) ?? { id: null }).id;
    }

    async function banUser() {
        const user = document.getElementById('usernameBan').value;
        const dateText = document.getElementById('dateBan').value;

        if (!user || !dateText) return;

        const id = await getIdByName(user);
        if (!id) {
            return Swal.fire({
                title: 'User Error',
                text: "This user doesn't exist!",
                icon: 'error',
                animation: true
            });
        };

        const date = new Date(dateText);

        if (new Date() >= date) {
            return Swal.fire({
                title: 'Date Error',
                text: 'This date has already passed!',
                icon: 'error',
                animation: true
            });
        }

        Swal.fire({
            title: 'Ban @' + user + '?',
            text: `They won't be able to access DisFuse until ${dateText}!`,
            icon: 'warning',
            showCancelButton: true,
            animation: true,
            confirmButtonText: 'Ban',
        }).then((response) => {
            if (response.isConfirmed) {
                axios
                    .put(
                        apiUrl + '/users/' + id + '/ban',
                        {
                            banUntil: date
                        },
                        {
                            headers: {
                                Authorization: localStorage.getItem("disfuse-token"),
                            },
                        }
                    )
                    .then(() => {
                        Swal.fire({
                            title: 'Ban Successful',
                            text: '@' + user + ' has been banned!',
                            icon: 'success',
                            animation: true
                        });
                    })
            }
        });
    }

    async function unbanUser() {
        const user = document.getElementById('usernameBan').value;
        if (!user) return;

        const id = await getIdByName(user);
        if (!id) {
            return Swal.fire({
                title: 'User Error',
                text: "This user doesn't exist!",
                icon: 'error',
                animation: true
            });
        };

        Swal.fire({
            title: 'Unban @' + user + '?',
            icon: 'warning',
            showCancelButton: true,
            animation: true,
            confirmButtonText: 'Ban',
        }).then((response) => {
            if (response.isConfirmed) {
                axios
                    .put(
                        apiUrl + '/users/' + id + '/ban',
                        {
                            banUntil: new Date(0)
                        },
                        {
                            headers: {
                                Authorization: localStorage.getItem("disfuse-token"),
                            },
                        }
                    )
                    .then(() => {
                        Swal.fire({
                            title: 'Unban Successful',
                            text: '@' + user + ' has been unbanned!',
                            icon: 'success',
                            animation: true
                        });
                    })
            }
        });
    }

    return (
        <div className="adminDashboard-container">
            <div className="head">
                <i class="fa-solid fa-user-tie"></i> Staff Panel
            </div>

            <div className="inline">
                <label htmlFor='usernameBan'>Username of user to ban:</label>
                <input type='text' id='usernameBan' list='usernames' />
                <datalist id='usernames'>
                    {users.map(i => <option value={i.username} />)}
                </datalist>
            </div>

            <div className="inline">
                <label htmlFor='dateBan'>Ban until date:</label>
                <input type='date' id='dateBan' />
            </div>

            <div className="inline">
                <button onClick={banUser} id="red">
                    <i class="fa-solid fa-ban"></i> Ban User
                </button>

                <button onClick={unbanUser}>
                    <i class="fa-solid fa-thumbs-up"></i> Unban User
                </button>
            </div>
        </div>
    );
}
