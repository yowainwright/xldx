import type { DocHeading } from "./types";

export function readDocHeadings(article: HTMLElement): DocHeading[] {
  const headings = headingElements(article).map((element) => {
    const { id } = element;
    const text = element.textContent?.trim() ?? "";
    const depth = element.tagName === "H2" ? 2 : 3;
    const heading: DocHeading = { id, text, depth };
    return heading;
  });
  return headings;
}

export function observeDocHeadings(article: HTMLElement, select: (id: string) => void) {
  const elements = headingElements(article);
  const update = () => select(activeHeading(elements));
  const observer = new IntersectionObserver(update, { rootMargin: "-64px 0px -60% 0px" });
  elements.forEach((element) => observer.observe(element));
  window.addEventListener("scroll", update, { passive: true });
  const frame = requestAnimationFrame(update);
  const cleanup = () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", update);
  };
  return cleanup;
}

function headingElements(article: HTMLElement): HTMLElement[] {
  const nodes = article.querySelectorAll<HTMLElement>("h2[id], h3[id]");
  const elements = Array.from(nodes).filter((element) => element.textContent?.trim());
  return elements;
}

function activeHeading(elements: HTMLElement[]): string {
  const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  const atEnd = window.scrollY > 0 && bottom;
  const finalId = elements.at(-1)?.id ?? "";
  if (atEnd) return finalId;
  const passed = elements.filter((element) => {
    const above = element.getBoundingClientRect().top <= 100;
    return above;
  });
  const active = passed.at(-1) ?? elements[0];
  const id = active?.id ?? "";
  return id;
}
