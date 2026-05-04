import { useState } from 'react';
import type { TodoList, TodoItem } from '../types';
import { updateTodoItem } from '../api';
import styles from './TodoListDetail.module.css';

interface Props {
  list: TodoList;
  onClose: () => void;
  onItemToggle: (itemId: string, completed: boolean) => void;
}

export function TodoListDetail({ list, onClose, onItemToggle }: Props) {
  const [items, setItems] = useState<TodoItem[]>(
    [...list.items].sort((a, b) => a.position - b.position),
  );

  function toggleItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newCompleted = !Boolean(item.completed);

    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, completed: newCompleted } : i));

    updateTodoItem(id, newCompleted)
      .then(() => {
        onItemToggle(id, newCompleted);
      })
      .catch(() => {
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, completed: !newCompleted } : i));
      });
  }

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length ? (completedCount / items.length) * 100 : 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelPrompt}>{list.prompt}</p>
            <p className={styles.panelMeta}>
              {completedCount} of {items.length} completed
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className={styles.progressTrack}>
          <div className={styles.progressBar} style={{ width: `${progress}%` }} />
        </div>

        <ul className={styles.list}>
          {items.map((item) => {
            const done = Boolean(item.completed);
            return (
              <li
                key={item.id}
                className={`${styles.item} ${done ? styles.itemDone : ''}`}
                onClick={() => toggleItem(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? toggleItem(item.id) : undefined}
                aria-label={done ? 'Mark incomplete' : 'Mark complete'}
              >
                <span className={`${styles.checkbox} ${done ? styles.checked : ''}`}>
                  {done && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={`${styles.itemTitle} ${done ? styles.strikethrough : ''}`}>
                  {item.title}
                </span>
              </li>
            );
          })}
        </ul>

        {completedCount === items.length && items.length > 0 && (
          <div className={styles.allDone}>
            <span>All done!</span>
          </div>
        )}
      </div>
    </div>
  );
}
