import CardBox from "src/components/shared/CardBox";
import { Icon } from "@iconify/react";
import { Button } from "src/components/ui/button";
import { trainingStaticInfo } from "src/data/mockData";
import { UserAvatar } from "src/components/avatar";

interface TrainingDetailTabProps {
    selectedTraining: any;
}

const TrainingDetailTab = ({ selectedTraining }: TrainingDetailTabProps) => {
    return (
        <div className="grid grid-cols-12 gap-8">
            {/* Left Column (Main Info) */}
            <div className="2xl:col-span-8 col-span-12 space-y-8">
                {/* Participant Info */}
                <div className="flex items-center gap-4 mb-2">
                    <div className="relative">
                        <UserAvatar 
                            userId={selectedTraining.participant.userId || 'participant'}
                            size={56}
                            alt={selectedTraining.participant.name}
                            className="w-14 h-14 rounded-full border-2 border-white shadow-sm object-cover"
                        />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-[#1A2537] mb-0">
                            {selectedTraining.participant.name}
                        </h4>
                        <p className="text-[#98A4AE] text-sm">Informasi Profile user</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div>
                        <p className="text-[#98A4AE] text-[11px] mb-1 font-bold uppercase tracking-wider">
                            Nama batch
                        </p>
                        <h5 className="text-sm font-bold text-[#1A2537]">
                            {selectedTraining.title}
                        </h5>
                    </div>
                    <div>
                        <p className="text-[#98A4AE] text-[11px] mb-1 font-bold uppercase tracking-wider">
                            Tanggal training
                        </p>
                        <h5 className="text-sm font-bold text-[#1A2537]">
                            {selectedTraining.dateStart} - {selectedTraining.dateEnd}
                        </h5>
                    </div>
                    <div className="col-span-2">
                        <p className="text-[#98A4AE] text-[11px] mb-1 font-bold uppercase tracking-wider">
                            Address
                        </p>
                        <h5 className="text-sm font-bold text-[#1A2537] leading-normal">
                            {selectedTraining.location}
                        </h5>
                    </div>
                    <div>
                        <p className="text-[#98A4AE] text-[11px] mb-1 font-bold uppercase tracking-wider">
                            Jam registrasi
                        </p>
                        <h5 className="text-sm font-bold text-[#1A2537]">
                            {trainingStaticInfo.registrationTime}
                        </h5>
                    </div>
                    <div>
                        <p className="text-[#98A4AE] text-[11px] mb-1 font-bold uppercase tracking-wider">
                            Jam sesi
                        </p>
                        <h5 className="text-sm font-bold text-[#1A2537]">
                            {trainingStaticInfo.sessionTime}
                        </h5>
                    </div>
                    <div className="col-span-2">
                        <p className="text-[#98A4AE] text-[11px] mb-1 font-bold uppercase tracking-wider">
                            Kelengkapan. Apa yang Perlu Dibawa
                        </p>
                        <h5 className="text-sm font-medium text-[#1A2537] leading-relaxed">
                            {trainingStaticInfo.requirements}
                        </h5>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button className="bg-[#E8F2FF] hover:bg-[#D6E8FF] text-[#3C88FE] font-bold rounded-xl px-4 py-2 h-auto text-xs shadow-none transition-all border-none outline-none">
                        Cek Status Pembayaran: {selectedTraining.paymentStatus || "PENDING"}
                    </Button>
                    <Button
                        variant="outline"
                        className="border-gray-200 text-[#1A2537] font-bold rounded-xl px-4 py-2 h-auto text-xs hover:bg-gray-50 transition-all"
                    >
                        Panitia
                    </Button>
                </div>
            </div>

            {/* Right Column (Trainer Box) */}
            <div className="2xl:col-span-4 col-span-12">
                <CardBox className="bg-[#F4F7FB] border-[#E9F0F8] shadow-none!">
                    <div className="px-3 py-2 border-b border-[#E9F0F8] flex items-center gap-2">
                        <Icon
                            icon="solar:user-rounded-bold"
                            className="text-[#98A4AE]"
                            height={18}
                        />
                        <span className="text-[11px] font-bold text-[#1A2537] uppercase tracking-wider">
                            Informasi Trainer
                        </span>
                    </div>
                    <div className="p-3 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                                <UserAvatar 
                                    userId={selectedTraining.trainer.userId || selectedTraining.trainer.id || 'trainer'}
                                    size={48}
                                    alt={selectedTraining.trainer.name}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            </div>
                            <div>
                                <h5 className="text-base font-bold text-[#1A2537] mb-0">
                                    {selectedTraining.trainer.name}
                                </h5>
                                <p className="text-[#98A4AE] text-xs font-bold">
                                    {selectedTraining.trainer.position}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[#1A2537] text-sm leading-relaxed">
                                Hello {selectedTraining.trainer.name},
                            </p>
                            <p className="text-[#1A2537] text-xs leading-relaxed opacity-80">
                                {selectedTraining.trainer.bio || "No biography available for this trainer."}
                            </p>
                            <div className="pt-1">
                                <p className="text-[#98A4AE] text-[10px] mb-0.5 font-bold uppercase tracking-wider">
                                    Regards,
                                </p>
                                <h5 className="text-sm font-bold text-[#1A2537]">
                                    {selectedTraining.trainer.assignedBy || "Admin"}
                                </h5>
                            </div>
                        </div>
                    </div>
                </CardBox>
            </div>
        </div>
    );
};

export default TrainingDetailTab;
