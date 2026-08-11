import { Fragment } from "react";

/**
 * Renders a chat reply's light formatting — **bold** spans and "- "/"• "
 * bullet lists — without pulling in a markdown dependency. Assistant
 * replies are short and predictable enough that this covers them.
 */
export function FormattedText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);

  return (
    <div className="space-y-2.5">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((line) => /^[-•]\s+/.test(line));

        if (isList) {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-4">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex} className="font-body text-[13.5px] leading-relaxed">
                  <InlineBold text={line.replace(/^[-•]\s+/, "")} />
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={blockIndex} className="font-body text-[13.5px] leading-relaxed">
            {lines.map((line, lineIndex) => (
              <Fragment key={lineIndex}>
                {lineIndex > 0 && <br />}
                <InlineBold text={line} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function InlineBold({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="font-semibold text-clay-ink">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={index}>{part}</Fragment>
        ),
      )}
    </>
  );
}
