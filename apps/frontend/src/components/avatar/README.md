# UserAvatar Component

DiceBear-based avatar component that generates consistent, unique avatars from user IDs.

## Usage

```tsx
import { UserAvatar } from 'src/components/avatar';

<UserAvatar 
  userId="user_123" 
  size={48} 
  className="rounded-full"
  alt="John Doe"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| userId | string | required | Unique user identifier (stable auth user ID recommended) |
| size | number | 40 | Avatar size in pixels |
| className | string | '' | Additional Tailwind CSS classes |
| alt | string | 'User avatar' | Alt text for accessibility |

## Features

- **Consistent**: Same userId always generates same avatar
- **Unique**: Different userIds generate different avatars
- **Brown Palette**: Uses cohesive brown color scheme
- **Memoized**: Optimized to prevent re-computation
- **No Network**: Renders inline, no external requests

## Color Palette

The component uses 8 brown shape colors and 4 neutral background colors, providing 32 possible combinations.

## Examples

### Small Avatar (Profile Menu)
```tsx
<UserAvatar userId={user.id} size={35} className="rounded-full" />
```

### Medium Avatar (Training Detail)
```tsx
<UserAvatar userId={trainer.id} size={48} className="rounded-full border-2 border-white" />
```

### Large Avatar (User Profile)
```tsx
<UserAvatar userId={user.id} size={96} className="rounded-full shadow-lg" />
```

## Auth Avatar Notes

Replace:
```tsx
<img src={user.imageUrl} alt={user.name} className="rounded-full" />
```

With:
```tsx
<UserAvatar userId={user.id} alt={user.name} className="rounded-full" />
```
