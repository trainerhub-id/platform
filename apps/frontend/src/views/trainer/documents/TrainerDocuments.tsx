import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@iconify/react';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { Button } from 'src/components/ui/button';

const TrainerDocuments = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const redirectTimer = window.setTimeout(() => {
      navigate('/user/ai-hub/trainer', { replace: true });
    }, 1200);

    return () => window.clearTimeout(redirectTimer);
  }, [navigate]);

  return (
    <div className="space-y-6">
      <Alert className="border-primary/30 bg-primary/5">
        <Icon icon="solar:magic-stick-3-bold" className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm leading-6">
          Halaman dokumen trainer sudah dipindahkan ke <strong>AI Hub</strong> supaya alur generate,
          progress, dan download tetap konsisten.
        </AlertDescription>
      </Alert>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Icon icon="solar:folder-with-files-bold-duotone" className="text-primary" height={32} />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          Mengalihkan ke AI Hub Trainer...
        </h2>
        <p className="mt-2 text-sm text-bodytext">
          Sekarang semua aksi <strong>generate dokumen</strong>, <strong>generate semua</strong>, dan <strong>unduh hasil</strong>
          dipusatkan di sidebar AI Hub agar tidak membingungkan.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={() => navigate('/user/ai-hub/trainer', { replace: true })}>
            <Icon icon="solar:magic-stick-3-bold" className="mr-2" height={18} />
            Buka AI Hub Trainer
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            Kembali
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainerDocuments;
