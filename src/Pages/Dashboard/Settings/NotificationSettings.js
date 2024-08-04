export default function NotificationSettings() {
  return (
    <div className="settings">
      <h1>Notifications</h1>
      <p>
        Enable or disable certain notifications and decide how you want to be
        notified
      </p>

      <div className="option">
        <label htmlFor="">Someone comments on your project:</label>

        <select name="" id="">
          <option value="">Off</option>
          <option value="">Inbox only</option>
          <option value="">Inbox & Discord DM</option>
        </select>
      </div>
      <div className="option">
        <label htmlFor="">Someone replies to your comment:</label>

        <select name="" id="">
          <option value="">Off</option>
          <option value="">Inbox only</option>
          <option value="">Inbox & Discord DM</option>
        </select>
      </div>
      <div className="option">
        <label htmlFor="">Someone likes your project:</label>

        <select name="" id="">
          <option value="">Off</option>
          <option value="">Inbox only</option>
          <option value="">Inbox & Discord DM</option>
        </select>
      </div>
      <div className="option">
        <label htmlFor="">Someone clones your project:</label>

        <select name="" id="">
          <option value="">Off</option>
          <option value="">Inbox only</option>
          <option value="">Inbox & Discord DM</option>
        </select>
      </div>
      <div className="option">
        <label htmlFor="">
          A bot token is detected in your public project:
        </label>

        <select name="" id="">
          <option value="">Off</option>
          <option value="">Inbox only</option>
          <option value="">Inbox & Discord DM</option>
        </select>
      </div>
    </div>
  );
}
