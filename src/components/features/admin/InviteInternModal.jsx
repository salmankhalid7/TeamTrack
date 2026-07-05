// InviteInternModal.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../../api/supabase';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useDisciplines } from '../../../api/queries';
import { useToast } from '../../ui/Toast';

export function InviteInternModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    disciplineId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showTempPassword, setShowTempPassword] = useState(null);
  
  const { data: disciplines = [], isLoading: disciplinesLoading } = useDisciplines();
  const toast = useToast();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ email: '', fullName: '', disciplineId: '' });
      setErrors({});
      setShowTempPassword(null);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email must contain @ symbol';
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }
    
    if (!formData.disciplineId) {
      newErrors.disciplineId = 'Please select a discipline';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setShowTempPassword(null);
    
    try {
      console.log('Sending invite for:', {
        email: formData.email,
        fullName: formData.fullName,
        disciplineId: formData.disciplineId,
      });

      const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-intern', {
        body: {
          email: formData.email,
          fullName: formData.fullName,
          disciplineId: formData.disciplineId,
          sendEmail: true, // Set to false if you want to manually share passwords
        },
      });

      console.log('Invite response:', inviteData);

      if (inviteError) {
        console.error('Invite error:', inviteError);
        throw new Error(inviteError.message || 'Failed to send invitation');
      }

      if (!inviteData.success) {
        throw new Error(inviteData.error || 'Invitation failed');
      }

      // Show temp password if email wasn't sent
      if (inviteData.tempPassword) {
        setShowTempPassword(inviteData.tempPassword);
        toast.info(`Account created! Temporary password: ${inviteData.tempPassword}`);
      } else {
        toast.success(`Invitation sent to ${formData.email}`);
      }

      // Reset form
      setFormData({ email: '', fullName: '', disciplineId: '' });
      
      // Notify parent
      if (onSuccess) {
        onSuccess(inviteData);
      }
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Full invite error:', error);
      
      // Better error messages
      let errorMessage = 'Failed to send invitation';
      if (error.message?.includes('409') || error.message?.includes('already exists')) {
        errorMessage = 'This email is already registered in the system.';
      } else if (error.message?.includes('domain not allowed')) {
        errorMessage = `Email domain not allowed. Use one of: gmail.com, outlook.com, etc.`;
      } else if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many invitations sent. Please wait a moment.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      title="Invite New Intern"
      size="md"
    >
      <form onSubmit={handleInvite} className="space-y-5">
        {/* Full Name Field */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] text-opacity-90 mb-1.5">
            Full Name *
          </label>
          <Input
            value={formData.fullName}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, fullName: e.target.value }));
              if (errors.fullName) setErrors(prev => ({ ...prev, fullName: null }));
            }}
            error={errors.fullName}
            placeholder="Intern Name"
            disabled={isLoading}
            className="w-full"
          />
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] text-opacity-90 mb-1.5">
            Email Address *
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, email: e.target.value }));
              if (errors.email) setErrors(prev => ({ ...prev, email: null }));
            }}
            error={errors.email}
            placeholder="intern@company.com"
            disabled={isLoading}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Allowed domains: gmail.com, outlook.com, hotmail.com, yahoo.com, techtide.co
          </p>
        </div>

        {/* Discipline Select */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] text-opacity-90 mb-1.5">
            Discipline *
          </label>
          <select
            value={formData.disciplineId}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, disciplineId: e.target.value }));
              if (errors.disciplineId) setErrors(prev => ({ ...prev, disciplineId: null }));
            }}
            className={`w-full px-4 py-2.5 rounded-lg border ${
              errors.disciplineId ? 'border-red-500' : 'border-[rgba(43,45,66,0.12)]'
            } text-[#2b2d42] bg-white focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1 disabled:opacity-50`}
            disabled={isLoading || disciplinesLoading}
          >
            <option value="">Select discipline...</option>
            {disciplines.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {errors.disciplineId && (
            <p className="text-sm text-red-500 mt-1">{errors.disciplineId}</p>
          )}
        </div>

        {/* Temporary Password Display */}
        {showTempPassword && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-1">
              ✅ Account Created Successfully!
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-600">Temporary Password:</span>
              <code className="px-3 py-1 bg-white border border-gray-200 rounded text-sm font-mono text-gray-800">
                {showTempPassword}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(showTempPassword);
                  toast.info('Password copied to clipboard');
                }}
                className="text-xs text-[#0080c8] hover:underline"
              >
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ⚠️ Please share this password with the intern securely.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-[#92dce5] bg-opacity-10 rounded-lg border border-[#92dce5] border-opacity-20">
          <div className="flex items-start gap-2">
            <span className="text-lg">📧</span>
            <div>
              <p className="text-sm text-[#2b2d42] text-opacity-80">
                An email will be sent with login credentials. 
                The intern will use this email to sign in.
              </p>
              <p className="text-xs text-[#2b2d42] text-opacity-60 mt-1">
                Password will be set on first login.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button 
            variant="ghost" 
            onClick={handleClose} 
            type="button"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            isLoading={isLoading}
            disabled={isLoading || disciplinesLoading}
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}