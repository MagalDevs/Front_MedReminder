'use client';

import Image from 'next/image';
import { User } from 'lucide-react';
import { useState } from 'react';

type Props = {
  photo: string | null;
  size: number;
  className: string;
};

export default function ProfileAvatar({ photo, size, className }: Props) {
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);

  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {photo && photo !== failedPhoto ? (
        <Image
          src={photo}
          alt=""
          width={size}
          height={size}
          className="size-full object-cover"
          unoptimized
          onError={() => setFailedPhoto(photo)}
        />
      ) : <User size={16} />}
    </span>
  );
}
