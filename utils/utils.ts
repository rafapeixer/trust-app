// Definindo o tipo para a função que será debounced
type DebouncedFunction = (...args: any[]) => void;

// Função debounce
export function debounce(func: DebouncedFunction, wait: number): DebouncedFunction {
  let timeout: NodeJS.Timeout;
  return function (...args: any[]) {
    // @ts-ignore
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
