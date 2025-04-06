export default function Switch({ defaultChecked, onChange, id, disabled }) {
  return (
    <label className={`switch`}>
      <input
        id={id}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        type="checkbox"
      />
      <span className="slider"></span>
    </label>
  );
}
