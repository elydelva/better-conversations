"use client";

import { ChatterSelector } from "@/components/chatter-selector";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ChatterProvider } from "@/contexts/chatter-context";
import { type Chatter, playgroundApi } from "@/lib/api";
import { Key, LayoutDashboard, MessageCircle, MessageSquare, Shield, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/conversations", label: "Conversations", icon: MessageCircle },
  { href: "/chatters", label: "Chatters", icon: Users },
  { href: "/policies", label: "Policies", icon: Shield },
  { href: "/permissions", label: "Permissions", icon: Key },
];

function DashboardSidebar() {
  const pathname = usePathname();
  const [chattersList, setChattersList] = useState<Chatter[]>([]);

  useEffect(() => {
    playgroundApi
      .listChatters()
      .then(setChattersList)
      .catch(() => setChattersList([]));
  }, []);

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-2">
        <div className="flex items-center gap-2 px-2">
          <span className="font-semibold">Better Conversations</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chatter actif</SidebarGroupLabel>
          <SidebarGroupContent className="px-2">
            <ChatterSelector chatters={chattersList} />
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <p className="text-xs text-muted-foreground px-2">Playground v1</p>
      </SidebarFooter>
    </Sidebar>
  );
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatterProvider>
      <DashboardContent>{children}</DashboardContent>
    </ChatterProvider>
  );
}
