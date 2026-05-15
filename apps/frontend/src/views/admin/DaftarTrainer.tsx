import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import CardBox from "../../components/shared/CardBox";
import { Button } from "../../components/ui/button";
import { useAuthAxios } from "../../hooks/useAuthAxios";
import { Loading, ButtonLoading } from "src/components/ui/loading";
import { toast } from "react-toastify";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

const DaftarTrainer = () => {
    const api = useAuthAxios();
    const [trainers, setTrainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingTrainer, setEditingTrainer] = useState<any>(null);

    const [formData, setFormData] = useState({
        nama: "",
        jabatan: "",
        bio: "",
        fotoUrl: "",
    });

    const fetchTrainers = async () => {
        try {
            setLoading(true);
            const response = await api.get("/trainer/list");
            setTrainers(response.data);
        } catch (error) {
            console.error("Error fetching trainers:", error);
            toast.error("Gagal mengambil data trainer");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrainers();
    }, []);

    const handleOpenModal = (trainer: any = null) => {
        if (trainer) {
            setEditingTrainer(trainer);
            setFormData({
                nama: trainer.nama || "",
                jabatan: trainer.jabatan || "",
                bio: trainer.bio || "",
                fotoUrl: trainer.fotoUrl || "",
            });
        } else {
            setEditingTrainer(null);
            setFormData({
                nama: "",
                jabatan: "",
                bio: "",
                fotoUrl: "",
            });
        }
        setModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingTrainer) {
                await api.patch(`/trainer/${editingTrainer.id}`, formData);
                toast.success("Trainer berhasil diperbarui");
            } else {
                await api.post("/trainer/create", formData);
                toast.success("Trainer berhasil ditambahkan");
            }
            setModalOpen(false);
            fetchTrainers();
        } catch (error) {
            console.error("Error saving trainer:", error);
            toast.error("Gagal menyimpan data trainer");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Apakah Anda yakin ingin menghapus trainer ini?")) return;
        try {
            await api.delete(`/trainer/${id}`);
            toast.success("Trainer berhasil dihapus");
            fetchTrainers();
        } catch (error) {
            console.error("Error deleting trainer:", error);
            toast.error("Gagal menghapus trainer");
        }
    };

    if (loading) {
        return <Loading fullPage text="Memuat data trainer..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 text-[#B58E36] mb-1">
                        <Icon icon="solar:user-speak-rounded-line-duotone" height={18} />
                        <span className="text-sm font-semibold">Admin</span>
                    </div>
                    <h2 className="text-3xl font-bold text-dark">Daftar Trainer</h2>
                    <p className="text-bodytext text-sm">Kelola informasi trainer untuk sesi training.</p>
                </div>
                <Button className="rounded-xl shadow-md" onClick={() => handleOpenModal()}>
                    <Icon icon="solar:add-circle-linear" className="mr-2" height={18} />
                    Tambah Trainer
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trainers.map((trainer) => (
                    <CardBox key={trainer.id} className="border border-gray-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="relative flex-shrink-0">
                                {trainer.fotoUrl ? (
                                    <img
                                        src={trainer.fotoUrl}
                                        alt={trainer.nama}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-primary/10 transition-transform hover:scale-105"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-[#B58E36] to-[#8D6E2A] flex items-center justify-center text-white font-bold text-xl border-2 border-primary/10 ${trainer.fotoUrl ? 'hidden' : ''}`}>
                                    {trainer.nama?.charAt(0)?.toUpperCase() || 'T'}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-lg text-dark mb-0">{trainer.nama}</h4>
                                <p className="text-primary text-sm font-semibold uppercase tracking-wider">{trainer.jabatan || "Trainer"}</p>
                            </div>
                        </div>
                        <p className="text-bodytext text-sm line-clamp-3 mb-4 min-h-[4.5rem]">
                            {trainer.bio || "No bio available."}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 rounded-lg" onClick={() => handleOpenModal(trainer)}>
                                <Icon icon="solar:pen-new-square-linear" className="mr-1" /> Edit
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 rounded-lg text-error hover:text-error hover:bg-error/5"
                                onClick={() => handleDelete(trainer.id)}
                            >
                                <Icon icon="solar:trash-bin-trash-linear" className="mr-1" /> Hapus
                            </Button>
                        </div>
                    </CardBox>
                ))}
            </div>

            {trainers.length === 0 && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                    <Icon icon="solar:user-speak-rounded-line-duotone" className="mx-auto text-gray-300 mb-4" height={64} />
                    <h3 className="text-xl font-bold text-dark mb-2">Belum ada trainer</h3>
                    <p className="text-bodytext mb-6">Mulai tambahkan trainer untuk dapat di-assign ke batch training.</p>
                    <Button variant="outline" className="rounded-xl" onClick={() => handleOpenModal()}>
                        Tambah Trainer Sekarang
                    </Button>
                </div>
            )}

            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md z-[9999]">
                    <DialogHeader>
                        <DialogTitle>{editingTrainer ? "Edit Trainer" : "Tambah Trainer Baru"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nama">Nama Lengkap</Label>
                            <Input
                                id="nama"
                                name="nama"
                                value={formData.nama}
                                onChange={handleChange}
                                placeholder="Masukkan nama lengkap"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jabatan">Jabatan / Posisi</Label>
                            <Input
                                id="jabatan"
                                name="jabatan"
                                value={formData.jabatan}
                                onChange={handleChange}
                                placeholder="E.g. Senior Master Trainer"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fotoUrl">URL Foto Profil</Label>
                            <Input
                                id="fotoUrl"
                                name="fotoUrl"
                                value={formData.fotoUrl}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio / Deskripsi Singkat</Label>
                            <Textarea
                                id="bio"
                                name="bio"
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Ceritakan sedikit tentang trainer ini..."
                                rows={4}
                            />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? <ButtonLoading /> : null}
                                {editingTrainer ? "Simpan Perubahan" : "Tambah Trainer"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DaftarTrainer;
