import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ErrorDetailsView from "./ErrorDetailsView";
import ErrorCharts from "../../components/ErrorCharts";
import ErrorsTable from "../../components/ErrorsTable";

interface ErrorAnalyticsViewProps {
  description?: string;
}

const ErrorAnalyticsView = ({ description }: ErrorAnalyticsViewProps) => {
  const [selectedErrorId, setSelectedErrorId] = useState<string | null>(null);

  const handleBackToList = () => {
    setSelectedErrorId(null);
  };

  const handleErrorSelect = (errorId: string) => {
    setSelectedErrorId(errorId);
  };

  if (selectedErrorId) {
    return (
      <div className="min-h-screen overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Back Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleBackToList}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Error List
            </Button>
          </div>

          {/* Error Details Card */}
          <div className="w-full">
            <ErrorDetailsView
              errorId={selectedErrorId}
              onClose={handleBackToList}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex w-full justify-between gap-6 items-center">
          <p className="text-sm text-muted-foreground hidden md:block">
            {description}
          </p>
        </div>

        {/* Charts Component */}
        <ErrorCharts />

        {/* Table Component */}
        <ErrorsTable onErrorSelect={handleErrorSelect} />
      </div>
    </div>
  );
};

export default ErrorAnalyticsView;
