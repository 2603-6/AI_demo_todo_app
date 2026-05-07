import type { TodoList } from '../types';
import styles from './TodoListCard.module.css';

interface Props {
  list: TodoList;
  active: boolean;
  onClick: () => void;
}

export function TodoListCard({ list, active, onClick }: Props) {
  const date = new Date(list.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const completedItems = list.items.filter((i) => i.completed).length;

  return (
    <button
      className={`${styles.card} ${active ? styles.active : ''} ${list.completed ? styles.listDone : ''}`}
      onClick={onClick}
    >
      <div className={styles.promptRow}>
        <p className={styles.prompt}>{list.prompt}</p>
        {list.completed && <span className={styles.doneBadge}>Done</span>}
      </div>
      <div className={styles.meta}>
        <span className={styles.count}>
          {completedItems}/{list.items.length} done
        </span>
        <span className={styles.date}>{date}</span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressBar} ${list.completed ? styles.progressDone : ''}`}
          style={{ width: list.items.length ? `${(completedItems / list.items.length) * 100}%` : '0%' }}
        />
      </div>
    </button>
  );
}
