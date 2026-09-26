"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Package, Smartphone, Cable, Headphones, BatteryCharging, Search, ArrowLeft } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import InventoryForm from "@/components/inventory/InventoryForm";
import InventoryTable from "@/components/inventory/InventoryTable";
import PurchaseStockPanel from "@/components/inventory/PurchaseStockPanel";
import EngineerPartIssuePanel from "@/components/inventory/EngineerPartIssuePanel";
import OpeningStockPanel from "@/components/inventory/OpeningStockPanel";
import { inventoryService } from "@/services/inventoryService";
import { staffService } from "@/services/staffService";
import type { StaffRole } from "@/types/staff";
import type { InventoryItem } from "@/types/inventory";

type Shelf = "all" | "parts" | "accessories";
type PartCategory = "Display" | "Battery" | "Down Board" | "Charging Flex" | "Screen Guard" | "Back Glass / Housing" | "Power Flex" | "Camera" | "Audio" | "Earpiece Flex" | "Other Phone Parts";

const PARTS: { name: PartCategory; icon: typeof Package; description: string; brands?: string[] }[] = [
  { name: "Display", icon: Smartphone, description: "Phone display / screen assemblies", brands: ["iPhone","Samsung","Tecno","Infinix","itel","Redmi","Xiaomi","Nokia","Other Android"] },
  { name: "Battery", icon: BatteryCharging, description: "Replacement phone batteries", brands: ["iPhone","Samsung","Tecno","Infinix","itel","Redmi","Xiaomi","Nokia","Other Android"] },
  { name: "Down Board", icon: Cable, description: "Charging boards and lower boards", brands: ["iPhone","Samsung","Tecno","Infinix","itel","Redmi","Xiaomi","Nokia","Other Android"] },
  { name: "Charging Flex", icon: Cable, description: "Charging and USB flex cables", brands: ["iPhone","Samsung","Tecno","Infinix","itel","Redmi","Xiaomi","Nokia","Other Android"] },
  { name: "Screen Guard", icon: Smartphone, description: "Model-specific screen guards", brands: ["iPhone","Samsung","Tecno","Infinix","itel","Redmi","Xiaomi","Nokia","Other Android"] },
  { name: "Back Glass / Housing", icon: Smartphone, description: "Back glass / housing currently stocked for iPhone", brands: ["iPhone"] },
  { name: "Power Flex", icon: BatteryCharging, description: "Power and side-button flexes", brands: ["iPhone","Samsung","Tecno","Infinix","itel","Redmi","Xiaomi","Nokia","Other Android"] },
  { name: "Camera", icon: Smartphone, description: "Replacement camera modules and parts", brands: ["iPhone","Samsung","Tecno","Infinix","itel","Redmi","Xiaomi","Nokia","Other Android"] },
  { name: "Audio", icon: Headphones, description: "Speaker, microphone and audio repair parts", brands: ["iPhone","Samsung","Tecno","Infinix","itel","Redmi","Xiaomi","Nokia","Other Android"] },
  { name: "Earpiece Flex", icon: Headphones, description: "Earpiece and speaker flexes", brands: ["iPhone","Samsung","Tecno","Infinix","itel","Redmi","Xiaomi","Nokia","Other Android"] },
  { name: "Other Phone Parts", icon: Package, description: "Other repair parts" },
];
