"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildingsTab } from '@/components/Organizations/BuildingsTab';
import { FloorsTab } from '@/components/Organizations/FloorsTab';
import { ZonesTab } from '@/components/Organizations/ZonesTab';

export default function OrganizationsPage() {
  const [activeTab, setActiveTab] = useState("buildings");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizasyon Yönetimi</h1>
        <p className="text-muted-foreground mt-2">
          Binalarınızı, katlarınızı ve odalarınızı (alanlarınızı) buradan yönetin.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="buildings">Binalar</TabsTrigger>
          <TabsTrigger value="floors">Katlar</TabsTrigger>
          <TabsTrigger value="zones">Odalar</TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="buildings" className="m-0">
            <BuildingsTab isActive={activeTab === "buildings"} />
          </TabsContent>
          <TabsContent value="floors" className="m-0">
            <FloorsTab isActive={activeTab === "floors"} />
          </TabsContent>
          <TabsContent value="zones" className="m-0">
            <ZonesTab isActive={activeTab === "zones"} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
