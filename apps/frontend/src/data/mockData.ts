// -- Common Data --
export const dashboardUser = {
    name: "David McMichael",
    role: "Admin",
    avatar: "/src/assets/images/profile/user-1.jpg",
    profit: "+15% Profit",
    welcomeMessage: "Hey, David McMichael",
    subMessage: "Aenean vel libero id metus sollicitudin"
};

export const aiGenerationSteps = [
    { id: 1, label: "Pilih jenis dokumen." },
    { id: 2, label: "Jawab pertanyaan AI." },
    { id: 3, label: "Review hasil" },
    { id: 4, label: "Download & submit." },
];

export const trainingStaticInfo = {
    registrationTime: "07.00 WIB",
    sessionTime: "15.30 WIB - Selesai",
    requirements: "KTP Asli, Alat tulis, Laptop, Bukti pembayaran (print / digital), Dokumen awal."
};

// -- Training Data --
export const dummyTrainings = [
    {
        id: "1",
        title: "Training BNSP Batch 1",
        location: "Hotel Bidakari, Jakarta, Indonesia",
        image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400",
        dateStart: "25",
        dateEnd: "28 Des",
        coordinates: [-6.2088, 106.8456] as [number, number], // Monas, Jakarta
        participants: 15,
        documents: 3,
        participant: {
            name: "John Doe",
            role: "Peserta Pelatihan",
            avatar: "https://ui-avatars.com/api/?name=John+Doe",
        },
        paymentStatus: "LUNAS",
        stats: {
            participants: 35,
            comments: 3
        },
        trainer: {
            name: "Jane Smith",
            position: "Senior Trainer",
            avatar: "https://ui-avatars.com/api/?name=Jane+Smith",
            greeting: "Hallo Nama Trainer,",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam ut lacus eget.",
            assignedBy: "James Smith",
        },
        pic: {
            name: "Nama PIC",
            email: "pic@example.com",
            phone: "628123456789",
            avatar: "https://ui-avatars.com/api/?name=PIC",
        },
        time: "07:00 WIB - 15:30 WIB - Selesai",
        facilities: "K-TP, Alat tulis, Laptop, Bukti persyaratan (print / digital), Dokumen: awal",
        rundown: [
            { time: "08.00", event: "Registrasi", color: "#B58E36" },
            { time: "09.00", event: "Training - Sesi 1", color: "#F3A53F" },
            { time: "09.46", event: "Break (ISOMA)", color: "#4287F5" },
            { time: "09.46", event: "Training - Sesi 2", color: "#F3A53F" },
        ]
    },
    {
        id: "2",
        title: "Training BNSP Batch 2",
        location: "Ios Tirta Studio, Bandung, Indonesia",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400",
        dateStart: "01",
        dateEnd: "06 Jan",
        coordinates: [-6.1751, 106.8650] as [number, number], // Grand Indonesia, Jakarta
        participants: 12,
        documents: 2,
        participant: {
            name: "John Doe",
            role: "Peserta Pelatihan",
            avatar: "https://ui-avatars.com/api/?name=John+Doe",
        },
        paymentStatus: "LUNAS",
        stats: {
            participants: 24,
            comments: 5
        },
        trainer: {
            name: "Jane Smith",
            position: "Senior Trainer",
            avatar: "https://ui-avatars.com/api/?name=Jane+Smith",
            greeting: "Hallo Nama Trainer,",
            description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
            assignedBy: "James Smith",
        },
        pic: {
            name: "Nama PIC",
            email: "pic@example.com",
            phone: "628123456789",
            avatar: "https://ui-avatars.com/api/?name=PIC",
        },
        time: "07:00 WIB - 15:30 WIB - Selesai",
        facilities: "K-TP, Alat tulis, Laptop",
        rundown: [
            { time: "08.00", event: "Registrasi", color: "#B58E36" },
            { time: "09.00", event: "Training - Sesi 1", color: "#F3A53F" },
            { time: "09.46", event: "Break (ISOMA)", color: "#4287F5" },
            { time: "09.46", event: "Training - Sesi 2", color: "#F3A53F" },
        ]
    },
];

