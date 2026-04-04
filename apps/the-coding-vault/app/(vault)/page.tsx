import HomeLogo from '@/public/images/homelogo.png';
import Image from 'next/image';
export default function Home() {
  return (
    <header className="flex flex-col items-center justify-center">
      <h1>This is currently a Work in progress. Stay tuned</h1>
      <Image
        src={HomeLogo}
        alt='The Coding Vault Logo With Macot "Vaulty"'
        width={600}
        height={600}
        priority
      />
    </header>
  );
}
