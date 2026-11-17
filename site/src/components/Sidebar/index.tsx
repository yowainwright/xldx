"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SIDEBAR_SECTIONS } from "./constants";
import type { SidebarItem, SidebarSection } from "./types";

function DocLink({ item }: { item: SidebarItem }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const active = pathname === item.href;
  const close = () => setOpenMobile(false);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active}>
        <NextLink href={item.href} onClick={close}>
          {item.label}
        </NextLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function DocGroup({ section }: { section: SidebarSection }) {
  const links = section.items.map((item) => <DocLink key={item.href} item={item} />);
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>{links}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function Sidebar() {
  const groups = SIDEBAR_SECTIONS.map((section) => (
    <DocGroup key={section.title} section={section} />
  ));
  return (
    <ShadcnSidebar>
      <SidebarContent>
        <nav aria-label="Documentation">{groups}</nav>
      </SidebarContent>
    </ShadcnSidebar>
  );
}

export type { SidebarSection, SidebarItem } from "./types";
