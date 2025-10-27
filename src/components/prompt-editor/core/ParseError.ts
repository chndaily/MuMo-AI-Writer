export class ParseError extends Error {
  line: number;
  column: number;

  constructor(message: string, line: number, column: number) {
    super(`Error: ${message} at ${line}:${column}`);
    this.name = 'ParseError';
    this.line = line;
    this.column = column;
  }
} 