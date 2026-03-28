"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, Loader, User, Image as ImageIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { combinePersonalityReasoning } from "@/ai/flows/combine-personality-reasoning";
import type { CombinePersonalityReasoningInput } from "@/ai/flows/combine-personality-reasoning";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  images?: { url: string; contentType: string }[];
}

const allPersonalities: CombinePersonalityReasoningInput['personalities'] = [
  { role: 'Logical Analyst', systemPrompt: 'You are a logical and analytical AI. Break down complex problems, identify key facts, and provide clear, structured reasoning. Focus on objectivity and evidence.' },
  { role: 'Creative Thinker', systemPrompt: 'You are a creative and imaginative AI. Brainstorm novel ideas, think outside the box, and suggest innovative solutions. Encourage divergent thinking.' },
  { role: 'Critic', systemPrompt: 'You are a critical and skeptical AI. Identify potential flaws, weaknesses, and biases in arguments or ideas. Provide constructive feedback and challenge assumptions.' },
  { role: 'Optimist', systemPrompt: 'You are an optimistic and encouraging AI. Focus on positive aspects, potential opportunities, and solutions. Offer supportive and hopeful perspectives.' },
  { role: 'Scientist', systemPrompt: 'You are a scientific AI, focused on empirical data, research, and testable hypotheses. Explain concepts with scientific accuracy and refer to established knowledge.' }
];

interface ChatSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProcessingStateChange: (isProcessing: boolean) => void;
}

export function ChatSheet({ isOpen, onOpenChange, onProcessingStateChange }: ChatSheetProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [numPersonalities, setNumPersonalities] = useState(3);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onProcessingStateChange(isLoading);
  }, [isLoading, onProcessingStateChange]);
  
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const personalitiesToUse = allPersonalities.slice(0, numPersonalities);
      const response = await combinePersonalityReasoning({
        message: input,
        personalities: personalitiesToUse,
      });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        text: response.combinedResponse,
        images: response.images,
      };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error("AI Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get a response from the AI. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:w-3/4 md:w-1/2 lg:w-1/3 p-0 flex flex-col glassmorphism !bg-background/80">
        <SheetHeader className="p-6 pb-2">
          <SheetTitle className="font-headline text-2xl flex items-center gap-2">
            <Bot className="text-primary glow-sm" /> AEROX AI Chat
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 px-6" ref={scrollAreaRef}>
          <div className="flex flex-col gap-4 py-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                {message.role === 'ai' && <Bot className="w-6 h-6 text-primary shrink-0 mt-1" />}
                <div className={`p-3 rounded-lg max-w-sm ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                  <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                   {message.images && message.images.length > 0 && (
                      <div className="mt-2 flex flex-col gap-2">
                          {message.images.map((image, index) => (
                              <div key={index} className="relative aspect-square w-full rounded-md overflow-hidden border border-border">
                                  <Image
                                      src={image.url}
                                      alt="Generated image"
                                      layout="fill"
                                      objectFit="cover"
                                  />
                              </div>
                          ))}
                      </div>
                  )}
                </div>
                {message.role === 'user' && <User className="w-6 h-6 text-accent shrink-0 mt-1" />}
              </div>
            ))}
            {isLoading && (
              <div className="flex items-center gap-3">
                 <Bot className="w-6 h-6 text-primary shrink-0" />
                <div className="p-3 rounded-lg bg-secondary flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter className="p-6 pt-2 flex-col !space-x-0 gap-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full space-y-2">
            <Label htmlFor="personalities" className="text-xs text-muted-foreground">
              Personalities: {numPersonalities}
            </Label>
            <Slider
              id="personalities"
              min={1}
              max={5}
              step={1}
              value={[numPersonalities]}
              onValueChange={(value) => setNumPersonalities(value[0])}
              disabled={isLoading}
            />
          </div>
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
            <Input
              type="text"
              placeholder="Ask AEROX AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !input.trim()} className="glow-md">
              {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
