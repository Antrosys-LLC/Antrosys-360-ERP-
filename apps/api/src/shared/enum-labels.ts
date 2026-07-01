export function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

export function enumOptions<T extends string>(values: readonly T[]) {
  return values.map((value) => ({
    value,
    label: formatEnumLabel(value),
  }));
}
