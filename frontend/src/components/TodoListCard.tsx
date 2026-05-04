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

  const completed = list.items.filter((i) => i.completed).length;

  return (
    <button
      className={`${styles.card} ${active ? styles.active : ''}`}
      onClick={onClick}
    >
      <p className={styles.prompt}>{list.prompt}</p>
      <div className={styles.meta}>
        <span className={styles.count}>
          {completed}/{list.items.length} done
        </span>
        <span className={styles.date}>{date}</span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressBar}
          style={{ width: list.items.length ? `${(completed / list.items.length) * 100}%` : '0%' }}
        />
      </div>
    </button>
  );
}
