import { Link, useParams } from 'react-router';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Loading } from 'src/components/ui/loading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { useAdminBatchWorkspace } from './hooks/useAdminBatchWorkspace';
import { EnrollmentTable } from './components/EnrollmentTable';

const tabs = [
  { value: 'overview', label: 'Overview', icon: 'solar:chart-square-linear' },
  { value: 'member', label: 'Member', icon: 'solar:users-group-rounded-linear' },
  { value: 'dokumen', label: 'Dokumen', icon: 'solar:folder-with-files-linear' },
  { value: 'sertifikat', label: 'Sertifikat', icon: 'solar:diploma-linear' },
  { value: 'paket', label: 'Paket & Harga', icon: 'solar:tag-price-linear' },
  { value: 'mentor', label: 'Mentor', icon: 'solar:user-speak-rounded-linear' },
  { value: 'materi', label: 'Materi / Bonus', icon: 'solar:book-bookmark-linear' },
  { value: 'checkout', label: 'Checkout Links', icon: 'solar:link-round-linear' },
  { value: 'activity', label: 'Activity Log', icon: 'solar:history-linear' },
  { value: 'export', label: 'Export', icon: 'solar:export-linear' },
];

const formatDate = (value?: string | null) => {
  if (!value) return 'Belum diatur';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Belum diatur';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getCount = (value: unknown) => {
  const count = Number(value ?? 0);
  return Number.isFinite(count) ? count : 0;
};

const AdminBatchDetail = () => {
  const { batchId } = useParams();
  const { data: batch, isLoading, error, refetch } = useAdminBatchWorkspace(batchId);

  if (isLoading) {
    return <Loading fullPage />;
  }

  if (error || !batch) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" className="rounded-xl text-bodytext hover:text-primary">
          <Link to="/admin/batches">
            <Icon icon="solar:arrow-left-linear" className="mr-2" height={18} />
            Kembali ke Kelola Batch
          </Link>
        </Button>
        <CardBox className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <Icon icon="solar:danger-triangle-linear" height={48} className="text-red-500" />
            <div>
              <h2 className="text-lg font-bold text-dark">Batch tidak dapat dimuat</h2>
              <p className="mt-1 text-sm text-bodytext">
                Workspace batch belum tersedia atau batch tidak ditemukan.
              </p>
            </div>
            <Button onClick={() => refetch()} className="rounded-xl">
              Coba Lagi
            </Button>
          </div>
        </CardBox>
      </div>
    );
  }

  const batchName = batch.namaBatch || batch.name || 'Batch tanpa nama';
  const totalEnrollments = getCount(batch.totalEnrollments);
  const paidEnrollments = getCount(batch.paidEnrollments);
  const pendingPayments = getCount(batch.pendingPayments);
  const unpaidEnrollments = Math.max(totalEnrollments - paidEnrollments - pendingPayments, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Button asChild variant="ghost" className="h-8 rounded-xl px-0 text-bodytext hover:text-primary">
            <Link to="/admin/batches">
              <Icon icon="solar:arrow-left-linear" className="mr-2" height={18} />
              Kelola Batch
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-dark">{batchName}</h2>
              <Badge className="border-none bg-primary/10 text-primary capitalize">
                {String(batch.status || 'draft')}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-bodytext">
              {formatDate(batch.tanggal as string | null)} - {formatDate(batch.tanggalSelesai as string | null)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/admin/manage-training">
              <Icon icon="solar:pen-linear" className="mr-2" height={16} />
              Edit Batch
            </Link>
          </Button>
          <Button onClick={() => refetch()} className="rounded-xl bg-primary text-white hover:bg-primary/90">
            <Icon icon="solar:refresh-linear" className="mr-2" height={16} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <CardBox className="p-4">
          <p className="text-xs font-semibold uppercase text-bodytext">Total Member</p>
          <p className="mt-1 text-2xl font-bold text-dark">{totalEnrollments}</p>
        </CardBox>
        <CardBox className="p-4">
          <p className="text-xs font-semibold uppercase text-bodytext">Paid</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{paidEnrollments}</p>
        </CardBox>
        <CardBox className="p-4">
          <p className="text-xs font-semibold uppercase text-bodytext">Pending Payment</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">{pendingPayments}</p>
        </CardBox>
        <CardBox className="p-4">
          <p className="text-xs font-semibold uppercase text-bodytext">Belum Paid</p>
          <p className="mt-1 text-2xl font-bold text-gray-700">{unpaidEnrollments}</p>
        </CardBox>
      </div>

      <CardBox className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="sticky top-[88px] z-[85] bg-white px-4 dark:bg-darkgray">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2 px-3 py-3">
                <Icon icon={tab.icon} height={16} />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase text-bodytext">Mentor</p>
                <p className="mt-1 font-bold text-dark">{batch.trainerName || 'TBD'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase text-bodytext">Kelas / Bonus</p>
                <p className="mt-1 font-bold text-dark">{batch.courseName || 'Belum dipilih'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-4">
                <p className="text-xs font-semibold uppercase text-bodytext">Batch ID</p>
                <p className="mt-1 break-all font-mono text-sm text-dark">{batch.id}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="member" className="p-4">
            {batchId ? <EnrollmentTable batchId={batchId} /> : null}
          </TabsContent>

          {tabs
            .filter((tab) => tab.value !== 'overview' && tab.value !== 'member')
            .map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="p-4">
                <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                  <Icon icon={tab.icon} height={36} className="mx-auto text-bodytext" />
                  <h3 className="mt-3 font-bold text-dark">{tab.label}</h3>
                  <p className="mt-1 text-sm text-bodytext">
                    Panel ini disiapkan sebagai shell batch workspace untuk workflow berikutnya.
                  </p>
                </div>
              </TabsContent>
            ))}
        </Tabs>
      </CardBox>
    </div>
  );
};

export default AdminBatchDetail;
