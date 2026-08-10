import { useState } from 'react';
import { resolveProfileImageUrl } from '../../features/auth/profile-image';

interface ProfileAvatarProps {
  imageUrl: string | null | undefined;
  name: string | null | undefined;
  className: string;
}

function ProfileAvatar({ imageUrl, name, className }: ProfileAvatarProps) {
  const resolvedImageUrl = resolveProfileImageUrl(imageUrl);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const initial = name?.trim().slice(0, 1) || '나';
  const canShowImage = resolvedImageUrl !== null && failedImageUrl !== resolvedImageUrl;

  return (
    <span className={className} aria-hidden="true">
      {canShowImage ? (
        <img
          src={resolvedImageUrl}
          alt=""
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedImageUrl(resolvedImageUrl)}
        />
      ) : (
        initial
      )}
    </span>
  );
}

export default ProfileAvatar;
