import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '../../../components/ui/dialog';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Button } from '../../../components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { DateRangePicker } from '../../../components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import api from '../../../api/axios';
import { LocationPicker } from '../../../components/shared/LocationPicker';
import { ButtonLoading } from 'src/components/ui/loading';
import { BatchTierSection } from './BatchTierSection';

interface CreateBatchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    batchToEdit?: any;
}

export const CreateBatchModal = ({ open, onOpenChange, onSuccess, batchToEdit }: CreateBatchModalProps) => {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<any[]>([]);
    const [trainers, setTrainers] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        namaBatch: '',
        tanggal: '',
        tanggalSelesai: '',
        hotel: '',
        alamat: '',
        mapsLink: '',
        imageUrl: '',
        rundownTemplateId: '',
        trainerId: '',
        courseId: '',
        latitude: null as number | null,
        longitude: null as number | null,
        status: 'draft',
    });
    const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            fetchTemplates();
            fetchTrainers();
            fetchCourses();
            if (batchToEdit) {
                // Populate form for editing
                setFormData({
                    namaBatch: batchToEdit.namaBatch || batchToEdit.name || '',
                    tanggal: batchToEdit.tanggal ? new Date(batchToEdit.tanggal).toISOString() : (batchToEdit.startDate ? new Date(batchToEdit.startDate).toISOString() : ''),
                    tanggalSelesai: batchToEdit.tanggalSelesai ? new Date(batchToEdit.tanggalSelesai).toISOString() : (batchToEdit.endDate ? new Date(batchToEdit.endDate).toISOString() : ''),
                    hotel: batchToEdit.hotel || '',
                    alamat: batchToEdit.alamat || batchToEdit.address || '',
                    mapsLink: batchToEdit.mapsLink || '',
                    imageUrl: batchToEdit.imageUrl || '',
                    rundownTemplateId: batchToEdit.rundownTemplateId ? batchToEdit.rundownTemplateId.toString() : '',
                    trainerId: batchToEdit.trainerId || '',
                    courseId: batchToEdit.courseId || '',
                    latitude: batchToEdit.latitude !== undefined ? batchToEdit.latitude : null,
                    longitude: batchToEdit.longitude !== undefined ? batchToEdit.longitude : null,
                    status: batchToEdit.status || 'draft',
                });

                if (batchToEdit.tanggal || batchToEdit.startDate) {
                    setSelectedRange({
                        from: new Date(batchToEdit.tanggal || batchToEdit.startDate),
                        to: batchToEdit.tanggalSelesai ? new Date(batchToEdit.tanggalSelesai) : (batchToEdit.endDate ? new Date(batchToEdit.endDate) : undefined),
                    });
                }
            } else {
                // Reset form for creation
                setFormData({
                    namaBatch: '',
                    tanggal: '',
                    tanggalSelesai: '',
                    hotel: '',
                    alamat: '',
                    mapsLink: '',
                    imageUrl: '',
                    rundownTemplateId: '',
                    trainerId: '',
                    courseId: '',
                    latitude: null,
                    longitude: null,
                    status: 'draft',
                });
                setSelectedRange(undefined);
            }
        }
    }, [open, batchToEdit]);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/admin/rundown-templates');
            setTemplates(response.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const fetchTrainers = async () => {
        try {
            const response = await api.get('/trainer/list');
            setTrainers(response.data);
        } catch (error) {
            console.error('Error fetching trainers:', error);
        }
    };

    const fetchCourses = async () => {
        try {
            const response = await api.get('/kelas');
            setCourses(response.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.namaBatch.trim()) newErrors.namaBatch = 'Nama batch wajib diisi';
        if (!formData.tanggal) newErrors.tanggal = 'Tanggal mulai wajib diisi';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            console.log('[CreateBatchModal] Submitting form data:', formData);
            if (batchToEdit) {
                await api.patch(`/batch/${batchToEdit.id}`, formData);
            } else {
                await api.post('/batch/create', formData);
            }
            onSuccess();
            onOpenChange(false);
            // Reset form
            setFormData({
                namaBatch: '',
                tanggal: '',
                tanggalSelesai: '',
                hotel: '',
                alamat: '',
                mapsLink: '',
                imageUrl: '',
                rundownTemplateId: '',
                trainerId: '',
                courseId: '',
                latitude: null,
                longitude: null,
                status: 'draft',
            });
            setSelectedRange(undefined);
        } catch (error: any) {
            console.error('Error saving batch:', error);
            alert(error.response?.data?.message || 'Gagal menyimpan batch');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon icon="solar:add-circle-bold" className="text-primary" height={24} />
                        {batchToEdit ? 'Edit Batch' : 'Buat Batch Baru'}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="info" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="info">Info Batch</TabsTrigger>
                        <TabsTrigger value="tiers">Tier & Pricing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="info">
                        <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="namaBatch">
                            Nama Batch <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="namaBatch"
                            type="text"
                            name="namaBatch"
                            value={formData.namaBatch}
                            onChange={handleChange}
                            variant={errors.namaBatch ? 'failure' : 'default'}
                            placeholder="Batch Training Q1 2024"
                        />
                        {errors.namaBatch && (
                            <p className="text-red-500 text-xs mt-1">{errors.namaBatch}</p>
                        )}
                    </div>


                    <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                        >
                            <SelectTrigger id="status">
                                <SelectValue placeholder="Select status..." />
                            </SelectTrigger>
                            <SelectContent className='z-[99999]'>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="running">Running</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="courseId">Kurikulum / Materi (Course)</Label>
                        <Select
                            value={formData.courseId}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, courseId: val }))}
                        >
                            <SelectTrigger id="courseId">
                                <SelectValue placeholder="Pilih Kurikulum..." />
                            </SelectTrigger>
                            <SelectContent className='z-[99999]'>
                                {courses.length === 0 ? (
                                    <div className="px-2 py-4 text-sm text-bodytext text-center">
                                        No courses available. Create one in Kelas Menu.
                                    </div>
                                ) : (
                                    courses.map((course) => (
                                        <SelectItem key={course.id} value={course.id}>
                                            {course.title}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="tanggal">
                            Tanggal <span className="text-red-500">*</span>
                        </Label>
                        <DateRangePicker
                            value={selectedRange}
                            onChange={(range) => {
                                setSelectedRange(range);
                                if (range?.from) {
                                    setFormData(prev => ({
                                        ...prev,
                                        tanggal: range.from?.toISOString() || '',
                                        tanggalSelesai: range.to?.toISOString() || ''
                                    }));
                                    if (errors.tanggal) {
                                        setErrors(prev => ({ ...prev, tanggal: '' }));
                                    }
                                } else {
                                    setFormData(prev => ({
                                        ...prev,
                                        tanggal: '',
                                        tanggalSelesai: ''
                                    }));
                                }
                            }}
                            placeholder="Pilih tanggal training"
                        />
                        {errors.tanggal && (
                            <p className="text-red-500 text-xs mt-1">{errors.tanggal}</p>
                        )}
                        <div className="space-y-4 pt-4 border-t">
                            <LocationPicker
                                value={formData.latitude && formData.longitude ? { lat: formData.latitude, lng: formData.longitude } : undefined}
                                onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
                                onNameSelect={(name) => setFormData(prev => ({ ...prev, hotel: name }))}
                                onAddressSelect={(address) => setFormData(prev => ({ ...prev, alamat: address }))}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="hotel">Nama Gedung</Label>
                                        <Input
                                            id="hotel"
                                            name="hotel"
                                            value={formData.hotel}
                                            onChange={handleChange}
                                            placeholder="Nama Hotel / Gedung"
                                        />
                                    </div>
                                    <div className="md:col-span-1">
                                        <Label htmlFor="alamat">Alamat</Label>
                                        <Textarea
                                            id="alamat"
                                            name="alamat"
                                            rows={2}
                                            value={formData.alamat}
                                            onChange={handleChange}
                                            placeholder="Jl. Sudirman No. 123..."
                                        />
                                    </div>
                                </div>
                            </LocationPicker>
                        </div>
                    </div>


                    <div>
                        <Label htmlFor="imageUrl">Link Gambar (URL)</Label>
                        <Input
                            id="imageUrl"
                            type="url"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div>
                        <Label htmlFor="rundownTemplateId">Rundown Template</Label>
                        <Select
                            value={formData.rundownTemplateId}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, rundownTemplateId: val }))}
                        >
                            <SelectTrigger id="rundownTemplateId">
                                <SelectValue placeholder="Select a template..." />
                            </SelectTrigger>
                            <SelectContent className='z-[99999]'>
                                {templates.length === 0 ? (
                                    <div className="px-2 py-4 text-sm text-bodytext text-center">
                                        No templates available. Create one in Settings.
                                    </div>
                                ) : (
                                    templates.map((template) => (
                                        <SelectItem key={template.id} value={template.id.toString()}>
                                            {template.name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="trainerId">Trainer</Label>
                        <Select
                            value={formData.trainerId}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, trainerId: val }))}
                        >
                            <SelectTrigger id="trainerId">
                                <SelectValue placeholder="Select a trainer..." />
                            </SelectTrigger>
                            <SelectContent className='z-[99999]'>
                                {trainers.length === 0 ? (
                                    <div className="px-2 py-4 text-sm text-bodytext text-center">
                                        No trainers available. Create one in Daftar Trainer.
                                    </div>
                                ) : (
                                    trainers.map((trainer) => (
                                        <SelectItem key={trainer.id} value={trainer.id}>
                                            {trainer.nama}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                    disabled={loading}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-primary hover:bg-primary/90 text-white"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <ButtonLoading />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Icon icon="solar:check-circle-bold" className="mr-2" height={18} />
                                            Simpan
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    <TabsContent value="tiers">
                        <BatchTierSection batchId={batchToEdit?.id} batchSlug={batchToEdit?.slug} />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog >
    );
};
