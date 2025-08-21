import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertTriangle,
  CheckCircle,
  Code,
  Calendar,
  Monitor,
  Hash,
  ChevronRight,
  ChevronDown,
  User,
  Layers2,
  Hammer,
  CalendarClock,
  CheckCheck,
} from "lucide-react";
import { useResolveError } from "@/pages/dashboard/hooks/useErrors";
import { Label } from "@/components/ui/label";
import { formatActivityTimestamp } from "@/utils/timeConverter";
import { ErrorLog } from "@/types/error";
import { getErrorById } from "@/api/errors";

interface ExpandableSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const ExpandableSection = ({
  title,
  icon,
  children,
  defaultExpanded = false,
}: ExpandableSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-muted/10 p-2 rounded-lg transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <div className="text-lg font-semibold flex items-center gap-2">
          {icon}
          {title}
        </div>
      </div>
      {isExpanded && <div className="ml-6 space-y-4">{children}</div>}
    </div>
  );
};

interface ContextDisplayProps {
  data: Record<string, any> | null | undefined;
  title?: string;
}

const ContextDisplay = ({ data, title = "Context" }: ContextDisplayProps) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleKey = (key: string) => {
    const newExpanded = new Set(expandedKeys);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedKeys(newExpanded);
  };

  const renderValue = (value: any, key: string = ""): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground italic">null</span>;
    }

    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value.toString()}
        </Badge>
      );
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      const isExpanded = expandedKeys.has(key);
      return (
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-muted/10 p-1 rounded transition-colors"
            onClick={() => toggleKey(key)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-sm font-semibold text-muted-foreground">
              {Object.keys(value).length} properties
            </span>
          </div>
          {isExpanded && (
            <div className="space-y-2 ml-4 pl-4">
              {Object.entries(value).map(([nestedKey, nestedValue]) => (
                <div key={nestedKey} className="flex items-start gap-4">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1 bg-muted/50 rounded whitespace-nowrap min-w-fit">
                    {nestedKey}:
                  </span>
                  <div className="flex-1">
                    {renderValue(nestedValue, `${key}.${nestedKey}`)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.has(key);
      return (
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-muted/10 p-1 rounded transition-colors"
            onClick={() => toggleKey(key)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
            <span className="text-sm font-semibold text-muted-foreground">
              Array ({value.length} items)
            </span>
          </div>
          {isExpanded && (
            <div className="space-y-2 bg-muted/30 rounded-md p-3 ml-4">
              {value.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap min-w-fit">
                    [{index}]:
                  </span>
                  <div className="flex-1">
                    {renderValue(item, `${key}[${index}]`)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // String/primitive values
    const stringValue = String(value);
    if (stringValue.length > 60 || stringValue.includes("\n")) {
      return (
        <div className="bg-slate-900 dark:bg-slate-800 text-green-400 rounded-lg p-3 text-sm font-mono overflow-x-auto">
          <pre className="whitespace-pre-wrap">{stringValue}</pre>
        </div>
      );
    }

    return (
      <span className="text-sm bg-muted/50 px-2 py-1 rounded">
        {stringValue}
      </span>
    );
  };

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  return (
    <div className="bg-muted/20 rounded-xl p-6 space-y-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-start gap-4">
          <span className="text-sm font-semibold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg whitespace-nowrap min-w-fit">
            {key}:
          </span>
          <div className="flex-1">{renderValue(value, key)}</div>
        </div>
      ))}
    </div>
  );
};

interface ErrorDetailsViewProps {
  errorId: string;
  onClose: () => void;
}

const ErrorDetailsView = ({ errorId, onClose }: ErrorDetailsViewProps) => {
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const [errorDetailLoading, setErrorDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { resolveError, isResolving } = useResolveError();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchErrorDetails = async () => {
      if (!errorId) {
        setSelectedError(null);
        return;
      }

      setErrorDetailLoading(true);
      setError(null);
      try {
        const { data, error } = await getErrorById(errorId);
        if (error) {
          console.error("Error fetching error details:", error);
          setError(error);
          setSelectedError(null);
        } else {
          console.log("Fetched error details:", data);
          setSelectedError(data || null);
        }
      } catch (err) {
        console.error("Failed to fetch error:", err);
        setError("Failed to fetch error details");
        setSelectedError(null);
      } finally {
        setErrorDetailLoading(false);
      }
    };

    fetchErrorDetails();
  }, [errorId]);

  const handleResolveError = async () => {
    if (!selectedError) return;

    const result = await resolveError(selectedError.id, {
      resolved: true,
      resolutionNotes: "Resolved from analytics view",
      resolvedBy: "admin",
    });

    if (result) {
      onClose();
    }
  };

  if (error) {
    return (
      <Card className="max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl bg-sidebar">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-3 text-xl">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              Error Loading Details
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (errorDetailLoading) {
    return (
      <Card className="max-w-6xl w-full shadow-2xl bg-sidebar">
        <CardContent className="p-8">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-muted-foreground/20 border-t-muted-foreground"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedError) {
    return (
      <Card className="max-w-6xl w-full shadow-2xl bg-sidebar">
        <CardContent className="p-8">
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg">Error details not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-6xl w-full">
      {/* Header */}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-3 text-xl">
              {selectedError.resolved ? (
                <CheckCheck className="size-6 text-primary" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600" />
              )}
              {selectedError.message}
            </CardTitle>

            <CardDescription className="mt-2 text-muted-foreground flex items-center gap-4">
              <span className="text-sm flex items-center gap-2">
                <CalendarClock className="size-4" />
                {formatActivityTimestamp(selectedError.createdAt, true)}
              </span>
              <Badge
                variant={
                  selectedError.level === "CRITICAL"
                    ? "destructive"
                    : selectedError.level === "ERROR"
                      ? "destructive"
                      : selectedError.level === "WARNING"
                        ? "secondary"
                        : "default"
                }
                className="text-xs rounded-2xl px-3"
              >
                {selectedError.level}
              </Badge>
              <Badge
                variant={selectedError.resolved ? "default" : "destructive"}
                className="text-xs rounded-2xl px-3"
              >
                {selectedError.resolved ? "Resolved" : "Open"}
              </Badge>
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="p-8 pt-0 space-y-8">
        {/* Basic Info - Always visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <Label className="text-sm font-semibold  items-center text-muted-foreground block mb-2">
              <Layers2 className="w-4 h-4 inline-block mr-2 mb-1" />
              Category
            </Label>
            <p className="text-sm font-medium">{selectedError.category}</p>
          </div>

          {selectedError.action && (
            <div className="bg-muted/50 rounded-lg p-4">
              <Label className="text-sm font-semibold text-muted-foreground block mb-2">
                <Hammer className="w-4 h-4 inline-block mr-2 mb-1" />
                Action
              </Label>
              <p className="text-sm">{selectedError.action}</p>
            </div>
          )}

          {selectedError.userId && (
            <div className="bg-muted/50 rounded-lg p-4">
              <label className="text-sm font-semibold text-muted-foreground flex items-center mb-2">
                <User className="w-4 h-4 inline-block mr-2 mb-1" />
                User ID
              </label>
              <p className="text-sm font-mono break-all">
                {selectedError.userId}
              </p>
            </div>
          )}
        </div>

        {/* Stack Trace - Expandable */}
        {selectedError.stackTrace && (
          <ExpandableSection
            title="Stack Trace"
            icon={<Code className="w-5 h-5 text-red-600" />}
            defaultExpanded={false}
          >
            <pre className="text-xs bg-slate-900 dark:bg-slate-800 text-green-400 p-4 rounded-xl overflow-x-auto shadow-inner">
              {selectedError.stackTrace}
            </pre>
          </ExpandableSection>
        )}

        {/* Context - Expandable */}
        {selectedError.context && (
          <ExpandableSection
            title="Context Data"
            icon={<Code className="w-5 h-5" />}
            defaultExpanded={false}
          >
            <ContextDisplay data={selectedError.context} />
          </ExpandableSection>
        )}

        {/* Metadata - Expandable */}
        <ExpandableSection
          title="Metadata"
          icon={<Hash className="w-5 h-5" />}
          defaultExpanded={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedError.errorCode && (
              <div className="bg-muted/20 rounded-lg p-4">
                <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4" />
                  Error Code
                </label>
                <p className="text-sm font-mono bg-muted/50 px-3 py-2 rounded">
                  {selectedError.errorCode}
                </p>
              </div>
            )}

            <div className="bg-muted/20 rounded-lg p-4">
              <label className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4" />
                Created At
              </label>
              <p className="text-sm bg-muted/50 px-3 py-2 rounded">
                {formatActivityTimestamp(selectedError.createdAt)}
              </p>
            </div>
          </div>
        </ExpandableSection>

        {/* System Info - Expandable */}
        {(selectedError.vscodeVersion ||
          selectedError.extensionVersion ||
          selectedError.operatingSystem) && (
          <ExpandableSection
            title="System Information"
            icon={<Monitor className="w-5 h-5 text-muted-foreground" />}
            defaultExpanded={false}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/20 p-6 rounded-xl">
              {selectedError.vscodeVersion && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    VS Code
                  </div>
                  <div className="text-sm font-mono">
                    {selectedError.vscodeVersion}
                  </div>
                </div>
              )}
              {selectedError.extensionVersion && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    Extension
                  </div>
                  <div className="text-sm font-mono">
                    {selectedError.extensionVersion}
                  </div>
                </div>
              )}
              {selectedError.operatingSystem && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">
                    OS
                  </div>
                  <div className="text-sm font-mono">
                    {selectedError.operatingSystem}
                  </div>
                </div>
              )}
            </div>
          </ExpandableSection>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-6">
          {!selectedError.resolved && (
            <Button
              onClick={handleResolveError}
              disabled={isResolving}
              className="px-6 py-2 flex items-center gap-2 shadow-lg"
            >
              {isResolving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Mark as Resolved
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ErrorDetailsView;
