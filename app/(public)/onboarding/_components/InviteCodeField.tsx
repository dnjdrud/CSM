"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  error?: string | null;
};

export function InviteCodeField({ value, onChange, disabled, id = "invite-code", error }: Props) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-800">
        Invite code
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste your code here"
        className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-800 placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors duration-150"
        autoComplete="off"
        disabled={disabled}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-600/90" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
