import React from "react";
import { Button } from "@/components/ui/button";

interface ButtonSectionProps {
  loading: boolean;
  onClick: () => void;
}

const ButtonSection: React.FC<ButtonSectionProps> = ({ loading, onClick }) => {
  return (
    <div className="flex justify-center py-8">
      <Button
        onClick={onClick}
        disabled={loading}
        size="lg"
        className="font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-transform hover:-translate-y-1 hover:scale-105"
      >
        {loading ? "Chargement..." : "Chercher les informations de ma boutique"}
      </Button>
    </div>
  );
};

export default ButtonSection;
