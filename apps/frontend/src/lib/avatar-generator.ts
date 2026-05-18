import { thumbs } from '@dicebear/collection'
import { createAvatar } from '@dicebear/core'
import type { AvatarConfig } from '../types/avatar'

// Brown color palette
export const BROWN_PALETTE: AvatarConfig = {
  shapeColors: [
    'D2B48C', // Tan (light brown)
    'DEB887', // Burlywood
    'CD853F', // Peru (medium brown)
    'A0522D', // Sienna
    '8B4513', // Saddle brown
    '6B4423', // Dark wood
    '654321', // Dark brown
    '4E342E', // Coffee brown
  ],
  backgroundColors: [
    'F5F5DC', // Beige (neutral light)
    'FAEBD7', // Antique white
    'FFE4C4', // Bisque
    'FFDEAD', // Navajo white
  ],
}

/**
 * Generate DiceBear avatar SVG string from user ID
 * @param userId - Unique user identifier to use as seed
 * @returns SVG string of generated avatar
 */
export function generateAvatarSvg(userId: string): string {
  if (!userId || userId.trim() === '') {
    // Return default placeholder for invalid userId
    return createAvatar(thumbs, {
      seed: 'default-user',
      shapeColor: ['D2B48C'],
      backgroundColor: ['F5F5DC'],
    }).toString()
  }

  const avatar = createAvatar(thumbs, {
    seed: userId,
    shapeColor: BROWN_PALETTE.shapeColors,
    backgroundColor: BROWN_PALETTE.backgroundColors,
    randomizeIds: true,
    scale: 100,
  })

  return avatar.toString()
}

/**
 * Convert SVG string to data URI for inline rendering
 * @param svgString - SVG string from DiceBear
 * @returns data URI string
 */
export function svgToDataUri(svgString: string): string {
  const base64 = btoa(unescape(encodeURIComponent(svgString)))
  return `data:image/svg+xml;base64,${base64}`
}

/**
 * Generate avatar data URI from user ID
 * @param userId - Unique user identifier
 * @returns Complete data URI ready for img src
 */
export function generateAvatarDataUri(userId: string): string {
  const svg = generateAvatarSvg(userId)
  return svgToDataUri(svg)
}
