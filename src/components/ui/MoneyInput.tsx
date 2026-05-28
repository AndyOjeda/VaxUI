import { formatMoneyInput, parseMoneyInput } from '../../utils/format';

interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
}

export function MoneyInput({ value, onChange, placeholder, required, id }: MoneyInputProps) {
  const handleChange = (raw: string) => {
    onChange(parseMoneyInput(raw));
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      className="money-input"
      value={value ? formatMoneyInput(value) : ''}
      placeholder={placeholder}
      required={required ? value > 0 : false}
      onChange={(e) => handleChange(e.target.value)}
    />
  );
}
