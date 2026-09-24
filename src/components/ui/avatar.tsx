import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({
  src,
  alt = "Avatar",
  fallback = "ASN",
  size = "md",
  className,
  ...props
}: AvatarProps) {
  const sizeClasses = {
    sm: "avatar-sm",
    md: "avatar-md",
    lg: "avatar-lg",
  };

  return (
    <div
      className={cn(
        "avatar-base shadow-sm ring-2 ring-primary/20",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="avatar-img"
        />
      ) : (
        <span className="avatar-fallback">{fallback}</span>
      )}
    </div>
  );
}
