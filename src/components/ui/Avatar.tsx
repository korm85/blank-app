import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/users'
import Image from 'next/image'

interface AvatarProps {
  name: string
  color: string
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZES = {
  xs: { px: 24, text: 'text-[10px]' },
  sm: { px: 32, text: 'text-xs' },
  md: { px: 40, text: 'text-sm' },
  lg: { px: 56, text: 'text-base' },
  xl: { px: 72, text: 'text-lg' },
}

export function Avatar({ name, color, avatarUrl, size = 'md', className }: AvatarProps) {
  const { px, text } = SIZES[size]

  if (avatarUrl) {
    return (
      <div
        className={cn('rounded-full overflow-hidden flex-shrink-0', className)}
        style={{ width: px, height: px }}
      >
        <Image
          src={avatarUrl}
          alt={name}
          width={px}
          height={px}
          className="object-cover w-full h-full"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 font-bold',
        text,
        className
      )}
      style={{
        width: px,
        height: px,
        backgroundColor: `${color}22`,
        border: `2px solid ${color}44`,
        color,
      }}
    >
      {getInitials(name)}
    </div>
  )
}
