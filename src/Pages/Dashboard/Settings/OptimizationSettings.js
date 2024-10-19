import { useState } from 'react';
import Switch from '../../../components/Switch';
import { useEffect } from 'react';
import axios from 'axios';
import LoadingAnim from '../../../components/LoadingAnim';

let { discordUrl, apiUrl } = require('../../../config/config.json');

export default function OptimizationSettings() {
    const token = localStorage.getItem('disfuse-token');
    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios
            .get(discordUrl + '/users/@me', {
                headers: {
                    Authorization: token,
                },
            })
            .then(({ data }) => {
                axios
                    .get(apiUrl + `/users/${data.id}`, {
                        headers: { Authorization: token },
                    })
                    .then(({ data: user }) => {
                        setUser(user);
                        setLoading(false);
                    });
            });
    }, [token]);

    function updateSetting(setting, value) {
        if (typeof setting === 'object')
            user.settings.optimization[setting[0]][setting[1]] = value;
        else user.settings.optimization[setting] = value;

        axios.put(apiUrl + `/users/${user.id}/settings`, user.settings, {
            headers: { Authorization: token },
        });
    }

    if (loading) return <LoadingAnim />;

    return (
        <>
            <div className="settings">
                <h1>Optimization</h1>
                <p>
                    Optimize the DisFuse website or workspace
                </p>
                <div className="option">
                    <p>Fast block render:</p>
                    <Switch
                        defaultChecked={user.settings?.optimization.fastRenderMode ?? false}
                        onChange={(e) => {
                            updateSetting('fastRenderMode', e.currentTarget.checked);
                        }}
                        id="optimization-fastRenderMode"
                    />
                </div>
                <h5>Makes the workspace run faster, but it might look more pixelated.</h5>
            </div>
        </>
    );
}
