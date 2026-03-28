"use client";

import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

interface HeroProps {
  onStartChat: () => void;
}

const Hero = ({ onStartChat }: HeroProps) => {
  return (
    <section className="h-screen w-full flex flex-col justify-center items-center text-center">
      <div className="relative max-w-4xl px-4">
        <h1 className="font-headline text-6xl md:text-8xl lg:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 animate-fade-in-down glow-lg">
          AEROX AI
        </h1>
        <p className="mt-4 text-lg md:text-xl text-accent animate-fade-in-up">
          Multiple Personalities. Deeper Reasoning.
        </p>
        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <Button onClick={onStartChat} size="lg" className="font-headline text-lg glow-md rounded-full">
            <Bot className="mr-2 h-5 w-5" />
            Start Chat
          </Button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 1s ease-out forwards;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          animation-delay: 0.2s;
          opacity: 0;
        }
      `}</style>
    </section>
  );
};

export default Hero;
