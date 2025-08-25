import { useState, useEffect } from "react";
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
  ArrowLeft,
  Bug,
  FileText,
  Clock,
} from "lucide-react";
import { useResolveError } from "@/pages/dashboard/hooks/useErrors";
import { Label } from "@/components/ui/label";
import { formatLastActivityTime } from "@/utils/timeConverter";
import { ErrorLog } from "@/types/error";
import { getErrorById } from "@/api/errors";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import Loading from "@/components/Loading";

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
    <div className="space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors group"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-lg font-semibold text-left">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
        )}
      </button>

      {isExpanded && (
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">{children}</div>
        </div>
      )}
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

  const isValidObject = (value: any): boolean => {
    return (
      value !== null &&
      value !== undefined &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof RegExp)
    );
  };

  const renderValue = (value: any, key: string = ""): React.ReactNode => {
    // Handle null and undefined
    if (value === null || value === undefined) {
      return (
        <span className="text-gray-500 dark:text-gray-400 italic">
          {value === null ? "null" : "undefined"}
        </span>
      );
    }

    // Handle boolean values
    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"} className="text-xs">
          {value.toString()}
        </Badge>
      );
    }

    // Handle numbers
    if (typeof value === "number") {
      return (
        <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
          {value.toString()}
        </span>
      );
    }

    // Handle Date objects
    if (value instanceof Date) {
      return (
        <span className="text-sm bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
          {value.toISOString()}
        </span>
      );
    }

    // Handle functions
    if (typeof value === "function") {
      return (
        <span className="text-sm bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded italic">
          [Function: {value.name || "anonymous"}]
        </span>
      );
    }

    // Handle arrays
    if (Array.isArray(value)) {
      const isExpanded = expandedKeys.has(key);
      return (
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
            onClick={() => toggleKey(key)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            )}
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Array ({value.length} items)
            </span>
          </div>
          {isExpanded && (
            <div className="space-y-2 bg-gray-100 dark:bg-gray-700 rounded-md p-3 ml-4">
              {value.length === 0 ? (
                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Empty array
                </span>
              ) : (
                value.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap min-w-fit">
                      [{index}]:
                    </span>
                    <div className="flex-1">
                      {renderValue(item, `${key}[${index}]`)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    }

    // Handle objects (including nested objects)
    if (isValidObject(value)) {
      const isExpanded = expandedKeys.has(key);
      const objectKeys = Object.keys(value);

      return (
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded transition-colors"
            onClick={() => toggleKey(key)}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            )}
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {objectKeys.length} properties
            </span>
          </div>
          {isExpanded && (
            <div className="space-y-2 ml-4 pl-4 border-l border-gray-200 dark:border-gray-600">
              {objectKeys.length === 0 ? (
                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Empty object
                </span>
              ) : (
                objectKeys.map((nestedKey) => (
                  <div key={nestedKey} className="flex items-start gap-4">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded whitespace-nowrap min-w-fit">
                      {nestedKey}:
                    </span>
                    <div className="flex-1">
                      {renderValue(value[nestedKey], `${key}.${nestedKey}`)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    }

    // Handle primitive values (strings, etc.)
    const stringValue = String(value);

    // Handle empty strings
    if (stringValue === "") {
      return (
        <span className="text-gray-500 dark:text-gray-400 italic">
          Empty string
        </span>
      );
    }

    // Handle long strings or multi-line strings
    if (stringValue.length > 60 || stringValue.includes("\n")) {
      return (
        <div className="bg-slate-900 dark:bg-slate-800 text-green-400 rounded-lg p-3 text-sm font-mono overflow-x-auto">
          <pre className="whitespace-pre-wrap">{stringValue}</pre>
        </div>
      );
    }

    // Handle regular strings
    return (
      <span className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
        {stringValue}
      </span>
    );
  };

  if (!data) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl p-6 text-center">
        <span className="text-gray-500 dark:text-gray-400 italic">
          No context data available
        </span>
      </div>
    );
  }

  const dataKeys = Object.keys(data);
  if (dataKeys.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl p-6 text-center">
        <span className="text-gray-500 dark:text-gray-400 italic">
          Empty context
        </span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800/20 rounded-xl p-6 space-y-4">
      {dataKeys.map((key) => (
        <div key={key} className="flex items-start gap-4">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg whitespace-nowrap min-w-fit">
            {key}:
          </span>
          <div className="flex-1">{renderValue(data[key], key)}</div>
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

  const handleGoBack = () => {
    onClose();
  };

  const isResolved = selectedError?.resolved;
  const isCritical =
    selectedError?.level === "CRITICAL" || selectedError?.level === "ERROR";

  return (
    <>
      <div className="min-h-screen py-6 px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Error Details
              </h1>
            </div>

            {selectedError && (
              <div className="flex items-center gap-3">
                <Badge
                  variant={isResolved ? "default" : "destructive"}
                  className="px-3 py-1 text-sm font-medium rounded-2xl"
                >
                  {isResolved ? "Resolved" : "Open"}
                </Badge>
                <Badge
                  variant={
                    selectedError.level === "CRITICAL" ||
                    selectedError.level === "ERROR"
                      ? "destructive"
                      : selectedError.level === "WARNING"
                        ? "secondary"
                        : "default"
                  }
                  className="px-3 py-1 text-sm font-medium rounded-2xl"
                >
                  {selectedError.level}
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          {errorDetailLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loading size="lg" text="Loading error details..." />
            </div>
          ) : error ? (
            <div className="text-red-500 p-8 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800 text-center">
              <Bug className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Error Loading Details
              </h3>
              <p>{error}</p>
            </div>
          ) : selectedError ? (
            <div className="space-y-12">
              {/* Error Message Section */}
              <section>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    {isResolved ? (
                      <CheckCheck className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                    <h3 className="text-lg font-semibold">Error Message</h3>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-xl border border-red-200 dark:border-red-800 overflow-hidden">
                    <div className="p-6">
                      <p className="text-red-800 dark:text-red-200 text-lg font-medium">
                        {selectedError.message}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Metadata Grid */}
              <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium">Date Created</span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-200 font-mono">
                    {formatLastActivityTime(selectedError.createdAt, false)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                    <Layers2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Category</span>
                  </div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {selectedError.category}
                  </p>
                </div>

                {selectedError.action && (
                  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                      <Hammer className="w-4 h-4" />
                      <span className="text-sm font-medium">Action</span>
                    </div>
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {selectedError.action}
                    </p>
                  </div>
                )}

                {selectedError.userId && (
                  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">User ID</span>
                    </div>
                    <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                      {selectedError.userId}
                    </p>
                  </div>
                )}

                {selectedError.errorCode && (
                  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                      <Hash className="w-4 h-4" />
                      <span className="text-sm font-medium">Error Code</span>
                    </div>
                    <p className="text-sm font-mono font-semibold text-red-600 dark:text-red-400">
                      {selectedError.errorCode}
                    </p>
                  </div>
                )}

                {(selectedError.vscodeVersion ||
                  selectedError.extensionVersion ||
                  selectedError.operatingSystem) && (
                  <div className="bg-white dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 text-gray-600 dark:text-gray-400">
                      <Monitor className="w-4 h-4" />
                      <span className="text-sm font-medium">System Info</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-800 dark:text-gray-200">
                      {selectedError.vscodeVersion && (
                        <div>VS Code: {selectedError.vscodeVersion}</div>
                      )}
                      {selectedError.extensionVersion && (
                        <div>Ext: {selectedError.extensionVersion}</div>
                      )}
                      {selectedError.operatingSystem && (
                        <div>OS: {selectedError.operatingSystem}</div>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* Expandable Sections */}
              <section className="space-y-6">
                {selectedError.stackTrace && (
                  <ExpandableSection
                    title="Stack Trace"
                    icon={
                      <Code className="w-5 h-5 text-red-600 dark:text-red-400" />
                    }
                  >
                    <pre className="text-xs bg-slate-900 dark:bg-slate-800 text-green-400 p-4 rounded-xl overflow-x-auto shadow-inner font-mono whitespace-pre-wrap">
                      {selectedError.stackTrace}
                    </pre>
                  </ExpandableSection>
                )}

                {selectedError.context && (
                  <ExpandableSection
                    title="Context Data"
                    icon={
                      <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    }
                  >
                    <ContextDisplay data={selectedError.context} />
                  </ExpandableSection>
                )}
              </section>

              {/* Actions */}
              {!isResolved && (
                <section className="flex justify-end">
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
                </section>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 p-12">
              <Bug className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No error details available</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ErrorDetailsView;
