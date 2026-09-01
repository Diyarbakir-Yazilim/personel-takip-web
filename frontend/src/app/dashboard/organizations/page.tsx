"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Layers3, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

import { BuildingsTab } from '@/components/Organizations/BuildingsTab';
import { FloorsTab } from '@/components/Organizations/FloorsTab';
import { ZonesTab } from '@/components/Organizations/ZonesTab';

const TABS = [
  { id: "buildings", label: "Binalar", icon: Building2 },
  { id: "floors", label: "Katlar", icon: Layers3 },
  { id: "zones", label: "Bölgeler/Odalar", icon: MapPin },
];

export default function OrganizationsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  // Framer Motion animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="p-6 md:p-10 max-w-7xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div variants={childVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6 border-border/60">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tighter text-foreground">
            Organizasyon Yönetimi
          </h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-2xl">
            Tesisinizin binalarını, kat planlarını ve belirli bölgelerini veya odalarını merkezi bir şekilde yönetin.
          </p>
        </div>
      </motion.div>

      {/* Modern Tabs Section */}
      <motion.div variants={childVariants} className="w-full">
        {/* Floating Tab Navigation List */}
        <div className="bg-muted/40 p-1 rounded-full border border-border/50 shadow-inner inline-flex w-full sm:w-auto max-w-full overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "group relative px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 ease-out flex items-center gap-2.5 flex-1 sm:flex-none justify-center whitespace-nowrap",
                  isActive
                    ? "text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                )}
              >
                {/* Active Tab Sliding Background Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 bg-primary rounded-full z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}

                {/* Tab Icon and Label */}
                <Icon className={cn(
                  "w-4 h-4 z-10 transition-colors duration-300",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Container with Smooth Transitions */}
        <div className="mt-8 bg-card p-6 rounded-3xl border border-border/50 shadow-sm min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "buildings" && <BuildingsTab isActive={activeTab === "buildings"} />}
              {activeTab === "floors" && <FloorsTab isActive={activeTab === "floors"} />}
              {activeTab === "zones" && <ZonesTab isActive={activeTab === "zones"} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}