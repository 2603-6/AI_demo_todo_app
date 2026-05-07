import { useState, useEffect, useCallback } from 'react';
import { generateTodoList, listTodoLists, detectIntent, sendMessage, completeTodoList } from './api';
import type { TodoList } from './types';
import { PromptForm } from './components/PromptForm';
import { TodoListCard } from './components/TodoListCard';
import { TodoListDetail } from './components/TodoListDetail';
import styles from './App.module.css';

export default function App() {
  const [lists, setLists] = useState<TodoList[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? (lists.find((l) => l.id === selectedId) ?? null) : null;
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listTodoLists();
      setLists(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLists();
  }, [fetchLists]);

  function handleItemToggle(itemId: string, completed: boolean) {
    setLists((prev) =>
      prev.map((list) => ({
        ...list,
        items: list.items.map((item) =>
          item.id === itemId ? { ...item, completed } : item,
        ),
      })),
    );
  }

  function handleListUpdated(updatedList: TodoList) {
    setLists((prev) =>
      prev.map((list) => list.id === updatedList.id ? updatedList : list),
    );
  }

  function handleListCompleted(updatedList: TodoList) {
    setLists((prev) =>
      prev.map((list) => list.id === updatedList.id ? updatedList : list),
    );
  }

  async function handleGenerate(prompt: string) {
    setGenerating(true);
    setError(null);
    try {
      if (lists.length === 0) {
        const newList = await generateTodoList(prompt);
        setLists((prev) => [newList, ...prev]);
        setSelectedId(newList.id);
        return;
      }

      const listSummaries = lists.map((l) => ({ id: l.id, prompt: l.prompt }));
      const intent = await detectIntent(prompt, listSummaries);

      if (intent.action === 'create') {
        const newList = await generateTodoList(intent.message);
        setLists((prev) => [newList, ...prev]);
        setSelectedId(newList.id);
      } else if (intent.action === 'refine' && intent.list_id) {
        const updatedList = await sendMessage(intent.list_id, intent.message);
        handleListUpdated(updatedList);
        setSelectedId(intent.list_id);
      } else if (intent.action === 'complete' && intent.list_id) {
        const updatedList = await completeTodoList(intent.list_id, true);
        handleListCompleted(updatedList);
        setSelectedId(intent.list_id);
      } else if (intent.action === 'uncomplete' && intent.list_id) {
        const updatedList = await completeTodoList(intent.list_id, false);
        handleListCompleted(updatedList);
        setSelectedId(intent.list_id);
      } else {
        const newList = await generateTodoList(intent.message);
        setLists((prev) => [newList, ...prev]);
        setSelectedId(newList.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process request');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>✦</span>
            <span>AI Todo</span>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>What do you need to get done?</h1>
          <p className={styles.heroSub}>Describe a goal and AI will build a todo list for you.</p>
          <PromptForm onSubmit={handleGenerate} loading={generating} />
          {error && <p className={styles.error}>{error}</p>}
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Your Lists</h2>
            <button className={styles.refreshBtn} onClick={() => void fetchLists()} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {lists.length === 0 && !loading ? (
            <p className={styles.empty}>No lists yet. Generate one above.</p>
          ) : (
            <div className={styles.grid}>
              {lists.map((list) => (
                <TodoListCard
                  key={list.id}
                  list={list}
                  active={selectedId === list.id}
                  onClick={() => setSelectedId(selectedId === list.id ? null : list.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {selected && (
        <TodoListDetail
          list={selected}
          onClose={() => setSelectedId(null)}
          onItemToggle={handleItemToggle}
          onListUpdated={handleListUpdated}
          onListCompleted={handleListCompleted}
        />
      )}
    </div>
  );
}
