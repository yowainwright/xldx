import React, { useState, useEffect, useRef } from "react";

// Main component
export default function CodeBlockSpotlight({
  code,
  language,
  sections,
  autoRotateInterval = 3000,
  title,
}: CodeBlockSpotlightProps) {
  const { activeSection, handleSectionClick } = useSpotlightRotation(
    sections,
    autoRotateInterval,
  );

  return (
    <Container>
      <Header title={title} />
      <SectionControls
        sections={sections}
        activeSection={activeSection}
        onSectionClick={handleSectionClick}
      />
      <CodeViewer
        code={code}
        language={language}
        activeSection={activeSection}
        sections={sections}
      />
    </Container>
  );
}

// Custom hook for spotlight rotation logic
function useSpotlightRotation(sections: CodeSection[], interval: number) {
  const [activeSection, setActiveSection] = useState<string | null>(
    sections[0]?.id || null,
  );
  const [isManualControl, setIsManualControl] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isManualControl && sections.length > 1) {
      intervalRef.current = setInterval(() => {
        setActiveSection((current) => {
          const currentIndex = sections.findIndex((s) => s.id === current);
          const nextIndex = (currentIndex + 1) % sections.length;
          return sections[nextIndex].id;
        });
      }, interval);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isManualControl, sections, interval]);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsManualControl(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setTimeout(() => {
      setIsManualControl(false);
    }, 10000);
  };

  return { activeSection, handleSectionClick };
}

// Container component
function Container({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-8 rounded-xl overflow-hidden bg-gray-900 shadow-2xl">
      {children}
    </div>
  );
}

// Header component (combines title check)
function Header({ title }: { title?: string }) {
  if (!title) return null;

  return (
    <div className="px-6 py-4 bg-gray-800/50 border-b border-gray-700/50 text-gray-300 text-sm font-medium">
      {title}
    </div>
  );
}

// Section controls component
function SectionControls({
  sections,
  activeSection,
  onSectionClick,
}: {
  sections: CodeSection[];
  activeSection: string | null;
  onSectionClick: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-6 py-4 bg-gray-800/30 border-b border-gray-700/50">
      <SectionButtons
        sections={sections}
        activeSection={activeSection}
        onSectionClick={onSectionClick}
      />
    </div>
  );
}

// Section buttons list
function SectionButtons({
  sections,
  activeSection,
  onSectionClick,
}: {
  sections: CodeSection[];
  activeSection: string | null;
  onSectionClick: (id: string) => void;
}) {
  return (
    <>
      {sections.map((section) => (
        <SectionButton
          key={section.id}
          section={section}
          isActive={activeSection === section.id}
          onClick={() => onSectionClick(section.id)}
        />
      ))}
    </>
  );
}

// Individual section button
function SectionButton({
  section,
  isActive,
  onClick,
}: {
  section: CodeSection;
  isActive: boolean;
  onClick: () => void;
}) {
  const baseClasses =
    "px-4 py-2 rounded-md text-sm font-mono transition-all duration-300";
  const activeClasses =
    "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25";
  const inactiveClasses =
    "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50 hover:text-gray-300 hover:border-gray-600";

  return (
    <button
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      onClick={onClick}
      title={section.description}
    >
      {section.label}
    </button>
  );
}

// Code viewer component
function CodeViewer({
  code,
  language,
  activeSection,
  sections,
}: {
  code: string;
  language: string;
  activeSection: string | null;
  sections: CodeSection[];
}) {
  const activeRange = sections.find((s) => s.id === activeSection);

  return (
    <ScrollContainer>
      <SyntaxHighlighter
        code={code}
        language={language}
        activeRange={activeRange}
      />
    </ScrollContainer>
  );
}

// Scroll container
function ScrollContainer({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

// Syntax highlighter wrapper
function SyntaxHighlighter({
  code,
  language,
  activeRange,
}: {
  code: string;
  language: string;
  activeRange?: CodeSection;
}) {
  const lines = code.trim().split('\n');
  const tokens = lines.map(line => [{
    content: line,
    types: []
  }]);
  
  return (
    <CodeBlock
      className={`language-${language}`}
      style={{ backgroundColor: '#011627', color: '#d6deeb' }}
      tokens={tokens}
      activeRange={activeRange}
      getTokenProps={(token: any) => ({
        children: token.content,
        className: ''
      })}
    />
  );
}

// Code block component
function CodeBlock({
  className,
  style,
  tokens,
  activeRange,
  getTokenProps,
}: {
  className: string;
  style: React.CSSProperties;
  tokens: any[];
  activeRange?: CodeSection;
  getTokenProps: any;
}) {
  return (
    <pre className={`${className} !bg-transparent !p-6 !m-0`} style={style}>
      <code>
        <CodeLines
          tokens={tokens}
          activeRange={activeRange}
          getTokenProps={getTokenProps}
        />
      </code>
    </pre>
  );
}

// Code lines renderer
function CodeLines({
  tokens,
  activeRange,
  getTokenProps,
}: {
  tokens: any[];
  activeRange?: CodeSection;
  getTokenProps: any;
}) {
  return (
    <>
      {tokens.map((line, i) => (
        <CodeLine
          key={i}
          line={line}
          lineNumber={i + 1}
          activeRange={activeRange}
          getTokenProps={getTokenProps}
        />
      ))}
    </>
  );
}

// Individual code line
function CodeLine({
  line,
  lineNumber,
  activeRange,
  getTokenProps,
}: {
  line: any[];
  lineNumber: number;
  activeRange?: CodeSection;
  getTokenProps: any;
}) {
  const isHighlighted =
    activeRange &&
    lineNumber >= activeRange.lines[0] &&
    lineNumber <= activeRange.lines[1];

  return (
    <LineWrapper isHighlighted={isHighlighted}>
      <LineNumber number={lineNumber} />
      <LineTokens tokens={line} getTokenProps={getTokenProps} />
    </LineWrapper>
  );
}

// Line wrapper with spotlight effect
function LineWrapper({
  children,
  isHighlighted,
}: {
  children: React.ReactNode;
  isHighlighted?: boolean;
}) {
  const baseClasses = "flex transition-all duration-500 ease-in-out";
  const highlightClasses =
    "bg-gradient-to-r from-purple-500/10 to-purple-500/5 shadow-lg shadow-purple-500/10 border-l-4 border-purple-500 pl-2 -ml-2 opacity-100";
  const dimmedClasses =
    isHighlighted === false ? "opacity-30 blur-[0.5px]" : "opacity-60";

  return (
    <div
      className={`${baseClasses} ${isHighlighted ? highlightClasses : dimmedClasses}`}
    >
      {children}
    </div>
  );
}

// Line number component
function LineNumber({ number }: { number: number }) {
  return (
    <span className="inline-block w-12 text-gray-500 text-right pr-4 select-none">
      {number}
    </span>
  );
}

// Line tokens renderer
function LineTokens({
  tokens,
  getTokenProps,
}: {
  tokens: any[];
  getTokenProps: any;
}) {
  return (
    <span className="flex-1">
      {tokens.map((token, key) => {
        const props = getTokenProps({ token });
        return (
          <span key={key} className={props.className}>
            {props.children}
          </span>
        );
      })}
    </span>
  );
}

// Types
interface CodeSection {
  id: string;
  label: string;
  lines: [number, number];
  description?: string;
}

interface CodeBlockSpotlightProps {
  code: string;
  language: string;
  sections: CodeSection[];
  autoRotateInterval?: number;
  title?: string;
}
