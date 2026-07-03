import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";

interface LoadingAnimationProps {
  isVisible: boolean;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ isVisible }) => {
  const [message, setMessage] = useState("Récupération de vos informations");

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (isVisible) {
      // Reset message when loading starts
      setMessage("Récupération de vos informations");

      // Change message after 3 seconds
      timer = setTimeout(() => {
        setMessage("Formattage de vos données");
      }, 3000);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{
        opacity: isVisible ? 1 : 0,
        height: isVisible ? "auto" : 0,
      }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="w-full flex flex-col items-center overflow-hidden"
    >
      {isVisible && (
        <>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-black font-medium text-lg mt-4 mb-4 text-center"
          >
            {message}
          </motion.p>
          <Spinner size="lg" className="text-purple-600 mb-6" />
        </>
      )}
    </motion.div>
  );
};

export default LoadingAnimation;
