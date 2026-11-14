import Image from 'next/image';

interface LogoProps {
  width?: number;
  height?: number;
  heading?: boolean;
}

export default function Logo({ width = 160, height = 160, heading = true }: LogoProps) {
  const Name = heading ? 'h1' : 'span';
  return (
    <div className="flex flex-col items-center">
      <div className="w-40 h-40 relative mb-2 flex items-center justify-center">
        <Image
          src="/assets/LogoMed-removebg-preview.png"
          alt="MedReminder Logo"
          width={width}
          height={height}
          priority
        />
      </div>
      <Name className="text-2xl font-semibold text-[#BE185D] KantumruySemiBold">
        MedReminder
      </Name>
    </div>
  );
}
