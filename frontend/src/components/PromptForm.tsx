import { useState, type FormEvent } from 'react';
import styles from './PromptForm.module.css';

interface Props {
  onSubmit: (prompt: string) => void;
  loading: boolean;
}

export function PromptForm({ onSubmit, loading }: Props) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          type="text"
          placeholder="e.g. Plan a road trip to the Grand Canyon…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button className={styles.button} type="submit" disabled={loading || !value.trim()}>
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            'Generate'
          )}
        </button>
      </div>
    </form>
  );
}