// -- Kelas Data --
export const dummyKelas = [
    {
        id: "1",
        title: "Judul Kelas #kelas 01",
        description: "Deskripsi singkat kelas 1–2 kalimat",
        image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800",
        totalChapters: 35,
        completedChapters: 1,
        currentChapter: 1,
        progress: 83,
        chapters: [
            {
                id: "01",
                title: "Chapter 01 : Intro",
                status: "selesai",
                lessons: [
                    {
                        id: "1",
                        title: "Intro Kelas",
                        duration: "05 : 00",
                        status: "selesai",
                        description: "Pengenalan dasar mengenai materi yang akan dipelajari dalam kelas ini.",
                        videoUrl: "https://www.youtube.com/watch?v=example1",
                        thumbnail: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800"
                    },
                    {
                        id: "2",
                        title: "Pelajaran 01",
                        duration: "10 : 00",
                        status: "sedang-diproses",
                        description: "Materi pertama yang membahas fundamental penting.",
                        videoUrl: "https://www.youtube.com/watch?v=example2",
                        thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800"
                    },
                    {
                        id: "3",
                        title: "Pelajaran 02",
                        duration: "03 : 00",
                        status: "belum-mulai",
                        description: "Lanjutan dari materi sebelumnya dengan contoh kasus.",
                        videoUrl: "https://www.youtube.com/watch?v=example3",
                        thumbnail: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800"
                    },
                ],
            },
            {
                id: "02",
                title: "Chapter 02 : Tentang BNSP",
                status: "sedang-berjalan",
                lessons: [
                    {
                        id: "1",
                        title: "Pelajaran 01 (BNSP)",
                        duration: "03 : 00",
                        status: "belum-mulai",
                        description: "Penjelasan mendalam tentang standar BNSP.",
                        videoUrl: "https://www.youtube.com/watch?v=example4",
                        thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800"
                    },
                    {
                        id: "2",
                        title: "Pelajaran 02 (BNSP)",
                        duration: "03 : 00",
                        status: "belum-mulai",
                        description: "Studi kasus penerapan standar di industri.",
                        videoUrl: "https://www.youtube.com/watch?v=example5",
                        thumbnail: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800"
                    },
                    {
                        id: "3",
                        title: "Pelajaran 03 (BNSP)",
                        duration: "03 : 00",
                        status: "belum-mulai",
                        description: "Evaluasi dan penilaian kompetensi.",
                        videoUrl: "https://www.youtube.com/watch?v=example6",
                        thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800"
                    },
                    {
                        id: "4",
                        title: "Pelajaran 04 (BNSP)",
                        duration: "03 : 00",
                        status: "belum-mulai",
                        description: "Persiapan akhir untuk sertifikasi.",
                        videoUrl: "https://www.youtube.com/watch?v=example7",
                        thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800"
                    },
                ],
            },
        ],
    },
];

// -- AI Generator Data --
export const documentTypes = [
    {
        id: "1",
        title: "Peta Kompetensi.",
        description: "Visualisasi Level dan Bidang Keahlian.",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop",
        hasDraft: true,
        duration: "5-10 menit",
    },
    {
        id: "2",
        title: "Program Pelatihan.",
        description: "Jadwal dan Daftar Program Pelatihan Terbaik.",
        image: "https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=800&auto=format&fit=crop",
        hasDraft: false,
        duration: "5-10 menit",
    },
    {
        id: "3",
        title: "Lesson Plan (RPP)",
        description: "Akses RPP, Susun Pembelajaran Efektif.",
        image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&auto=format&fit=crop",
        hasDraft: false,
        duration: "5-10 menit",
    },
    {
        id: "4",
        title: "Soal Pre-test",
        description: "Uji Pemahaman Awal Anda Sekarang Juga.",
        image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop",
        hasDraft: false,
        duration: "5-10 menit",
    },
    {
        id: "5",
        title: "Soal Post-test",
        description: "Evaluasi Akhir Pelatihan. Mulai Uji Kompetensi.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop",
        hasDraft: false,
        duration: "5-10 menit",
    },
    {
        id: "6",
        title: "Form Feedback Pelatihan",
        description: "Bagikan Pendapat Anda Tentang Pelatihan.",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop",
        hasDraft: false,
        duration: "5-10 menit",
    },
];

// -- Sertifikat Data --
export const certificateData = {
    bnsp: {
        status: "Belum diajukan",
        isReady: false,
        detail: {
            name: "Budi Santoso",
            lsp: "LSP XYZ",
            number: "Belum tersedia",
            date: "Belum terbit",
        },
    },
    trainerHub: {
        status: "Belum tersedia",
        isReady: false,
        detail: {
            program: "FastTrack Certified Trainer – Completion",
            date: "Belum terbit",
            name: "Budi Santoso",
        },
    },
};

