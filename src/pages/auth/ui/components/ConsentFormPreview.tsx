import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentForm, ConsentFormBlock } from "@/types/consent";
import { X } from "lucide-react";

interface ConsentFormPreviewProps {
  consentFormData: ConsentForm;
  className?: string;
  showHeader?: boolean;
}

const getTextContent = (content: any): string => {
  if (typeof content === "string") return content;
  if (content?.text) return content.text;
  return "";
};

const getArrayContent = (content: any): string[] => {
  if (Array.isArray(content)) return content;
  if (Array.isArray(content?.items)) return content.items;
  if (typeof content === "string") return [content];
  return [];
};

const BlockRenderer = ({ block }: { block: ConsentFormBlock }) => {
  const { type, content } = block;

  switch (type) {
    case "section_header":
      return (
        <h3 className="text-base font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
          {getTextContent(content)}
        </h3>
      );

    case "paragraph":
      const paragraphText = getTextContent(content);
      return (
        <div className="text-gray-700 dark:text-gray-300">
          {paragraphText.split("\n").map((line, index) => (
            <p key={index} className={index > 0 ? "mt-2" : ""}>
              {line}
            </p>
          ))}
        </div>
      );

    case "list":
      const items = getArrayContent(content);
      return (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
            {items.map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      );

    case "info_box":
      const infoBoxText = getTextContent(content);
      return (
        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="text-yellow-900 dark:text-yellow-100 font-medium">
            {infoBoxText.split("\n").map((line, index) => (
              <p key={index} className={index > 0 ? "mt-2" : ""}>
                {line}
              </p>
            ))}
          </div>
        </div>
      );

    case "info_box_list":
      const boxItems = getArrayContent(content);
      return (
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <ul className="space-y-2 text-blue-900 dark:text-blue-100">
            {boxItems.map((item: string, index: number) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      );

    case "two_column_box":
      const leftItems = getArrayContent(content?.left?.items);
      const rightItems = getArrayContent(content?.right?.items);

      return (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <h4 className="font-medium mb-2 text-red-900 dark:text-red-100">
              {content?.left?.title || "Left Column"}
            </h4>
            <ul className="text-sm space-y-1 text-red-800 dark:text-red-200">
              {leftItems.length > 0 ? (
                leftItems.map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))
              ) : (
                <li>No items</li>
              )}
            </ul>
          </div>
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <h4 className="font-medium mb-2 text-green-900 dark:text-green-100">
              {content?.right?.title || "Right Column"}
            </h4>
            <ul className="text-sm space-y-1 text-green-800 dark:text-green-200">
              {rightItems.length > 0 ? (
                rightItems.map((item: string, index: number) => (
                  <li key={index}>• {item}</li>
                ))
              ) : (
                <li>No items</li>
              )}
            </ul>
          </div>
        </div>
      );

    case "two_column_info":
      const leftContent = content?.left?.content || "";
      const rightContent = content?.right?.content || "";

      return (
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
              {content?.left?.title || "Left Info"}
            </h4>
            <div className="text-gray-700 dark:text-gray-300">
              {leftContent.split("\n").map((line: string, index: number) => (
                <p key={index} className={index > 0 ? "mt-2" : ""}>
                  {line}
                </p>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">
              {content?.right?.title || "Right Info"}
            </h4>
            <div className="text-gray-700 dark:text-gray-300">
              {rightContent.split("\n").map((line: string, index: number) => (
                <p key={index} className={index > 0 ? "mt-2" : ""}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-2 border border-red-300 bg-red-50 text-red-700 rounded">
          Unknown block type: {type}
        </div>
      );
  }
};

const ConsentFormPreview = ({
  consentFormData,
  className = "",
  showHeader = true,
}: ConsentFormPreviewProps) => {
  const sortedBlocks = [...consentFormData.blocks].sort((a, b) => {
    return a.sortOrder - b.sortOrder;
  });

  return (
    <div className={`${className}`}>
      {/* Title and Subtitle Header */}
      {showHeader && (
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-start space-y-0 pb-6 rounded-t-lg">
          <div className="flex-1">
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              {consentFormData.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {consentFormData.subtitle}
            </CardDescription>
          </div>
          <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-4">
            <X size={20} />
          </button>
        </CardHeader>
      )}

      <div className="space-y-6 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
        {/* Research Information Header */}
        {(consentFormData.studyTitle || consentFormData.researchLead) && (
          <div className="border-l-4 border-primary pl-4 bg-primary/10 dark:bg-primary/20 p-4 rounded-r-lg">
            <h3 className="font-semibold text-primary">
              RESEARCH TITLE: {consentFormData.studyTitle}
            </h3>
            <p className="text-primary/80 dark:text-blue-200 text-xs mt-1">
              Principal Investigator: {consentFormData.researchLead} •
              Institution: {consentFormData.institution} • IRB Protocol:{" "}
              {consentFormData.irbNumber}
            </p>
          </div>
        )}

        {/* Render blocks dynamically */}
        {sortedBlocks.map((block: ConsentFormBlock) => (
          <section
            key={block.id}
            className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0"
          >
            <BlockRenderer block={block} />
          </section>
        ))}
      </div>
    </div>
  );
};

export default ConsentFormPreview;
