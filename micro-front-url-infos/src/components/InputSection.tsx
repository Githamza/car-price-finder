import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ButtonSection from "./ButtonSection";
import LoadingAnimation from "./LoadingAnimation";

const isValidUberEatsUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes("ubereats.com");
  } catch {
    return false;
  }
};

const InputSection: React.FC = () => {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!isValidUberEatsUrl(url)) {
      setError("Veuillez entrer un lien UberEats valide.");
      return;
    }
    setError("");
    setLoading(true);

    // Record start time
    const startTime = Date.now();
    const minimumLoadingTime = 5000; // 5 seconds minimum to see both messages

    try {
      await fetch("https://zm1z7x75-7071.uks1.devtunnels.ms/api/scrapdata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });
      // Handle success as needed (e.g., show toast, navigate, etc.)
    } catch (e) {
      console.error(e);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      // Calculate how much time has passed
      const elapsedTime = Date.now() - startTime;

      // If less than minimum time has passed, wait the remaining time
      if (elapsedTime < minimumLoadingTime) {
        setTimeout(() => {
          setLoading(false);
        }, minimumLoadingTime - elapsedTime);
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 px-4 w-full max-w-lg mx-auto">
      <div className="w-full flex flex-col gap-2">
        <Label htmlFor="storeUrl" className="text-lg text-gray-700">
          Collez le lien de votre boutique sur UberEats
        </Label>
        <Input
          id="storeUrl"
          type="url"
          placeholder="https://www.ubereats.com/store/votre-boutique"
          className="w-full"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
      <ButtonSection loading={loading} onClick={handleSubmit} />
      <LoadingAnimation isVisible={loading} />
    </div>
  );
};

export default InputSection;
