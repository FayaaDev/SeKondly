import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessageCircle, Heart, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Notifications() {
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: ["/api/notifications"],
    queryFn: api.getNotifications,
  });

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} days ago`;
    if (diffHours > 0) return `${diffHours} hours ago`;
    return "Just now";
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return <MessageCircle className="h-4 w-4 text-white" />;
      case "like":
        return <Heart className="h-4 w-4 text-white" />;
      default:
        return <Bell className="h-4 w-4 text-white" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "comment":
        return "bg-medical-blue";
      case "like":
        return "bg-medical-green";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load notifications</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Mock notifications since we don't have real ones yet
  const mockNotifications = [
    {
      id: 1,
      type: "comment",
      message: "Dr. Wilson commented on your case",
      detail: "I've seen similar symptoms in pediatric patients...",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: 0
    },
    {
      id: 2,
      type: "like",
      message: "Dr. Martinez liked your case",
      detail: "Complex Arrhythmia in 45-Year-Old Patient",
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      isRead: 0
    },
    {
      id: 3,
      type: "comment",
      message: "Dr. Foster replied to your comment",
      detail: "Thank you for the insight on the EKG findings...",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isRead: 1
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : mockNotifications;

  return (
    <div className="p-4 pb-20">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
      
      {displayNotifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-600">You'll receive notifications when colleagues interact with your cases.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayNotifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`bg-white rounded-lg border p-4 ${
                notification.isRead === 0 ? 'border-l-4 border-l-medical-blue' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 ${getNotificationColor(notification.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{notification.message}</p>
                  {notification.detail && (
                    <p className="clinical-gray text-sm mt-1">"{notification.detail}"</p>
                  )}
                  <p className="clinical-gray text-xs mt-2">{formatTimeAgo(notification.createdAt)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
