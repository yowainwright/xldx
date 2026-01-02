import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { getDocContent, getDocBySlug, getAllDocs } from "@/content";
import { compileMDX } from "@/lib/mdx/compileMDX";
import { mdxComponents } from "@/components/MDXComponents";
import type { MDXComponentMap } from "@/components/MDXComponents/types";

type MDXContentComponent = React.ComponentType<{
  components?: MDXComponentMap;
}>;

export function DocsPage() {
  const { slug } = useParams({ strict: false });
  const navigate = useNavigate();
  const [Content, setContent] = useState<MDXContentComponent | null>(null);
  const [loading, setLoading] = useState(true);

  const docs = useMemo(() => getAllDocs(), []);
  const currentDoc = useMemo(
    () => (slug ? getDocBySlug(slug) : docs[0]),
    [slug, docs],
  );

  useEffect(() => {
    if (!slug && docs.length > 0) {
      navigate({ to: `/docs/${docs[0].slug}` });
      return;
    }

    async function loadContent() {
      const content = getDocContent(slug || docs[0]?.slug || "");
      if (!content) {
        setLoading(false);
        return;
      }

      try {
        const compiled = await compileMDX(content);
        const { default: MDXContent } = await run(compiled, {
          ...runtime,
          baseUrl: import.meta.url,
        });
        setContent(() => MDXContent);
      } catch (error) {
        console.error("Failed to compile MDX:", error);
      }
      setLoading(false);
    }

    loadContent();
  }, [slug, docs, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!Content || !currentDoc) {
    return (
      <div className="py-12 text-center">
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="mt-2 text-muted-foreground">
          The documentation page you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <>
      <h1>{currentDoc.title}</h1>
      <p className="lead">{currentDoc.description}</p>
      <Content components={mdxComponents} />
    </>
  );
}