// -- Admin Dashboard Data --
export const adminDashboardStats = [
    {
        id: 1,
        title: "Pembayaran\nBelum Diverifikasi",
        subtitle: "Menunggu verifikasi",
        value: "5 Peserta",
        icon: "solar:bag-check-bold",
        colors: {
            bg: "bg-[#F2EEFD]",
            iconBg: "bg-[#6E3FF3]",
            text: "text-[#6E3FF3]",
        }
    },
    {
        id: 2,
        title: "Data BNSP\nBelum Lengkap",
        subtitle: "Belum isi semua data",
        value: "8 Peserta",
        icon: "solar:inbox-archive-bold",
        colors: {
            bg: "bg-[#FEF5E5]",
            iconBg: "bg-[#B58E36]",
            text: "text-[#8B6E2C]",
        }
    },
    {
        id: 3,
        title: "Dokumen\nPortofolio",
        subtitle: "Menunggu dicek",
        value: "12 Dokumen",
        icon: "solar:file-text-bold",
        colors: {
            bg: "bg-[#E6F2FF]",
            iconBg: "bg-[#4287F5]",
            text: "text-[#2C62B8]",
        }
    },
    {
        id: 4,
        title: "Sertifikat\nBelum Diupload",
        subtitle: "Belum punya sertifikat",
        value: "10 Peserta",
        icon: "solar:shield-check-bold",
        colors: {
            bg: "bg-[#FFEBEE]",
            iconBg: "bg-[#EB405A]",
            text: "text-[#C12E45]",
        }
    }
];

export const adminTodos = [
    {
        id: 1,
        priority: "Low",
        priorityColor: "text-[#4BD08B] bg-[#E8F8F0]",
        title: "Verifikasi pembayaran 5 peserta",
        category: "Pembayaran",
        icon: "solar:cart-large-minimalistic-bold",
        iconBg: "text-[#4BD08B] bg-[#E8F8F0]",
        action: "Verifikasi Sekarang",
        actionColor: "bg-[#4BD08B] hover:bg-[#3ab676]",
        time: "10:30 AM",
    },
    {
        id: 2,
        priority: "Medium",
        priorityColor: "text-[#F3A53F] bg-[#FEF5E5]",
        title: "Cek data BNSP 8 peserta",
        category: "Data BNSP",
        icon: "solar:checklist-minimalistic-bold",
        iconBg: "text-[#4287F5] bg-[#E6F2FF]",
        action: "Lihat peserta",
        actionColor: "bg-[#4287F5] hover:bg-[#3470d1]",
        time: "11:45 AM",
    },
    {
        id: 3,
        priority: "Very High",
        priorityColor: "text-[#B58E36] bg-[#FEF5E5]",
        title: "Review dokumen portofolio 12 peserta",
        category: "Dokumen",
        icon: "solar:sort-from-bottom-to-top-bold",
        iconBg: "text-[#F3A53F] bg-[#FEF5E5]",
        action: "Lihat peserta",
        actionColor: "bg-[#F3A53F] hover:bg-[#d98d2b]",
        time: "02:15 PM",
    },
    {
        id: 4,
        priority: "High",
        priorityColor: "text-[#C12E45] bg-[#FFEBEE]",
        title: "Generate paket export untuk BNSP",
        category: "Export",
        icon: "solar:widget-bold",
        iconBg: "text-[#C12E45] bg-[#FFEBEE]",
        action: "Generate",
        actionColor: "bg-[#967C50] hover:bg-[#7e6741]",
        time: "04:00 PM",
    },
];

export interface Participant {
    id: string;
    name: string;
    email: string;
    avatar: string;
    contact: string;
    batch: string;
    date: string;
    paymentStatus: 'Lunas' | 'Belum Lunas' | 'Pending';
    dataBnspStatus: 'Lengkap' | 'Belum Lengkap';
    portfolioStatus: 'Approved' | 'Revisi' | 'Pending';
    certificateStatus: 'Terbit' | 'Belum';
}

