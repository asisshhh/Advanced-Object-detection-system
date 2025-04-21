
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ActionButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  color: 'purple' | 'green' | 'orange' | 'blue' | 'red' | 'gray';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

const ActionButton = ({
  onClick,
  disabled = false,
  color,
  icon,
  children,
  className,
}: ActionButtonProps) => {
  const colorMap = {
    purple: 'bg-app-purple hover:bg-opacity-80',
    green: 'bg-app-green hover:bg-opacity-80',
    orange: 'bg-app-orange hover:bg-opacity-80',
    blue: 'bg-app-blue hover:bg-opacity-80',
    red: 'bg-app-red hover:bg-opacity-80',
    gray: 'bg-app-gray hover:bg-opacity-80',
  };

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'text-white font-semibold px-6 py-5 rounded-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2',
        colorMap[color],
        className
      )}
    >
      {icon}
      {children}
    </Button>
  );
};

export default ActionButton;
