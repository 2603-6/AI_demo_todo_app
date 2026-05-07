import { useState, useRef, useEffect } from 'react';
import type { TodoList, TodoItem, ConversationMessage } from '../types';
import { updateTodoItem, sendMessage, completeTodoList } from '../api';
import styles from './TodoListDetail.module.css';

interface Props {
  list: TodoList;
  onClose: () => void;
  onItemToggle: (itemId: string, completed: boolean) => void;
  onListUpdated: (list: TodoList) => void;
  onListCompleted: (list: TodoList) => void;
}

function formatAssistantMessage(content: string, itemCount: number): string {
  try {
    const parsed = JSON.parse(content) as { items?: { title?: string }[] };
    const count = parsed.items?.length ?? itemCount;
    return `Updated your list with ${count} item${count !== 1 ? 's' : ''}.`;
  } catch {
    return 'Updated your list.';
  }
}

export function TodoListDetail({ list, onClose, onItemToggle, onListUpdated, onListCompleted }: Props) {
  const [items, setItems] = useState<TodoItem[]>(
    [...list.items].sort((a, b) => a.position - b.position),
  );
  const [messages, setMessages] = useState<ConversationMessage[]>(list.messages ?? []);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function toggleItem(id: string) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    const newCompleted = !Boolean(item.completed);

    setItems((prev) => prev.map((i) => i.id === id ? { ...i, completed: newCompleted } : i));

    updateTodoItem(id, newCompleted)
      .then(() => {
        onItemToggle(id, newCompleted);
      })
      .catch(() => {
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, completed: !newCompleted } : i));
      });
  }

  function handleCompleteList() {
    if (isCompleting) return;
    setIsCompleting(true);
    completeTodoList(list.id, !list.completed)
      .then((updatedList) => {
        onListCompleted(updatedList);
      })
      .catch(() => {
        // silently fail — list state unchanged
      })
      .finally(() => {
        setIsCompleting(false);
      });
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || isSending) return;

    setChatInput('');
    setChatError(null);
    setIsSending(true);

    sendMessage(list.id, text)
      .then((updatedList) => {
        const sortedItems = [...updatedList.items].sort((a, b) => a.position - b.position);
        setItems(sortedItems);
        setMessages(updatedList.messages ?? []);
        onListUpdated(updatedList);
      })
      .catch((err: unknown) => {
        setChatError(err instanceof Error ? err.message : 'Something went wrong');
      })
      .finally(() => {
        setIsSending(false);
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
              {list.completed && <span className={styles.listCompletedBadge}>List done</span>}
            </p>
          </div>
          <div className={styles.panelActions}>
            <button
              className={`${styles.completeListBtn} ${list.completed ? styles.completeListBtnActive : ''}`}
              onClick={handleCompleteList}
              disabled={isCompleting}
              title={list.completed ? 'Mark list as not done' : 'Mark entire list as done'}
            >
              {isCompleting ? '…' : list.completed ? 'Mark not done' : 'Mark done'}
            </button>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
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

        {messages.length > 0 && (
          <div className={styles.conversation}>
            <p className={styles.conversationLabel}>Conversation</p>
            <div className={styles.messageList}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${styles.message} ${msg.role === 'user' ? styles.messageUser : styles.messageAssistant}`}
                >
                  {msg.role === 'user'
                    ? msg.content
                    : formatAssistantMessage(msg.content, items.length)}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        <form className={styles.chatForm} onSubmit={handleSend}>
          <input
            className={styles.chatInput}
            type="text"
            placeholder="Refine this list… e.g. make it more challenging"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isSending}
          />
          <button
            className={styles.chatSendBtn}
            type="submit"
            disabled={!chatInput.trim() || isSending}
            aria-label="Send"
          >
            {isSending ? (
              <span className={styles.spinner} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
              </svg>
            )}
          </button>
        </form>

        {chatError && <p className={styles.chatError}>{chatError}</p>}
      </div>
    </div>
  );
}
