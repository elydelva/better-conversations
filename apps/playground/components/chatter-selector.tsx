"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useActiveChatter } from "@/contexts/chatter-context";
import { type Chatter, chattersApi } from "@/lib/api";
import { ChevronDown, User } from "lucide-react";
import Link from "next/link";

interface ChatterSelectorProps {
  chatters: Chatter[];
  onRefresh?: () => void;
}

export function ChatterSelector({ chatters, onRefresh }: ChatterSelectorProps) {
  const { activeChatter, setActiveChatter } = useActiveChatter();

  async function handleSelect(chatter: Chatter) {
    try {
      const full = await chattersApi.find(chatter.id);
      setActiveChatter(full);
    } catch {
      setActiveChatter(chatter);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between gap-2">
          {activeChatter ? (
            <>
              <Avatar className="h-6 w-6">
                <AvatarImage src={activeChatter.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {activeChatter.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">{activeChatter.displayName}</span>
            </>
          ) : (
            <>
              <User className="h-4 w-4" />
              <span>Select chatter</span>
            </>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
        <DropdownMenuLabel>Active chatter</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {chatters.length === 0 ? (
          <DropdownMenuItem asChild>
            <Link href="/chatters">Create a chatter</Link>
          </DropdownMenuItem>
        ) : (
          chatters.map((c) => (
            <DropdownMenuItem key={c.id} onClick={() => handleSelect(c)}>
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={c.avatarUrl ?? undefined} />
                <AvatarFallback className="text-xs">
                  {c.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {c.displayName}
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/chatters" onClick={onRefresh}>
            Manage chatters
          </Link>
        </DropdownMenuItem>
        {activeChatter && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActiveChatter(null)}>
              Clear selection
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
