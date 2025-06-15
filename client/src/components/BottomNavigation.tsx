import { Button } from "@/components/ui/button";
import { Home as HomeIcon, FileText, Bell, User, Heart } from "lucide-react";

type Tab = "feed" | "mycases" | "favorites" | "notifications" | "profile";

interface BottomNavigationProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function BottomNavigation({ currentTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "feed" as Tab, icon: HomeIcon, label: "Feed" },
    { id: "mycases" as Tab, icon: FileText, label: "My Cases" },
    { id: "favorites" as Tab, icon: Heart, label: "Favorites" },
    { id: "notifications" as Tab, icon: Bell, label: "Notifications" },
    { id: "profile" as Tab, icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-ios-gray-light safe-area-inset-bottom z-30">
      <div className="max-w-sm mx-auto flex">
        {tabs.map(({ id, icon: Icon, label }) => (
          <Button
            key={id}
            variant="ghost"
            className={`flex-1 py-3 flex flex-col items-center space-y-1 h-auto ios-button ${
              currentTab === id 
                ? "text-ios-blue" 
                : "text-ios-gray"
            }`}
            onClick={() => onTabChange(id)}
          >
            <Icon className={`h-5 w-5 ${currentTab === id ? "text-ios-blue" : "text-ios-gray"}`} />
            <div className={`text-xs ${currentTab === id ? "text-ios-blue" : "text-ios-gray"}`}>
              {label}
            </div>
          </Button>
        ))}
      </div>
    </nav>
  );
}
