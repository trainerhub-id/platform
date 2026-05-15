import { Icon } from "@iconify/react";
import CardBox from "../../components/shared/CardBox";
import { Button } from "../../components/ui/button";
import AdminStatsCard from "../../components/shared/AdminStatsCard";
import { useAdminDashboard } from "./hooks/useAdminDashboard";
import { useDaftarPeserta } from "./hooks/useDaftarPeserta";
import { Loading } from 'src/components/ui/loading';
import { TodoList } from "src/features/todos/TodoList";

const AdminHome = () => {
    const { stats, loading } = useAdminDashboard();
    const { participants, loading: loadingParticipants } = useDaftarPeserta();

    if (loading) {
        return <Loading fullPage />;
    }

    // Default stats fallback if response mock is incomplete
    const dashboardStats = [
        {
            title: "Total Peserta",
            subtitle: "Total peserta terdaftar",
            value: String(stats?.totalPeserta || 0),
            icon: "solar:users-group-rounded-bold",
            colors: { bg: "bg-lightprimary", iconBg: "bg-primary", text: "text-primary" }
        },
        {
            title: "Total Batch",
            subtitle: "Batch training aktif",
            value: String(stats?.totalBatches || 0),
            icon: "solar:video-library-bold",
            colors: { bg: "bg-lightsecondary", iconBg: "bg-secondary", text: "text-secondary" }
        },
        {
            title: "Dokumen Masuk",
            subtitle: "Menunggu review",
            value: String(stats?.documents?.pending || 0),
            icon: "solar:file-text-bold",
            colors: { bg: "bg-lightwarning", iconBg: "bg-warning", text: "text-warning" }
        },
        {
            title: "Sertifikat",
            subtitle: "Sertifikat diterbitkan",
            value: stats?.completionRate ? `${stats.completionRate}%` : "0%",
            icon: "solar:diploma-verified-bold",
            colors: { bg: "bg-lightsuccess", iconBg: "bg-success", text: "text-success" }
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 text-[#B58E36] mb-1">
                    <Icon icon="solar:home-smile-angle-outline" height={18} />
                    <span className="text-sm font-semibold">Dashboard</span>
                </div>
                <h2 className="text-3xl font-bold text-dark">Selamat Datang, Admin.</h2>
                <p className="text-bodytext text-sm">Berikut adalah ringkasan aktivitas training center Anda hari ini.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {dashboardStats.map((stat, index) => (
                    <AdminStatsCard
                        key={stat.title}
                        title={stat.title}
                        subtitle={stat.subtitle}
                        value={stat.value}
                        icon={stat.icon}
                        colors={stat.colors}
                    />
                ))}
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* To-Do List */}
                <div className="col-span-12 lg:col-span-4">
                    <TodoList isAdmin={true} />
                </div>

                {/* Recent Participants */}
                <div className="col-span-12 lg:col-span-8">
                    <CardBox className="h-full">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-dark">Peserta Terbaru</h3>
                                <p className="text-sm text-bodytext">Pendaftar training batch bulan ini</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => window.location.href = '/admin/daftar-peserta'}>
                                    <Icon icon="solar:users-group-rounded-linear" className="mr-2" height={16} />
                                    Lihat Semua
                                </Button>
                            </div>
                        </div>

                        {loadingParticipants ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : participants.length === 0 ? (
                            <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50">
                                <p className="text-gray-500">Belum ada peserta terdaftar.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {participants.slice(0, 5).map((participant) => (
                                    <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                                <img
                                                    src={participant.avatar}
                                                    alt={participant.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${participant.name}&background=random`;
                                                    }}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-dark text-sm">{participant.name}</p>
                                                <p className="text-xs text-gray-500">{participant.contact.split('|')[0]}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                                participant.paymentStatus === 'paid' ? 'bg-green-50 text-green-600' :
                                                participant.paymentStatus === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                                                'bg-red-50 text-red-600'
                                            }`}>
                                                {participant.paymentStatus === 'paid' ? 'Lunas' : 
                                                 participant.paymentStatus === 'pending' ? 'Pending' : 'Belum Lunas'}
                                            </span>
                                            <span className="text-xs text-gray-400">{participant.batch}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBox>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;
