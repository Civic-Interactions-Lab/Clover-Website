import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

interface SurveyData {
  username: string;
  pid: string;
  gradeLevel: string;
  programmingExperience: string;
  aiConceptsFamiliarity: string;
  generativeAiFamiliarity: string;
  aiAgentsFamiliarity: string;
  aiTrust: string;
  aiPotentialPerception: string;
  aiUsageFrequency: string;
  aiCodingReliance: string;
  aiProblemSolvingEngagement: string;
}

const PreSurveyView = () => {
  const [surveyData, setSurveyData] = useState<SurveyData>({
    username: "",
    pid: "",
    gradeLevel: "",
    programmingExperience: "",
    aiConceptsFamiliarity: "",
    generativeAiFamiliarity: "",
    aiAgentsFamiliarity: "",
    aiTrust: "",
    aiPotentialPerception: "",
    aiUsageFrequency: "",
    aiCodingReliance: "",
    aiProblemSolvingEngagement: "",
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get("username") || "";
    const pid = urlParams.get("pid") || "";

    setSurveyData((prev) => ({
      ...prev,
      username,
      pid,
    }));
  }, []);

  const handleInputChange = (field: keyof SurveyData, value: string) => {
    setSurveyData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Survey Data:", surveyData);
    // Handle form submission here
  };

  const likertOptions = [
    { value: "1", label: "Not at all" },
    { value: "2", label: "Slightly" },
    { value: "3", label: "Moderately" },
    { value: "4", label: "Very" },
    { value: "5", label: "Extremely" },
  ];

  const frequencyOptions = [
    { value: "1", label: "Never" },
    { value: "2", label: "Rarely" },
    { value: "3", label: "Sometimes" },
    { value: "4", label: "Often" },
    { value: "5", label: "Very frequently" },
  ];

  const gradeOptions = [
    { value: "freshman", label: "Freshman" },
    { value: "sophomore", label: "Sophomore" },
    { value: "junior", label: "Junior" },
    { value: "senior", label: "Senior" },
    { value: "graduate", label: "Graduate" },
  ];

  const programmingExperienceOptions = [
    { value: "1", label: "No experience" },
    { value: "2", label: "Beginner" },
    { value: "3", label: "Intermediate" },
    { value: "4", label: "Advanced" },
    { value: "5", label: "Very experienced" },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg bg-gray-900">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Pre-Survey Questions for Study Contexts 1 & 2
            </CardTitle>
            <CardDescription className="text-gray-300 mt-2">
              Please complete all sections below to proceed with the study
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* User Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={surveyData.username}
                    disabled
                    className="border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pid" className="text-sm font-medium">
                    Participant ID
                  </Label>
                  <Input
                    id="pid"
                    value={surveyData.pid}
                    disabled
                    className="border"
                  />
                </div>
              </div>

              <Separator className="bg-gray-400" />

              {/* Demographic Questions */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Demographic Questions</h3>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    What is your grade level?
                  </Label>
                  <RadioGroup
                    value={surveyData.gradeLevel}
                    onValueChange={(value) =>
                      handleInputChange("gradeLevel", value)
                    }
                    className="grid grid-cols-2 md:grid-cols-5 gap-4"
                  >
                    {gradeOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`grade-${option.value}`}
                        />
                        <Label
                          htmlFor={`grade-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    What is your experience level with programming?
                  </Label>
                  <RadioGroup
                    value={surveyData.programmingExperience}
                    onValueChange={(value) =>
                      handleInputChange("programmingExperience", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-5 gap-4"
                  >
                    {programmingExperienceOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`prog-${option.value}`}
                        />
                        <Label
                          htmlFor={`prog-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <Separator />

              {/* AI Literacy */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">AI Literacy</h3>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    How familiar are you with A.I. Concepts and its
                    applications?
                  </Label>
                  <RadioGroup
                    value={surveyData.aiConceptsFamiliarity}
                    onValueChange={(value) =>
                      handleInputChange("aiConceptsFamiliarity", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-5 gap-4"
                  >
                    {likertOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`ai-concepts-${option.value}`}
                        />
                        <Label
                          htmlFor={`ai-concepts-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    How familiar are you with the term "Generative AI" in the
                    context of interactive design tasks?
                  </Label>
                  <RadioGroup
                    value={surveyData.generativeAiFamiliarity}
                    onValueChange={(value) =>
                      handleInputChange("generativeAiFamiliarity", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-5 gap-4"
                  >
                    {likertOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`gen-ai-${option.value}`}
                        />
                        <Label
                          htmlFor={`gen-ai-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    How familiar are you with AI agents that provide inline
                    suggestions (Copilot, JetBrains AI Assistant, Cursor, etc.)?
                  </Label>
                  <RadioGroup
                    value={surveyData.aiAgentsFamiliarity}
                    onValueChange={(value) =>
                      handleInputChange("aiAgentsFamiliarity", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-5 gap-4"
                  >
                    {likertOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`ai-agents-${option.value}`}
                        />
                        <Label
                          htmlFor={`ai-agents-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <Separator />

              {/* AI Trust/Baseline */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">AI Trust/Baseline</h3>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    How much do you trust AI?
                  </Label>
                  <RadioGroup
                    value={surveyData.aiTrust}
                    onValueChange={(value) =>
                      handleInputChange("aiTrust", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-5 gap-4"
                  >
                    {likertOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`ai-trust-${option.value}`}
                        />
                        <Label
                          htmlFor={`ai-trust-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    How do you perceive the potential of AI in solving design
                    problems?
                  </Label>
                  <RadioGroup
                    value={surveyData.aiPotentialPerception}
                    onValueChange={(value) =>
                      handleInputChange("aiPotentialPerception", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-5 gap-4"
                  >
                    {likertOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`ai-potential-${option.value}`}
                        />
                        <Label
                          htmlFor={`ai-potential-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <Separator />

              {/* Self-efficacy using AI */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">
                  Self-efficacy using AI
                </h3>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    How frequently do you use AI (ex: github copilot)?
                  </Label>
                  <RadioGroup
                    value={surveyData.aiUsageFrequency}
                    onValueChange={(value) =>
                      handleInputChange("aiUsageFrequency", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-5 gap-4"
                  >
                    {frequencyOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`ai-frequency-${option.value}`}
                        />
                        <Label
                          htmlFor={`ai-frequency-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    How much do you rely on AI for coding problems?
                  </Label>
                  <RadioGroup
                    value={surveyData.aiCodingReliance}
                    onValueChange={(value) =>
                      handleInputChange("aiCodingReliance", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-5 gap-4"
                  >
                    {likertOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`ai-coding-${option.value}`}
                        />
                        <Label
                          htmlFor={`ai-coding-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    How often do you engage in problem-solving activities using
                    AI in your daily life?
                  </Label>
                  <RadioGroup
                    value={surveyData.aiProblemSolvingEngagement}
                    onValueChange={(value) =>
                      handleInputChange("aiProblemSolvingEngagement", value)
                    }
                    className="grid grid-cols-1 md:grid-cols-5 gap-4"
                  >
                    {frequencyOptions.map((option) => (
                      <div
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <RadioGroupItem
                          value={option.value}
                          id={`ai-problem-${option.value}`}
                        />
                        <Label
                          htmlFor={`ai-problem-${option.value}`}
                          className="text-sm"
                        >
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              <Separator />

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <Button
                  type="submit"
                  size="lg"
                  className="px-8 py-3 text-lg font-medium"
                >
                  Submit Pre-Survey
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreSurveyView;
