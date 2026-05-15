import { useState, useEffect } from 'react';
import api from 'src/api/axios';
import { useUser } from 'src/lib/better-auth';

const ID_LOCALE = 'id-ID';

// Map rundown item type to color
const getRundownColor = (type: string) => {
    switch (type) {
        case 'registration':
            return '#F8C20A'; // Warning/Gold
        case 'session':
            return '#B58E36'; // Primary/Gold
        case 'break':
            return '#3C88FE'; // Info/Blue
        default:
            return '#98A4AE'; // Gray
    }
};

const getDefaultTrainer = () => ({
    name: 'Trainer TBD',
    userId: 'trainer-default',
    position: 'Senior Trainer',
    assignedBy: 'Admin',
});

const formatIdDate = (
    input: string | Date,
    options: Intl.DateTimeFormatOptions,
): string => new Date(input).toLocaleDateString(ID_LOCALE, options);

const getTrainingDateRange = (
    startDateRaw: string,
    endDateRaw?: string,
): { dateStart: string; dateEnd: string } => {
    const start = new Date(startDateRaw);
    const end = endDateRaw
        ? new Date(endDateRaw)
        : new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return {
            dateStart: startDateRaw || '-',
            dateEnd: endDateRaw || '-',
        };
    }

    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();

    if (sameMonth) {
        return {
            dateStart: formatIdDate(start, { day: 'numeric' }),
            dateEnd: formatIdDate(end, { day: 'numeric', month: 'short' }),
        };
    }

    if (sameYear) {
        return {
            dateStart: formatIdDate(start, { day: 'numeric', month: 'short' }),
            dateEnd: formatIdDate(end, { day: 'numeric', month: 'short' }),
        };
    }

    return {
        dateStart: formatIdDate(start, { day: 'numeric', month: 'short', year: 'numeric' }),
        dateEnd: formatIdDate(end, { day: 'numeric', month: 'short', year: 'numeric' }),
    };
};

// Adapter to match Frontend UI expectations from Backend Data
const adaptBatchToTraining = async (
    batch: any,
    profile: any,
    authUser: any,
    fetchRundownTemplate: (templateId: string) => Promise<any>,
    fetchTrainer: (trainerId: string) => Promise<any>,
) => {
    const [template, trainerData] = await Promise.all([
        batch.rundownTemplateId ? fetchRundownTemplate(batch.rundownTemplateId) : Promise.resolve(null),
        batch.trainerId ? fetchTrainer(batch.trainerId) : Promise.resolve(null),
    ]);

    const rundownItems = Array.isArray(template?.items)
        ? template.items.map((item: any) => ({
              time: item.time,
              event: item.title,
              color: getRundownColor(item.type),
          }))
        : [];

    // Determine participant name:
    // 1. Auth user Name (most accurate for Auth)
    // 2. DB Profile Name
    // 3. Fallback
    const participantName = authUser?.fullName || profile?.nama || 'Peserta';
    const participantUserId = authUser?.id || profile?.id || 'participant-default';
    const participantAvatar = authUser?.imageUrl || profile?.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(participantName)}&background=B58E36&color=fff`;
    const dateRange = getTrainingDateRange(batch.tanggal, batch.tanggalSelesai);

    return {
        id: batch.id,
        title: batch.namaBatch,
        location: batch.hotel || batch.alamat || 'Online',
        image: batch.imageUrl || '/src/assets/images/trainings/training-1.jpg',
        dateStart: dateRange.dateStart,
        dateEnd: dateRange.dateEnd,
        coordinates: [
            batch.latitude || -6.2088,
            batch.longitude || 106.8456
        ],
        participant: {
            name: participantName,
            userId: participantUserId,
            avatar: participantAvatar,
        },
        trainer: trainerData
            ? {
                  name: trainerData.nama,
                  userId: trainerData.id || `trainer-${batch.trainerId}`,
                  position: trainerData.jabatan || 'Trainer',
                  bio: trainerData.bio,
                  assignedBy: 'Admin',
              }
            : getDefaultTrainer(),
        stats: {
            participants: batch.participantsCount || 0,
            comments: 0, // Mocked for now
        },
        rundown: rundownItems,
        paymentStatus: batch.paymentStatus === 'paid' ? 'Lunas' : (batch.paymentStatus ? batch.paymentStatus.charAt(0).toUpperCase() + batch.paymentStatus.slice(1) : 'Pending'),
    };
};

export const useTrainingInfo = () => {
    const [trainings, setTrainings] = useState<any[]>([]);
    const [selectedTraining, setSelectedTraining] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { user: authUser } = useUser();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const rundownTemplateCache = new Map<string, Promise<any>>();
            const trainerCache = new Map<string, Promise<any>>();

            const fetchRundownTemplate = (templateId: string) => {
                if (!rundownTemplateCache.has(templateId)) {
                    rundownTemplateCache.set(
                        templateId,
                        api
                            .get(`/rundown-templates/${templateId}`)
                            .then((res) => res.data)
                            .catch((error) => {
                                console.error('Error fetching rundown template:', error);
                                return null;
                            }),
                    );
                }

                return rundownTemplateCache.get(templateId)!;
            };

            const fetchTrainer = (trainerId: string) => {
                if (!trainerCache.has(trainerId)) {
                    trainerCache.set(
                        trainerId,
                        api
                            .get(`/trainer/${trainerId}`)
                            .then((res) => res.data)
                            .catch((error) => {
                                console.error('Error fetching trainer details:', error);
                                return null;
                            }),
                    );
                }

                return trainerCache.get(trainerId)!;
            };

            try {
                const [batchesRes, profileRes] = await Promise.all([
                    api.get('/batch/list'),
                    api.get('/peserta/me'),
                ]);

                const batches = Array.isArray(batchesRes.data) ? batchesRes.data : [];

                // Fetch rundown templates for all batches
                const adaptedTrainings = await Promise.all(
                    batches.map((b: any) =>
                        adaptBatchToTraining(
                            b,
                            profileRes.data,
                            authUser,
                            fetchRundownTemplate,
                            fetchTrainer,
                        ),
                    )
                );

                setTrainings(adaptedTrainings);
                if (adaptedTrainings.length > 0) {
                    setSelectedTraining(adaptedTrainings[0]);
                }
            } catch (err) {
                console.error('Error fetching training info:', err);
            } finally {
                setLoading(false);
            }
        };

        if (authUser) {
            fetchData();
        } else {
            // If authUser is not ready, maybe wait?
            // But useEffect depends on authUser.
            // Let's allow fetching even if authUser undefined, but depend on it.
            fetchData();
        }
    }, [authUser]);

    return {
        trainings,
        selectedTraining,
        setSelectedTraining,
        loading
    };
};
