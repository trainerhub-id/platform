import { useMemo } from 'react';
import { generateAvatarDataUri } from 'src/lib/avatar-generator';
import type { UserAvatarProps } from 'src/types/avatar';

/**
 * UserAvatar - Generates consistent DiceBear avatars from user IDs
 * 
 * @example
 * <UserAvatar userId="user_123" size={48} className="rounded-full" />
 */
export const UserAvatar = ({ 
  userId, 
  size = 40, 
  className = '', 
  alt = 'User avatar' 
}: UserAvatarProps) => {
  // Memoize avatar generation to prevent re-computation on re-renders
  const avatarDataUri = useMemo(() => {
    return generateAvatarDataUri(userId);
  }, [userId]);

  return (
    <img
      src={avatarDataUri}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
};
