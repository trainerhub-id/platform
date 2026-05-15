import { Icon } from '@iconify/react';
import { Link } from 'react-router';
import { Button } from 'src/components/ui/button';

const AiRebuild = () => {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-180px)] max-w-3xl flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon icon="solar:magic-stick-3-bold-duotone" height={34} />
      </div>
      <h1 className="mb-3 text-2xl font-semibold text-ld">AI sedang dibangun ulang</h1>
      <p className="mb-7 max-w-xl text-sm leading-6 text-bodytext">
        Modul AI lama sudah dinonaktifkan. AI for Trainer dan AI for Master akan kembali sebagai alur baru berbasis AI SDK.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/user/home">Kembali ke Home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/user/kelas">Buka Kelas</Link>
        </Button>
      </div>
    </div>
  );
};

export default AiRebuild;
