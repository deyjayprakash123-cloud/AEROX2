"use client";

import { useState, useEffect, useRef } from "react";
import Preloader from "@/components/ui/preloader";
import OvalNetwork from "@/components/3d/oval-network";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import Footer from "@/components/layout/footer";
import { ChatSheet } from "@/components/chat/chat-sheet";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const ovalNetworkRef = useRef<{ setProcessing: (isProcessing: boolean) => void }>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);
  
  const handleProcessingStateChange = (isProcessing: boolean) => {
    ovalNetworkRef.current?.setProcessing(isProcessing);
  };

  return (
    <>
      <Preloader loading={loading} />
      <div className={`transition-opacity duration-1000 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        <main className="relative min-h-screen w-full overflow-x-hidden">
          <OvalNetwork ref={ovalNetworkRef} />
          <div className="relative z-10">
            <Hero onStartChat={() => setIsChatOpen(true)} />
            <Features />
            <Footer />
          </div>
          <ChatSheet 
            isOpen={isChatOpen} 
            onOpenChange={setIsChatOpen} 
            onProcessingStateChange={handleProcessingStateChange} 
          />
        </main>
      </div>
    </>
  );
}
