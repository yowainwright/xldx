"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
import { normalizeDocPath } from "./utils";
import type { SidebarItem, SidebarSection } from "./types";

export function Sidebar() {
  const groups = SIDEBAR_SECTIONS.map((section) => (
    <DocGroup key={section.title} section={section} />
  ));
  return (
    <ShadcnSidebar className="top-16 h-[calc(100svh-4rem)]">
      <SidebarContent className="bg-background px-3 py-7">
        <nav aria-label="Documentation">{groups}</nav>
      </SidebarContent>
    </ShadcnSidebar>
  );
}

function DocGroup({ section }: { section: SidebarSection }) {
  const links = section.items.map((item) => <DocLink key={item.href} item={item} />);
  return (
    <Collapsible defaultOpen className="group/section">
      <SidebarGroup className="p-0">
        <GroupHeading title={section.title} />
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu className="ml-3 w-auto gap-0 border-l">{links}</SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function GroupHeading({ title }: { title: string }) {
  return (
    <SidebarGroupLabel asChild className="mb-2 h-8 px-3 text-xs font-semibold text-foreground/80">
      <CollapsibleTrigger className="w-full justify-between">
        {title}
        <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=closed]/section:-rotate-90" />
      </CollapsibleTrigger>
    </SidebarGroupLabel>
  );
}

function DocLink({ item }: { item: SidebarItem }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const active = normalizeDocPath(pathname) === item.href;
  const current = active ? "page" : undefined;
  const close = () => setOpenMobile(false);
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={active}
        className="h-9 rounded-none border-l border-transparent px-4 text-[13px] text-muted-foreground hover:bg-muted/50 data-[active=true]:border-l-primary data-[active=true]:bg-muted/60 data-[active=true]:text-foreground"
      >
        <NextLink href={item.href} onClick={close} aria-current={current}>
          {item.label}
        </NextLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export type { SidebarSection, SidebarItem } from "./types";
