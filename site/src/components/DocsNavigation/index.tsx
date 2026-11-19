import NextLink from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { DocNavigation, SidebarItem } from "../Sidebar/types";

interface PageLinkLabelProps {
  label: string;
  previous: boolean;
  direction: string;
}

export function DocsBreadcrumbs({ navigation }: { navigation: DocNavigation }) {
  const { current } = navigation;
  if (!current) return null;
  return (
    <Breadcrumb className="mb-9">
      <BreadcrumbList className="text-xs">
        <CrumbLink href="/" label="Home" />
        <ParentCrumb current={current} />
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{current.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function DocsPagination({ navigation }: { navigation: DocNavigation }) {
  return (
    <nav aria-label="Documentation pages" className="mt-14 grid grid-cols-2 gap-3 border-t pt-6">
      <PageLink item={navigation.previous} previous />
      <PageLink item={navigation.next} />
    </nav>
  );
}

function ParentCrumb({ current }: { current: SidebarItem }) {
  if (current.href === "/docs") return null;
  return (
    <>
      <BreadcrumbSeparator />
      <CrumbLink href="/docs" label="Docs" />
    </>
  );
}

function CrumbLink({ href, label }: { href: string; label: string }) {
  return (
    <BreadcrumbItem>
      <BreadcrumbLink asChild>
        <NextLink href={href}>{label}</NextLink>
      </BreadcrumbLink>
    </BreadcrumbItem>
  );
}

function PageLink({ item, previous = false }: { item?: SidebarItem; previous?: boolean }) {
  if (!item) return <div />;
  const direction = previous ? "Previous" : "Next";
  const label = `${direction} ${item.label}`;
  return (
    <Button
      variant="outline"
      asChild
      className="h-auto min-h-20 justify-between gap-2 rounded-lg px-4 py-3 shadow-none hover:bg-muted/50"
    >
      <NextLink href={item.href} aria-label={label}>
        <PageLinkLabel label={item.label} previous={previous} direction={direction} />
      </NextLink>
    </Button>
  );
}

function PageLinkLabel({ label, previous, direction }: PageLinkLabelProps) {
  const Icon = previous ? ArrowLeft : ArrowRight;
  const className = previous ? "order-first" : "order-last";
  const textClass = previous ? "text-left" : "text-right";
  return (
    <>
      <Icon className={`size-4 shrink-0 text-muted-foreground ${className}`} aria-hidden="true" />
      <span className={`min-w-0 flex-1 ${textClass}`}>
        <span className="block text-xs font-normal text-muted-foreground">{direction}</span>
        <span className="mt-1 block truncate text-sm font-medium">{label}</span>
      </span>
    </>
  );
}
