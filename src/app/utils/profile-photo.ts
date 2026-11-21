const acceptedPhotoTypes = ['image/jpeg', 'image/png', 'image/webp'];
export const maxPhotoFileBytes = 5 * 1024 * 1024;
export const profilePhotoAccept = acceptedPhotoTypes.join(',');
const maxEncodedBytes = 64 * 1024;
const maxBase64Length = 4 * Math.ceil(maxEncodedBytes / 3);

export function acceptedProfilePhoto(file: File): boolean {
  return acceptedPhotoTypes.includes(file.type);
}

export async function profilePhotoToBase64(file: File): Promise<string> {
  if (file.size <= maxEncodedBytes) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Não foi possível ler a imagem.'));
      reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
      reader.readAsDataURL(file);
    });
  }

  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a imagem.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.86, 0.65, 0.45]) {
      const encoded = canvas.toDataURL('image/jpeg', quality);
      const data = encoded.slice('data:image/jpeg;base64,'.length);
      const padding = data.endsWith('==') ? 2 : Number(data.endsWith('='));
      if (
        encoded.startsWith('data:image/jpeg;base64,') &&
        data.length <= maxBase64Length &&
        (data.length / 4) * 3 - padding <= maxEncodedBytes
      ) return encoded;
    }
    throw new Error('Não foi possível reduzir a imagem.');
  } finally {
    bitmap.close();
  }
}
