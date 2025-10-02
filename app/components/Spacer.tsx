'use client';

interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
}

export default function Spacer({ size = 'md', className = '' }: SpacerProps) {
  const sizeToClass: Record<NonNullable<SpacerProps['size']>, string> = {
    xs: 'h-2',
    sm: 'h-4',
    md: 'h-6',
    lg: 'h-8',
    xl: 'h-12',
    '2xl': 'h-16',
    '3xl': 'h-24'
  };

  return (
    <div aria-hidden className={`${sizeToClass[size]} ${className}`.trim()} />
  );
}