export const adminParticipants: Participant[] = [
    {
        id: '1',
        name: 'Maryam',
        email: 'maryam@example.com',
        avatar: '/images/profile/user-1.jpg',
        contact: '089-234-123-235',
        batch: 'Batch 1',
        date: '20 Dec 2025',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Terbit',
    },
    {
        id: '2',
        name: 'Dadang',
        email: 'dadang@example.com',
        avatar: '/images/profile/user-2.jpg',
        contact: '089-234-123-255',
        batch: 'Batch 1',
        date: '21 Dec 2025',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Terbit',
    },
    {
        id: '3',
        name: 'Anwar',
        email: 'anwar@example.com',
        avatar: '/images/profile/user-3.jpg',
        contact: '089-234-123-266',
        batch: 'Batch 2',
        date: '22 Dec 2025',
        paymentStatus: 'Pending',
        dataBnspStatus: 'Belum Lengkap',
        portfolioStatus: 'Revisi',
        certificateStatus: 'Belum',
    },
    {
        id: '4',
        name: 'Siti',
        email: 'siti@example.com',
        avatar: '/images/profile/user-4.jpg',
        contact: '089-234-123-277',
        batch: 'Batch 2',
        date: '23 Dec 2025',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Pending',
        certificateStatus: 'Belum',
    },
    {
        id: '5',
        name: 'Budi',
        email: 'budi@example.com',
        avatar: '/images/profile/user-5.jpg',
        contact: '089-234-123-288',
        batch: 'Batch 3',
        date: '24 Dec 2025',
        paymentStatus: 'Belum Lunas',
        dataBnspStatus: 'Belum Lengkap',
        portfolioStatus: 'Pending',
        certificateStatus: 'Belum',
    },
    {
        id: '6',
        name: 'Rina',
        email: 'rina@example.com',
        avatar: '/images/profile/user-6.jpg',
        contact: '089-234-123-299',
        batch: 'Batch 1',
        date: '25 Dec 2025',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Terbit',
    },
    {
        id: '7',
        name: 'Tono',
        email: 'tono@example.com',
        avatar: '/images/profile/user-7.jpg',
        contact: '089-234-123-300',
        batch: 'Batch 1',
        date: '26 Dec 2025',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Terbit',
    },
    {
        id: '8',
        name: 'Wati',
        email: 'wati@example.com',
        avatar: '/images/profile/user-8.jpg',
        contact: '089-234-123-311',
        batch: 'Batch 2',
        date: '27 Dec 2025',
        paymentStatus: 'Pending',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Revisi',
        certificateStatus: 'Belum',
    },
    {
        id: '9',
        name: 'Eko',
        email: 'eko@example.com',
        avatar: '/images/profile/user-9.jpg',
        contact: '089-234-123-322',
        batch: 'Batch 2',
        date: '28 Dec 2025',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Belum',
    },
    {
        id: '10',
        name: 'Maya',
        email: 'maya@example.com',
        avatar: '/images/profile/user-10.jpg',
        contact: '089-234-123-333',
        batch: 'Batch 3',
        date: '29 Dec 2025',
        paymentStatus: 'Belum Lunas',
        dataBnspStatus: 'Belum Lengkap',
        portfolioStatus: 'Pending',
        certificateStatus: 'Belum',
    },
    {
        id: '11',
        name: 'Andi',
        email: 'andi@example.com',
        avatar: '/images/profile/user-11.jpg',
        contact: '089-234-123-344',
        batch: 'Batch 1',
        date: '30 Dec 2025',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Terbit',
    },
    {
        id: '12',
        name: 'Lestari',
        email: 'lestari@example.com',
        avatar: '/images/profile/user-12.jpg',
        contact: '089-234-123-355',
        batch: 'Batch 1',
        date: '31 Dec 2025',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Terbit',
    },
    {
        id: '13',
        name: 'Hadi',
        email: 'hadi@example.com',
        avatar: '/images/profile/user-13.jpg',
        contact: '089-234-123-366',
        batch: 'Batch 2',
        date: '01 Jan 2026',
        paymentStatus: 'Pending',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Belum',
    },
    {
        id: '14',
        name: 'Yanti',
        email: 'yanti@example.com',
        avatar: '/images/profile/user-14.jpg',
        contact: '089-234-123-377',
        batch: 'Batch 2',
        date: '02 Jan 2026',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Belum',
    },
    {
        id: '15',
        name: 'Zulfikar',
        email: 'zulfikar@example.com',
        avatar: '/images/profile/user-15.jpg',
        contact: '089-234-123-388',
        batch: 'Batch 3',
        date: '03 Jan 2026',
        paymentStatus: 'Lunas',
        dataBnspStatus: 'Lengkap',
        portfolioStatus: 'Approved',
        certificateStatus: 'Belum',
    },
];

export const trainerAlerts = [
    {
        type: "warning",
        icon: "solar:info-circle-outline",
        message: "Dokumen Lesson Plan kamu perlu revisi dari admin.",
        action: true
    },
    {
        type: "info",
        icon: "solar:info-circle-outline",
        message: "Pembayaran sudah diterima/lunas.",
        action: true
    }
];
