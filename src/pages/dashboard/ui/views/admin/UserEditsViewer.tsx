import {
  getUserDiffsByTime,
  RenderedStep,
  UserDiffsResponse,
} from "@/api/suggestion";
import { Button } from "@/components/ui/button";
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
    const all: { groupId: string; step: RenderedStep; prompt: string }[] = [];
    for (const g of diffs.groups) {
      for (const s of g.steps) {
        all.push({ groupId: g.groupId, step: s, prompt: g.prompt });
      }
    }
    return all;
  }, [diffs]);

  const [stepIndex, setStepIndex] = useState(0);

  if (timeline.length === 0) {
    return <p>No diffs available</p>;
  }

  const { groupId, step, prompt } = timeline[stepIndex];
  const [diff] = parseDiff(step.diff);

  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!diffs) return <p>Loading diffs…</p>;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Group {groupId}</h2>
      <pre className="text-xs bg-gray-50 p-2 rounded mb-4 overflow-auto">
        {prompt}
      </pre>

      <div className="flex justify-between items-center mb-2">
        <button
          disabled={stepIndex === 0}
          onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          ← Previous
        </button>

        <div>
          Step {stepIndex + 1} of {timeline.length} — event:{" "}
          <strong>{step.event}</strong> {step.shownBug ? "(bug shown)" : ""}
        </div>

        <button
          disabled={stepIndex === timeline.length - 1}
          onClick={() =>
            setStepIndex((i) => Math.min(i + 1, timeline.length - 1))
          }
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
        >
          Next →
        </button>
      </div>

      <Diff viewType="split" diffType="modify" hunks={diff.hunks}>
        {(hunks) => hunks.map((h) => <Hunk key={h.content} hunk={h} />)}
      </Diff>
    </div>
  );
}
