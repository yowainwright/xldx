export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export interface SidebarItem {
  label: string;
  href: string;
}
