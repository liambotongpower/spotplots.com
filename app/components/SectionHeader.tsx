'use client';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export default function SectionHeader({ title, subtitle, className = '' }: SectionHeaderProps) {
  return (
    <div className={`w-full ${className}`.trim()}>
      <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      {subtitle && (
        <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
      )}
    </div>
  );
}


