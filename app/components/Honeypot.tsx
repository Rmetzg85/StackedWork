"use client";
import { HONEYPOT_FIELD } from "../lib/honeypot-field";

// Off-screen field that people never see or tab to. Bots that fill every input fill it, and the API then
// answers with a fake success and stores or sends nothing. Not display:none, because some bots skip hidden inputs.
export default function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label>
        Leave this field empty
        {/* Password managers ignore it (1Password, LastPass, Bitwarden, Dashlane hints); the signup form also ignores it when a person typed. */}
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" data-1p-ignore="true" data-lpignore="true" data-bwignore="true" data-form-type="other" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}
