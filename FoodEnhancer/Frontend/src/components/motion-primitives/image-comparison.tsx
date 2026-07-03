"use client";
import { cn } from "../../lib/utils";
import { useState, createContext, useContext } from "react";
import {
  motion,
  MotionValue,
  SpringOptions,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

const ImageComparisonContext = createContext<
  | {
      sliderPosition: number;
      setSliderPosition: (pos: number) => void;
      motionSliderPosition: MotionValue<number>;
      isDragging: boolean;
    }
  | undefined
>(undefined);

export type ImageComparisonProps = {
  children: React.ReactNode;
  className?: string;
  enableHover?: boolean;
  springOptions?: SpringOptions;
};

const DEFAULT_SPRING_OPTIONS = {
  bounce: 0,
  duration: 0,
};

function ImageComparison({
  children,
  className,
  enableHover,
  springOptions,
}: ImageComparisonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const motionValue = useMotionValue(50);
  const motionSliderPosition = useSpring(
    motionValue,
    springOptions ?? DEFAULT_SPRING_OPTIONS
  );
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleDrag = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging && !enableHover) return;

    const containerRect = (
      event.currentTarget as HTMLElement
    ).getBoundingClientRect();
    const x =
      "touches" in event
        ? event.touches[0].clientX - containerRect.left
        : (event as React.MouseEvent).clientX - containerRect.left;

    const percentage = Math.min(
      Math.max((x / containerRect.width) * 100, 0),
      100
    );
    motionValue.set(percentage);
    setSliderPosition(percentage);
  };

  return (
    <ImageComparisonContext.Provider
      value={{
        sliderPosition,
        setSliderPosition,
        motionSliderPosition,
        isDragging,
      }}
    >
      <div
        className={cn(
          "relative select-none overflow-hidden",
          enableHover && "cursor-ew-resize",
          className
        )}
        onMouseMove={handleDrag}
        onMouseDown={() => !enableHover && setIsDragging(true)}
        onMouseUp={() => !enableHover && setIsDragging(false)}
        onMouseLeave={() => !enableHover && setIsDragging(false)}
        onTouchMove={handleDrag}
        onTouchStart={() => !enableHover && setIsDragging(true)}
        onTouchEnd={() => !enableHover && setIsDragging(false)}
      >
        {children}

        {/* Percentage Indicator */}
        <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
          {Math.round(sliderPosition)}%
        </div>

        {/* Before/After Labels */}
        <div className="absolute bottom-3 left-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
          Before
        </div>
        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
          After
        </div>
      </div>
    </ImageComparisonContext.Provider>
  );
}

const ImageComparisonImage = ({
  className,
  alt,
  src,
  position,
}: {
  className?: string;
  alt: string;
  src: string;
  position: "left" | "right";
}) => {
  const { motionSliderPosition } = useContext(ImageComparisonContext)!;
  const leftClipPath = useTransform(
    motionSliderPosition,
    (value) => `inset(0 0 0 ${value}%)`
  );
  const rightClipPath = useTransform(
    motionSliderPosition,
    (value) => `inset(0 ${100 - value}% 0 0)`
  );

  return (
    <motion.img
      src={src}
      alt={alt}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      style={{
        clipPath: position === "left" ? leftClipPath : rightClipPath,
      }}
    />
  );
};

const ImageComparisonSlider = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  const { motionSliderPosition, isDragging } = useContext(
    ImageComparisonContext
  )!;

  const left = useTransform(motionSliderPosition, (value) => `${value}%`);

  return (
    <motion.div
      className={cn(
        "absolute bottom-0 top-0 w-1 cursor-ew-resize group",
        className
      )}
      style={{
        left,
      }}
      whileHover={{ scale: 1.1 }}
      animate={isDragging ? { scale: 1.05 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Custom Slider Handle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full border-2 border-zinc-300 shadow-lg flex items-center justify-center transition-all duration-200 group-hover:shadow-xl group-hover:border-zinc-400 group-hover:scale-110">
        {/* Grip Lines */}
        <div className="flex flex-col gap-1">
          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full transition-colors duration-200 group-hover:bg-zinc-600" />
          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full transition-colors duration-200 group-hover:bg-zinc-600" />
          <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full transition-colors duration-200 group-hover:bg-zinc-600" />
        </div>
      </div>

      {/* Slider Line with Glow Effect */}
      <div className="absolute top-0 bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-white shadow-lg group-hover:shadow-white/50 group-hover:shadow-2xl transition-all duration-200" />

      {children}
    </motion.div>
  );
};

export { ImageComparison, ImageComparisonImage, ImageComparisonSlider };
