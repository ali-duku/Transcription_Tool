interface QuestionValidationSummaryProps {
  errors: string[];
  warnings: string[];
}

export function QuestionValidationSummary({ errors, warnings }: QuestionValidationSummaryProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return null;
  }

  return (
    <div className="question-validation-summary">
      {errors.length > 0 ? (
        <div className="question-validation-errors">
          <strong>Errors</strong>
          <ul>
            {errors.map((message, index) => (
              <li key={`q-error-${index}`}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {warnings.length > 0 ? (
        <div className="question-validation-warnings">
          <strong>Warnings</strong>
          <ul>
            {warnings.map((message, index) => (
              <li key={`q-warning-${index}`}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
