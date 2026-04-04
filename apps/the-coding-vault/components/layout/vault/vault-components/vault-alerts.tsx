import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@bubbles/ui/shadcn/card';
import {
  AlertCircleIcon,
  HugeiconsIcon,
  SkullIcon,
  SmileIcon,
  TriangleIcon,
} from '@bubbles/ui/lib/hugeicons';
import Vaulty from '@/public/images/icon.svg';

import Image from 'next/image';
const VaultAlerts = ({
  type = 'info',
  children,
}: {
  type?: 'info' | 'success' | 'warning' | 'danger';

  children: React.ReactNode;
}) => {
  const alertStyles = {
    info: 'bg-blue-100 shadow-md border-blue-300 border-2 text-blue-600',
    success: 'bg-green-100 shadow-md border-green-300 border-2 text-green-600',
    warning:
      'bg-orange-100 shadow-md border-orange-300 border-2 text-orange-600',
    danger: 'bg-red-100 shadow-md border-red-300 border-2 text-red-600',
  };
  const alertTitles = {
    info: (
      <>
        <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-6" />
        <span>Wusstest Du schon?</span>
      </>
    ),
    success: (
      <>
        <HugeiconsIcon icon={SmileIcon} strokeWidth={2} className="size-6" />
        <span>Ah, der Klassiker!</span>
      </>
    ),
    warning: (
      <>
        <HugeiconsIcon icon={TriangleIcon} strokeWidth={2} className="size-6" />
        <span>Vorsicht ist besser als Nachsicht!</span>
      </>
    ),
    danger: (
      <>
        <HugeiconsIcon icon={SkullIcon} strokeWidth={2} className="size-6" />
        <span>Welcome, to the DANGER ZONE!</span>
      </>
    ),
  };
  return (
    <Card className={`${alertStyles[type]} my-4 text-pretty`}>
      <CardHeader>
        <CardTitle className="flex place-items-center gap-1 text-xl font-bold">
          <h3 className="flex place-items-center gap-1">{alertTitles[type]}</h3>
        </CardTitle>
      </CardHeader>
      <CardContent className="ml-[0.15rem] text-lg font-semibold">
        {children}
      </CardContent>
      <CardFooter className="justify-end pr-4">
        <span className="flex place-items-center gap-1 text-sm font-semibold italic">
          – Vaulty{' '}
          <Image
            src={Vaulty}
            alt="Vaulty"
            width={40}
            height={40}
            className="transition-transform duration-300 ease-in-out hover:scale-110"
          />
        </span>
      </CardFooter>
    </Card>
  );
};

export default VaultAlerts;
