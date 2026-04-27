interface TextListProps {
  values: string[];
}

export function TextList({ values }: TextListProps) {
  if (values.length === 0) return null;
  return (
    <ul className="mt-1 grid gap-1">
      {values.map((v, i) => (
        <li key={i} className="text-sm text-slate-600 leading-relaxed">
          • {v}
        </li>
      ))}
    </ul>
  );
}
