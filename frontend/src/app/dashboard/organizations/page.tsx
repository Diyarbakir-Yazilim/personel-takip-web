"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BuildingsTab } from "./components/BuildingsTab";
import { FloorsTab } from "./components/FloorsTab";
import { ZonesTab } from "./components/ZonesTab";

export default function OrganizationsPage() {
  const [activeTab, setActiveTab] = useState("buildings");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organizations Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage your buildings, floors, and zones here.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="buildings">Buildings</TabsTrigger>
          <TabsTrigger value="floors">Floors</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
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
