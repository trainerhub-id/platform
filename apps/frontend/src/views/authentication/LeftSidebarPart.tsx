import TrainerPhoto from "/src/assets/images/logos/trisnalesmana.webp"

const LeftSidebarPart = () => {
  return (
    <div className="relative h-full w-full overflow-hidden flex">
      {/* Left side - Text content */}
      <div className="flex-1 flex items-center justify-center px-8 xl:px-12">
        <div className="max-w-sm">
          <h2 className="text-[#CFA15A] text-4xl xl:text-5xl font-bold leading-tight mb-4">
            Welcome to
            <br />
            TrainerHub
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            TrainerHub menyederhanakan proses training, upload berkas, dan penyusunan dokumen BNSP lewat dashboard terintegrasi.
          </p>
        </div>
      </div>
      
      {/* Right side - Photo */}
      <div className="relative flex-1 flex items-end justify-center">
        <img 
          src={TrainerPhoto} 
          alt="Trainer" 
          className="relative z-10 h-[85%] w-auto object-contain object-bottom"
        />
      </div>
    </div>
  );
};

export default LeftSidebarPart;
