export default function Switch({ defaultChecked, onChange, id }) {
  return (
    <label className="switch">
      <input
        id={id}
        defaultChecked={defaultChecked}
        onChange={onChange}
        type="checkbox"
      />
      <span className="slider"></span>
    </label>
  );
}
