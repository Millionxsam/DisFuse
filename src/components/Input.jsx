import { useEffect, useState } from "react";

export default function Input({ value: parentValue, onSet, ...props }) {
  const [localValue, setLocalValue] = useState(parentValue);

  useEffect(() => {
    setLocalValue(parentValue);
  }, [parentValue]);

  const handleLeave = () => {
    if (localValue !== parentValue) {
      onSet(localValue);
    }
  };

  return (
    <input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleLeave}
    />
  );
}
