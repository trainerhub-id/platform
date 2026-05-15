import { Icon } from "@iconify/react";
import { useNavigate } from "react-router";
import CardBox from "src/components/shared/CardBox";
import { useAiAccess } from "src/hooks/useAiAccess";
import { Alert, AlertDescription } from "src/components/ui/alert";
import { Skeleton } from "src/components/ui/skeleton";
import AiMentorLogo from "src/assets/images/logos/logo-ai-mentor.png";

interface AiCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}

const categories: AiCategory[] = [
  {
    id: "trainer",
    title: "AI for Trainer",
    description: "Bantu buat lesson plan, design assessment, dan generate materi training dengan AI",
    icon: "solar:presentation-graph-bold-duotone",
    color: "#4F75FF",
    route: "/user/ai-hub/trainer"
  },
  {
    id: "master",
    title: "AI for Master",
    description: "Analisis performa peserta, feedback otomatis, dan coaching tips untuk trainer master",
    icon: "solar:diploma-verified-bold-duotone",
    color: "#AA8D55",
    route: "/user/ai-hub/master"
  },
  {
    id: "branding",
    title: "AI for Branding",
    description: "Personal branding ToT dan promosi training dengan gaya hangat & membimbing. Support LinkedIn, Instagram, Email, Website.",
    icon: "solar:star-bold-duotone",
    color: "#10B981",
    route: "/user/ai-hub/branding"
  }
];

const AiHub = () => {
  const navigate = useNavigate();
  const { hasAccess, getUpgradeMessage, isLoading, hasTier, tierName, access, aiFeatures } = useAiAccess();

  console.log('🏠 [AiHub] Render state:', {
    isLoading,
    hasTier,
    tierName,
    aiFeatures,
    access,
  });

  const handleCardClick = (category: AiCategory) => {
    console.log(`🖱️ [AiHub] Card clicked: ${category.id}`);
    const canAccess = hasAccess(category.id);
    console.log(`🔐 [AiHub] Access check for ${category.id}:`, canAccess);
    
    // Allow all users to navigate - access control happens at trailer level
    // FREE users will see trailer with "Upgrade" button
    // PAID users will see trailer with "Lanjutkan" button
    console.log(`✅ [AiHub] Navigating to ${category.route}`);
    navigate(category.route);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 md:col-span-6 col-span-12 h-64 rounded-2xl" />
          <Skeleton className="lg:col-span-4 md:col-span-6 col-span-12 h-64 rounded-2xl" />
          <Skeleton className="lg:col-span-4 md:col-span-6 col-span-12 h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-8 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <img src={AiMentorLogo} alt="AI Mentor" className="h-10 w-auto mb-2" />
            <p className="text-bodytext text-base mb-2">
              Pilih AI Assistant yang sesuai dengan kebutuhan Anda. Setiap AI memiliki keahlian khusus untuk membantu pekerjaan Anda.
            </p>
            {hasTier && tierName && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full text-sm text-primary font-medium">
                <Icon icon="solar:shield-check-bold-duotone" height={18} />
                Paket: {tierName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Alert for Free Users */}
      {!hasTier && (
        <Alert className="border-warning bg-warning/5">
          <Icon icon="solar:info-circle-bold-duotone" className="text-warning" height={20} />
          <AlertDescription className="text-sm text-bodytext ml-2">
            Anda belum memiliki paket berbayar. Untuk mengakses AI Features, silakan hubungi admin untuk upgrade paket Anda.
          </AlertDescription>
        </Alert>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-12 gap-6">
        {categories.map((category) => {
          const isAccessible = hasAccess(category.id);
          
          console.log(`🎨 [AiHub] Rendering ${category.id}:`, {
            isAccessible,
            aiFeatures,
          });

          return (
            <div key={category.id} className="lg:col-span-4 md:col-span-6 col-span-12">
              <CardBox 
                className="p-6 transition-all duration-300 group !border rounded-2xl cursor-pointer hover:shadow-xl !border-ld hover:!border-primary/50"
                onClick={() => handleCardClick(category)}
              >
                <div className="space-y-4">
                  {/* Icon */}
                  <div className="relative">
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${category.color}15` }}
                    >
                      <Icon 
                        icon={category.icon} 
                        height={32} 
                        style={{ color: category.color }}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-dark group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-bodytext leading-relaxed">
                    {category.description}
                  </p>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all">
                    <span>
                      {isAccessible 
                        ? 'Lanjutkan' 
                        : hasTier 
                          ? 'Upgrade Paket' 
                          : 'Beli Paket'}
                    </span>
                    <Icon icon="solar:arrow-right-outline" height={18} />
                  </div>
                </div>
              </CardBox>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiHub;
