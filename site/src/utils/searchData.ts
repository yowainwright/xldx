import { getCollection } from "astro:content";

export async function getSearchData() {
  const docs = await getCollection("docs");

  const searchData = docs.map((doc) => {
    const rawContent = doc.body || "";

    let content = rawContent
      .replace(/---[\s\S]*?---/g, "") // Remove frontmatter
      .replace(/import[\s\S]*?from[\s\S]*?;/g, "") // Remove imports
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/`[^`]*`/g, "");
    let prevContent;
    do {
      prevContent = content;
      content = content.replace(/<[^>]*>/g, "");
    } while (content !== prevContent);
    content = content
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/[#*_~]/g, "")
      .replace(/\n+/g, " ")
      .trim()
      .substring(0, 500);

    return {
      title: doc.data.title,
      description: doc.data.description || "",
      content,
      slug: doc.slug,
    };
  });

  return searchData;
}
