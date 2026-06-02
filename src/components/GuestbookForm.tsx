import { useState } from 'react';
import type { FormEvent } from 'react';
import SignatureCanvas from './SignatureCanvas';
import { WORKER_URL } from '../hooks/useGuestbook';
import type { StrokePoint } from '../types/guestbook';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const MAX_NAME = 40;
const MAX_DESCRIPTION = 120;

export default function GuestbookForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [description, setDescription] = useState('');
  const [strokes, setStrokes] = useState<StrokePoint[][]>([]);
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const hasSignature = strokes.some((s) => s.length > 0);
  const canSubmit =
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    description.trim() !== '' &&
    hasSignature &&
    formState !== 'submitting';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    setFormState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch(`${WORKER_URL}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          description: description.trim(),
          stroke_data: strokes,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Submission failed (${res.status})`);
      }

      setFormState('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setFormState('error');
    }
  };

  if (formState === 'success') {
    return (
      <div className="gb-form-viewer">
        <div className="gb-form-chrome">
          <span className="gb-form-chrome__prompt">srihith@sj.sys:~$</span> sign guestbook.log
        </div>
        <div className="gb-success">
          <span className="gb-success__badge">[ ✓ ENTRY RECEIVED ]</span>
          <p className="gb-success__msg">
            Your entry is pending review — it'll appear once approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="gb-form-viewer">
      <div className="gb-form-chrome">
        <span className="gb-form-chrome__prompt">srihith@sj.sys:~$</span> sign guestbook.log
      </div>

      <form className="gb-form" onSubmit={handleSubmit}>
        <label className="gb-field">
          <span className="gb-field__label">First Name</span>
          <input
            type="text"
            className="gb-field__input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Obi-Wan"
            maxLength={MAX_NAME}
            autoComplete="given-name"
          />
        </label>

        <label className="gb-field">
          <span className="gb-field__label">Last Name</span>
          <input
            type="text"
            className="gb-field__input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g. Kenobi or K."
            maxLength={MAX_NAME}
            autoComplete="family-name"
          />
        </label>

        <label className="gb-field">
          <span className="gb-field__label">How you'd describe yourself in 3 words</span>
          <input
            type="text"
            className="gb-field__input"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="curious. builder. caffeinated."
            maxLength={MAX_DESCRIPTION}
          />
        </label>

        <div className="gb-field">
          <span className="gb-field__label">Signature</span>
          <span className="gb-field__hint">
            (not legal, just for fun — you can leave a drawing if you want instead)
          </span>
          <SignatureCanvas mode="draw" onChange={setStrokes} width={300} height={110} />
        </div>

        <p className="gb-disclosure">
          Entries are public once approved. Don't include personal information. To request removal,
          email srihithjarabana@gmail.com with your entry details.
        </p>

        {formState === 'error' && errorMsg && <p className="gb-form-error">▸ {errorMsg}</p>}

        <button type="submit" className="gb-submit" disabled={!canSubmit}>
          {formState === 'submitting' ? '[ SIGNING… ]' : '[ SIGN THE LOG → ]'}
        </button>
      </form>
    </div>
  );
}
