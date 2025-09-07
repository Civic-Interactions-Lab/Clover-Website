import {
  getUserDiffsByTime,
  RenderedStep,
  UserDiffsResponse,
} from "@/api/suggestion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Diff, Hunk, parseDiff } from "react-diff-view";
import "react-diff-view/style/index.css";

export default function DiffTimeline() {
  const [diffs, setDiffs] = useState<UserDiffsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiffs = async () => {
      const { data, error } = await getUserDiffsByTime(
        "462a5708-0bad-451b-aae4-e289a2df7899",
        "2025-09-01T00:00:00Z",
        "2025-09-04T23:59:59Z"
      );

      if (error) {
        setError(error);
      } else if (data) {
        setDiffs(data);
      }
    };

    fetchDiffs();
  }, []);

  const timeline = useMemo(() => {
    if (!diffs) return [];

    const all: {
      groupId: string;
      step: RenderedStep;
      prompt: string;
      resetFile: boolean;
    }[] = [];
    let lastPrompt: string | null = null;

    for (const g of diffs.groups) {
      for (const s of g.steps) {
        const normalizedPrompt = g.prompt.trim();
        const resetFile =
          lastPrompt !== null && normalizedPrompt !== lastPrompt;

        all.push({
          groupId: g.groupId,
          step: s,
          prompt: normalizedPrompt,
          resetFile,
        });

        lastPrompt = normalizedPrompt;
      }
    }

    return all;
  }, [diffs]);

  const [stepIndex, setStepIndex] = useState(0);

  if (timeline.length === 0) {
    return <p>No diffs available</p>;
  }

  const { groupId, step } = timeline[stepIndex];
  const [diff] = parseDiff(step.diff);

  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!diffs) return <p>Loading diffs…</p>;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Group {groupId}</CardTitle>
          </CardHeader>
          <Badge className="m-4 bg-secondary" variant="secondary">
            {}
          </Badge>

          <CardContent>
            <div className="flex items-center justify-between">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={stepIndex === 0}
                    onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous Step</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous Step</TooltipContent>
              </Tooltip>

              <div className="text-center text-sm text-muted-foreground">
                <div>
                  Step {stepIndex + 1} of {timeline.length}
                </div>
                <div className="flex items-center space-x-2 justify-center mt-1">
                  <Badge className="bg-primary" variant="secondary">
                    {step.event}
                  </Badge>
                  {step.shownBug && (
                    <Badge variant="destructive">Bug Shown</Badge>
                  )}
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={stepIndex === timeline.length - 1}
                    onClick={() =>
                      setStepIndex((i) => Math.min(i + 1, timeline.length - 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next Step</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next Step</TooltipContent>
              </Tooltip>
            </div>
            <div className="rounded-md border bg-muted/20 dark:bg-muted/30 overflow-hidden">
              <Diff
                viewType="split"
                diffType={diff.type || "modify"}
                hunks={diff.hunks}
              >
                {(hunks) =>
                  hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
                }
              </Diff>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between"></CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
}
