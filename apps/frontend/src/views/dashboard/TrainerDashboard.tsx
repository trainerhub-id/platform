import TrainingCard from "src/components/dashboards/trainer/TrainingCard";
import ProgressJourney from "src/components/dashboards/trainer/ProgressJourney";
import QuickAccess from "src/components/dashboards/trainer/QuickAccess";
import { TodoList } from "src/features/todos/TodoList";
import { useUserDashboard } from "./hooks/useUserDashboard";
import { Loading } from "src/components/ui/loading";
import { useEffect, useState } from 'react';
import { useUser } from 'src/lib/better-auth';
import { SetPasswordDialog } from 'src/components/SetPasswordDialog';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Button } from 'src/components/ui/button';
import { CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

// Static alerts - will be replaced with notifications API later
export default function TrainerDashboard() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const { activeBatch, loading, profile } = useUserDashboard();

  const needsPasswordSetup = user?.publicMetadata?.needsPasswordSetup === true;

  useEffect(() => {
    // Show password setup dialog for new users from payment
    const hasSeenDialog = sessionStorage.getItem('passwordDialogShown');

    console.log('[TrainerDashboard] Checking popup conditions:', {
      isLoaded,
      needsPasswordSetup,
      hasSeenDialog,
      publicMetadata: user?.publicMetadata,
    });

    if (!isLoaded || !needsPasswordSetup || hasSeenDialog) {
      console.log('[TrainerDashboard] ❌ Popup not shown');
      return;
    }

    console.log('[TrainerDashboard] ✅ Showing password dialog');
    const timer = window.setTimeout(() => {
      setShowPasswordDialog(true);
      // Mark as shown so it won't appear again in this session
      sessionStorage.setItem('passwordDialogShown', 'true');
    }, 1500); // 1.5 second delay for better UX

    return () => window.clearTimeout(timer);
  }, [isLoaded, needsPasswordSetup, user?.publicMetadata]);

  const paymentStatus = user?.publicMetadata?.paymentStatus as string | undefined;

  if (loading) {
    return <Loading fullPage text="Memuat dashboard..." />;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // TODO: Alerts could eventually be dynamic based on approaching deadlines

  return (
    <div className="space-y-6">
      {/* Payment Status Banner */}
      {paymentStatus === 'unpaid' && (
        <Alert className="border-orange-500 bg-orange-50">
          <CreditCard className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-orange-800">
                  Complete your payment to unlock full access
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  You're currently exploring with limited access. Complete payment to access all courses and certificates.
                </p>
              </div>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => {
                  // TODO: Add retry payment flow
                  toast.info('Retry payment feature coming soon');
                }}
                className="shrink-0"
              >
                Complete Payment
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {paymentStatus === 'paid' && user?.publicMetadata?.source === 'payment_success' && (
        <Alert className="border-green-500 bg-green-50">
          <AlertDescription>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <p className="font-medium text-green-800">
                🎉 Welcome! Your payment was successful and you have full access to all courses
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Training Banner & Progress */}
      <div className="mb-6">
        <TrainingCard batch={activeBatch} paymentStatus={profile?.profile?.paymentStatus || profile?.paymentStatus} />
      </div>

      {/* Progress Journey + Quick Access (8 cols) & Todo List (4 cols) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="lg:col-span-8 col-span-12 space-y-6">
          <ProgressJourney journey={activeBatch?.journey} />
          <QuickAccess />
        </div>
        <div className="lg:col-span-4 col-span-12 lg:sticky lg:top-[100px] lg:self-start">
          <TodoList />
        </div>
      </div>

      {/* Set Password Dialog - Optional popup */}
      <SetPasswordDialog 
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
      />
    </div>
  );
}
