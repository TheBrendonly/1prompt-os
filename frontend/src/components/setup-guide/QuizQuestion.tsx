import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle } from '@/components/icons';
import { cn } from '@/lib/utils';

interface QuizOption {
  label: string;
  correct: boolean;
}

interface QuizQuestionProps {
  questionId: string;
  questionIndex: number;
  questionText: string;
  options: QuizOption[];
  selectedAnswer: string | undefined;
  showResults: boolean;
  onSelect: (questionId: string, answer: string) => void;
}

// Memoized quiz question component to prevent re-renders when other questions change
const QuizQuestion = memo(function QuizQuestion({
  questionId,
  questionIndex,
  questionText,
  options,
  selectedAnswer,
  showResults,
  onSelect,
}: QuizQuestionProps) {
  return (
    <Card className="p-4">
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <Badge variant="outline" className="font-mono shrink-0">Q{questionIndex + 1}</Badge>
          <p className="font-medium">{questionText}</p>
        </div>
        <div className="space-y-2 ml-8">
          {options.map((option) => {
            const isSelected = selectedAnswer === option.label;
            const isCorrect = option.correct;

            return (
              <button
                type="button"
                key={option.label}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!showResults) {
                    onSelect(questionId, option.label);
                  }
                }}
                disabled={showResults}
                className={cn(
                  "w-full text-left p-3 rounded-lg border-2 transition-colors",
                  !showResults && isSelected && "border-primary bg-primary/10",
                  !showResults && !isSelected && "border-border hover:border-primary/50 hover:bg-primary/5",
                  showResults && isSelected && isCorrect && "border-green-500 bg-green-500/10",
                  showResults && isSelected && !isCorrect && "border-red-500 bg-red-500/10",
                  showResults && !isSelected && isCorrect && "border-green-500/50 bg-green-500/5",
                  showResults && "cursor-default"
                )}
              >
                <div className="flex items-center gap-2">
                  {showResults && isCorrect && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  )}
                  {showResults && isSelected && !isCorrect && (
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                  <span className="text-sm">{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Only re-render if this specific question's state changed
  return (
    prevProps.selectedAnswer === nextProps.selectedAnswer &&
    prevProps.showResults === nextProps.showResults &&
    prevProps.questionId === nextProps.questionId
  );
});

export default QuizQuestion;
