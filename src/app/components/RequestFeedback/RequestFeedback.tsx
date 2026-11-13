interface RequestFeedbackProps {
  message: string;
  context?: string;
  kind?: 'error' | 'success';
}

export default function RequestFeedback({ message, context, kind = 'error' }: RequestFeedbackProps) {
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={`mb-4 p-3 border rounded ${kind === 'error' ? 'bg-red-100 border-red-400 text-red-700' : 'bg-green-100 border-green-400 text-green-800'}`}
    >
      {context ? `${context}: ` : ''}{message}
    </div>
  );
}
