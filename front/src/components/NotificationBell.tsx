import React from 'react';
import { Bell, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  count: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ count }) => {
  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
          >
            {count > 99 ? '99+' : count}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export const NotificationBellWithDropdown: React.FC = () => {
  return (
    <div className="relative">
      <NotificationDropdown />
    </div>
  );
};
