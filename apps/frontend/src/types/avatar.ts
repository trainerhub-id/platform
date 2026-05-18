export interface UserAvatarProps {
  userId: string // auth user ID as seed
  size?: number // Size in pixels (default: 40)
  className?: string // Additional Tailwind classes
  alt?: string // Alt text for accessibility
}

export interface AvatarConfig {
  shapeColors: string[]
  backgroundColors: string[]
}
