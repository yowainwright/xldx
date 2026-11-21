export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export interface SidebarItem {
  label: string;
  href: string;
}

export interface DocNavigation {
  current?: SidebarItem;
  previous?: SidebarItem;
  next?: SidebarItem;
}
