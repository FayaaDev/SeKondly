import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-20 right-4 w-14 h-14 bg-ios-blue hover:bg-ios-blue-dark text-white rounded-full shadow-lg flex items-center justify-center ios-button z-30"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
