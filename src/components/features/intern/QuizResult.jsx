import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Award, ThumbsUp, ThumbsDown, TrendingUp, AlertCircle } from 'lucide-react';

export function QuizResult({ result, onRetry }) {
  const percentage = Math.round((result.score / result.total_marks) * 100);
  
  const getScoreLevel = () => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    return 'needs_practice';
  };

  const scoreLevel = getScoreLevel();

  const config = {
    excellent: {
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Passed with Distinction',
      icon: Award,
      message: 'Outstanding performance – you\'ve mastered this quiz.',
    },
    good: {
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      label: 'Passed',
      icon: ThumbsUp,
      message: 'Good effort! Review the areas you missed to solidify your knowledge.',
    },
    needs_practice: {
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Needs Improvement',
      icon: AlertCircle,
      message: 'Don\'t worry – review the material and try again to improve your score.',
    },
  };

  const { color, bg, border, label, icon: Icon, message } = config[scoreLevel];
  const circumference = 339.292; // 2 * pi * 54

  return (
    <Card className="text-center p-6 max-w-sm mx-auto shadow-lg hover:shadow-xl transition-shadow duration-200">
      {/* Score Circle */}
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#e9ecef"
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className={color}
            strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>
            {percentage}%
          </span>
          <span className="text-xs text-gray-500">
            {result.score}/{result.total_marks}
          </span>
        </div>
      </div>

      {/* Icon + Feedback */}
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${bg} ${border} border-2 mb-3`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <h3 className={`text-lg font-semibold ${color} mb-1`}>
        {label}
      </h3>
      <p className="text-sm text-gray-600 max-w-xs mx-auto mb-4">
        {message}
      </p>

      <Badge variant={scoreLevel === 'excellent' ? 'success' : scoreLevel === 'good' ? 'warning' : 'danger'} size="md" className="mb-4">
        {percentage >= 80 ? 'Score: High' : percentage >= 60 ? 'Score: Medium' : 'Score: Low'}
      </Badge>

      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-2">
          <TrendingUp className="w-4 h-4 mr-2" />
          Retry Quiz
        </Button>
      )}
    </Card>
  );
}