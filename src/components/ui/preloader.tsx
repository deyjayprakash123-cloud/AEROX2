"use client";

import { useEffect, useState } from "react";

const Preloader = ({ loading }: { loading: boolean }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShow(false), 500); // fade out duration
      return () => clearTimeout(timer);
    }
  }, [loading]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 bg-background z-[100] flex justify-center items-center transition-opacity duration-500 ${
        loading ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="relative w-40 h-40">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{
              animation: `orbit 3s ease-in-out infinite ${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(20px) scale(0.5);
            opacity: 0.5;
          }
          50% {
            transform: rotate(180deg) translateX(70px) scale(1.2);
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translateX(20px) scale(0.5);
            opacity: 0.5;
          }
        }
        
        div > div {
          top: 50%;
          left: 50%;
          margin-top: -4px;
          margin-left: -4px;
          filter: drop-shadow(0 0 2px hsl(var(--primary))) drop-shadow(0 0 5px hsl(var(--primary)));
        }
      `}</style>
    </div>
  );
};

export default Preloader;
