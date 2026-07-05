import { useState } from 'react';
import { useAuth } from '../../../auth/useAuth';
import { useRequestReinstatement } from '../../../api/queries';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/Toast';
import { AlertCircle, CheckCircle, Send, XCircle } from 'lucide-react';

export function SuspendedView() {
  const { profile, user } = useAuth();
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const requestReinstatement = useRequestReinstatement();
  const toast = useToast();

  const handleRequest = async () => {
    if (!reason.trim()) {
      toast.warning('Please provide a reason for reinstatement');
      return;
    }
    
    try {
      await requestReinstatement.mutateAsync({
        internId: user.id,
        reason: reason.trim(),
      });
      
      setIsSubmitted(true);
      toast.success('Reinstatement request submitted');
    } catch (error) {
      toast.error('Failed to submit request');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <Card className="text-center p-6 border-l-4 border-l-red-500 shadow-lg hover:shadow-xl transition-shadow duration-200">
        {/* Suspended Icon */}
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <AlertCircle className="w-10 h-10 text-red-500" strokeWidth={1.5} />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Account Suspended
        </h1>
        
        <p className="text-sm text-gray-500 mb-4">
          Your access to the dashboard is currently restricted.
        </p>
        
        {profile?.suspension_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-6 text-left">
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">Reason for suspension</p>
                <p className="text-sm text-red-600">{profile.suspension_reason}</p>
              </div>
            </div>
          </div>
        )}

        {isSubmitted ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-700">
                Reinstatement Request Submitted
              </p>
            </div>
            <p className="text-sm text-green-600">
              An admin will review your request. You will be notified once a decision is made.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div>
              <label htmlFor="reinstatement-reason" className="block text-sm font-medium text-gray-700 mb-1.5">
                Reason for Reinstatement
              </label>
              <textarea
                id="reinstatement-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why your account should be reinstated..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:border-[#0080c8] resize-none transition-all"
              />
            </div>
            
            <Button
              onClick={handleRequest}
              isLoading={requestReinstatement.isPending}
              className="w-full"
            >
              <Send className="w-4 h-4 mr-2" />
              Request Reinstatement
            </Button>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6">
          If you believe this is a mistake, please contact your program administrator directly.
        </p>
      </Card>
    </div>
  );
}