import Image from 'next/image';

export default function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-40 h-40 relative mb-2 flex items-center justify-center">
        <Image
          src="/assets/LogoMed-removebg-preview.png"
          alt="MedReminder Logo"
          width={160}
          height={160}
          priority
        />
      </div>
      <h1 className="text-2xl font-semibold text-[#BE185D] KantumruySemiBold">
        MedReminder
      </h1>
    </div>
  );
}
