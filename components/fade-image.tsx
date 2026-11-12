"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "cn";

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

type FadeImageProps = ImageProps & {
  onReveal?: () => void;
};

export function FadeImage({
  alt,
  className,
  onLoad,
  onReveal,
  priority,
  preload,
  src,
  ...props
}: FadeImageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const eager = priority === true || preload === true;
  const [loaded, setLoaded] = useState(eager);
  const onRevealRef = useRef(onReveal);

  useEffect(() => {
    onRevealRef.current = onReveal;
  });

  useIsomorphicLayoutEffect(() => {
    if (eager) {
      return;
    }
    const image = imageRef.current;
    setLoaded(image !== null && image.complete && image.naturalWidth > 0);
  }, [src, eager]);

  useEffect(() => {
    if (loaded) {
      onRevealRef.current?.();
    }
  }, [loaded]);

  return (
    <Image
      {...props}
      alt={alt}
      src={src}
      priority={priority}
      preload={preload}
      ref={imageRef}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      className={cn(
        "img-reveal",
        loaded
          ? "scale-100 opacity-100 blur-0"
          : "scale-[1.02] opacity-0 blur-[14px]",
        className,
      )}
    />
  );
}
