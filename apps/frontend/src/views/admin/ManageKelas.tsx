import { Icon } from "@iconify/react";
import CardBox from "../../components/shared/CardBox";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { useManageKelas } from "./hooks/useManageKelas";
import { Loading } from 'src/components/ui/loading';
// import { CreateKelasModal } from "./components/CreateKelasModal"; // Will create this next
import { useNavigate } from "react-router";

const ManageKelas = () => {
    const { courses, loading, refetch, deleteCourse } = useManageKelas();
    const navigate = useNavigate();

    const handleCreate = () => {
        navigate('/admin/manage-kelas/create');
    };

    const handleEdit = (course: any) => {
        navigate(`/admin/manage-kelas/edit/${course.id}`);
    };

    if (loading) {
        return <Loading fullPage />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-end">
                <Button
                    className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md"
                    onClick={handleCreate}
                >
                    <Icon icon="solar:add-circle-linear" className="mr-2" height={18} />
                    Buat Kelas Baru
                </Button>
            </div>

            {/* Course List */}
            <CardBox>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-dark">Daftar Materi</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Icon
                                icon="solar:magnifer-linear"
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                height={16}
                            />
                            <input
                                type="text"
                                placeholder="Cari kelas..."
                                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-primary w-64"
                            />
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider">
                                    Judul Kelas
                                </th>
                                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider text-center">
                                    Total Chapters
                                </th>
                                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="py-3 px-4 text-xs font-semibold text-bodytext uppercase tracking-wider text-right">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {courses.length > 0 ? (
                                courses.map((course) => (
                                    <tr
                                        key={course.id}
                                        className="group hover:bg-gray-50/50 transition-colors cursor-pointer"
                                        onClick={() => handleEdit(course)}
                                    >
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-gray-100">
                                                    {course.imageUrl ? (
                                                        <img
                                                            src={course.imageUrl}
                                                            alt={course.title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-full h-full bg-gradient-to-br from-[#F8F4ED] to-[#EDE5D8] flex items-center justify-center ${course.imageUrl ? 'hidden' : ''}`}>
                                                        <Icon icon="solar:book-minimalistic-bold" className="text-[#C4B596]" height={20} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold text-dark leading-tight">{course.title}</p>
                                                    <p className="text-xs text-bodytext mt-1 line-clamp-1 max-w-[300px]">{course.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="text-sm font-medium text-dark">{course.totalChapters || 0}</span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge className={`shadow-none font-semibold px-3 py-1 border-none capitalize
                                                ${course.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}
                                             `}>
                                                {course.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 p-0 rounded-xl hover:bg-blue-50 text-[#4287F5] transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEdit(course);
                                                    }}
                                                >
                                                    <Icon icon="solar:pen-linear" height={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 p-0 rounded-xl hover:bg-red-50 text-red-500 transition-all"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteCourse(course.id);
                                                    }}
                                                >
                                                    <Icon icon="solar:trash-bin-trash-linear" height={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <Icon icon="solar:box-minimalistic-linear" height={64} />
                                            <p className="mt-2 font-medium">Belum ada kelas</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardBox>

            {/* <CreateKelasModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={refetch}
                courseToEdit={selectedCourse}
            /> */}
        </div>
    );
};

export default ManageKelas;
