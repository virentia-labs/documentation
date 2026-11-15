// Rows register their value here; the benchmark updates every 10th row through it.
export let values: { value: number }[] = [];
export function resetValues(): { value: number }[] { values = []; return values; }
export function register(id: number, value: { value: number }): void { values[id] = value; }
