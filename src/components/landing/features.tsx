"use client";

import { useRef, useEffect } from 'react';
import { BrainCircuit, Image as ImageIcon, FileText, Zap, Cpu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const features = [
  {
    title: 'Multi-Personality Reasoning',
    description: 'Engage multiple AI personas for deeper, more nuanced insights and creative solutions.',
    icon: BrainCircuit,
    imageHint: 'brain network',
  },
  {
    title: 'Generates Images',
    description: 'Bring your ideas to life. Generate stunning visuals from simple text descriptions.',
    icon: ImageIcon,
    imageHint: 'abstract art',
  },
  {
    title: 'Reads Files',
    description: 'Analyze and understand content from uploaded documents and images for context-aware responses.',
    icon: FileText,
    imageHint: 'documents code',
  },
  {
    title: 'Deep Reasoning',
    description: 'Leverages advanced models to understand complex queries and provide insightful answers.',
    icon: Cpu,
    imageHint: 'galaxy nebula',
  },
  {
    title: 'Fast Responses',
    description: 'Optimized for performance, delivering complex reasoning and results with incredible speed.',
    icon: Zap,
    imageHint: 'light speed',
  },
];

const FeatureCard = ({ feature }: { feature: (typeof features)[0] }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const image = PlaceHolderImages.find((img) => img.imageHint === feature.imageHint);

  const onMouseMove = (e: MouseEvent) => {
    const card = cardRef.current;
    if (!card) return;

    const { left, top, width, height } = card.getBoundingClientRect();
    const x = e.clientX - left - width / 2;
    const y = e.clientY - top - height / 2;

    const rotateX = (-y / height) * 20;
    const rotateY = (x / width) * 20;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
  };

  const onMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
  };

  useEffect(() => {
    const card = cardRef.current;
    if (card) {
      card.addEventListener('mousemove', onMouseMove);
      card.addEventListener('mouseleave', onMouseLeave);
    }
    return () => {
      if (card) {
        card.removeEventListener('mousemove', onMouseMove);
        card.removeEventListener('mouseleave', onMouseLeave);
      }
    };
  }, []);

  return (
    <Card ref={cardRef} className="glassmorphism group relative overflow-hidden transition-transform duration-300 ease-out">
      {image && (
        <Image
          src={image.imageUrl}
          alt={feature.title}
          width={400}
          height={300}
          className="absolute inset-0 h-full w-full object-cover opacity-10 group-hover:opacity-20 transition-opacity duration-300"
          data-ai-hint={feature.imageHint}
        />
      )}
      <CardHeader className="relative z-10 flex flex-row items-center gap-4">
        <feature.icon className="w-8 h-8 text-primary" />
        <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
      </CardHeader>
      <CardContent className="relative z-10">
        <p className="text-muted-foreground">{feature.description}</p>
      </CardContent>
    </Card>
  );
};

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const section = sectionRef.current;
    if (section) {
      Array.from(section.children).forEach((child) => observer.observe(child));
    }

    return () => {
      if (section) {
        Array.from(section.children).forEach((child) => observer.unobserve(child));
      }
    };
  }, []);

  return (
    <section className="container mx-auto py-24 px-4">
      <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div key={index} style={{ opacity: 0, animation: 'fade-in-up 0.5s ease-out forwards', animationDelay: `${index * 150}ms`}}>
             <FeatureCard feature={feature} />
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation-name: fade-in-up;
          animation-duration: 0.5s;
          animation-fill-mode: forwards;
          animation-timing-function: ease-out;
        }
      `}</style>
    </section>
  );
};

export default Features;
