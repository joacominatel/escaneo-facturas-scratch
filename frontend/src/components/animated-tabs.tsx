"use client"

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Tab {
  href: string;
  label: string;
}

interface AnimatedTabsProps {
  tabs: Tab[];
  containerClassName?: string;
  linkClassName?: string;
  activeLinkClassName?: string;
  indicatorClassName?: string;
}

export function AnimatedTabs({
  tabs,
  containerClassName,
  linkClassName = "px-3 py-2 text-sm font-medium transition-colors hover:text-primary relative",
  activeLinkClassName = "text-primary",
  indicatorClassName = "bg-primary h-0.5 rounded-full",
}: AnimatedTabsProps) {
  const pathname = usePathname();
  const [hoveredTabIndex, setHoveredTabIndex] = useState<number | null>(null);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicatorStyle, setIndicatorStyle] = useState({ opacity: 0, left: 0, width: 0 });

  const activeTabIndex = tabs.findIndex(tab => pathname === tab.href);
  const targetIndex = hoveredTabIndex ?? activeTabIndex;

  useEffect(() => {
    refs.current = refs.current.slice(0, tabs.length);
  }, [tabs]);

  useEffect(() => {
    if (targetIndex !== -1 && refs.current[targetIndex]) {
      const targetElement = refs.current[targetIndex] as HTMLAnchorElement;
      setIndicatorStyle({
        opacity: 1,
        left: targetElement.offsetLeft,
        width: targetElement.offsetWidth,
      });
    } else {
      setIndicatorStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [targetIndex, pathname]);

  return (
    <nav 
      className={cn("relative flex items-center gap-1", containerClassName)}
      onMouseLeave={() => setHoveredTabIndex(null)}
    >
      {tabs.map((tab, index) => (
        <Link
          key={tab.href}
          href={tab.href}
          ref={(el) => { refs.current[index] = el; }}
          className={cn(
            "relative z-10",
            linkClassName,
            activeTabIndex === index ? activeLinkClassName : "text-muted-foreground"
          )}
          onMouseEnter={() => setHoveredTabIndex(index)}
        >
          {tab.label}
        </Link>
      ))}
      <AnimatePresence>
        <motion.div
          layoutId="animated-tab-indicator"
          className={cn(
            "absolute bottom-0 z-0",
            indicatorClassName
          )}
          animate={indicatorStyle}
          transition={{
            type: 'spring',
            stiffness: 350,
            damping: 35,
            mass: 0.8,
          }}
        />
      </AnimatePresence>
    </nav>
  );
} 