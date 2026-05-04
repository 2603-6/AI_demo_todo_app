export interface GeneratedTodoItem {
  title: string;
}

export interface AIGeneratorPort {
  generateTodos(prompt: string): Promise<GeneratedTodoItem[]>;
}
