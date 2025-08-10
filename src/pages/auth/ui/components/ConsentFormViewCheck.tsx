import React, { useState } from "react";
import { Glasses } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ConsentForm from "./ConsentForm";

interface ConsentFormViewCheckProps {
  isConsent: boolean;
  onConsentChange: (consented: boolean) => void;
  onConsentViewed?: (hasViewed: boolean) => void; // New callback for viewed state
  disabled?: boolean;
  className?: string;
  showViewButton?: boolean;
  checkboxLabel?: string;
}

const ConsentFormViewCheck = ({
  isConsent,
  onConsentChange,
  onConsentViewed,
  disabled = false,
  className = "",
  showViewButton = true,
  checkboxLabel = "I consent to Clover using the data collected from my usage for research purposes only.",
}: ConsentFormViewCheckProps) => {
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [hasViewedConsent, setHasViewedConsent] = useState(false);

  const handleOpenConsentModal = () => {
    setIsConsentModalOpen(true);
  };

  const handleCloseConsentModal = () => {
    setIsConsentModalOpen(false);
  };

  const handleConsentViewed = () => {
    setHasViewedConsent(true);
    // Notify parent component that consent has been viewed
    if (onConsentViewed) {
      onConsentViewed(true);
    }
  };

  const handleConsentModalChange = (consented: boolean) => {
    onConsentChange(consented);
  };

  const isCheckboxDisabled = disabled || (!hasViewedConsent && showViewButton);

  return (
    <>
      <div className={`space-y-3 ${className}`}>
        {showViewButton && (
          <div className="space-y-2 w-full justify-center items-center flex flex-col">
            <button
              type="button"
              onClick={handleOpenConsentModal}
              className="text-sm text-primary hover:text-primary/80 hover:underline flex items-center gap-1"
            >
              <Glasses className="h-4 w-4" /> View consent form
              {hasViewedConsent && <span className="text-green-600">✓</span>}
            </button>
            {!hasViewedConsent && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Please review the consent form to continue
              </p>
            )}
          </div>
        )}

        <div className="flex items-start space-x-3">
          <Checkbox
            id="consent"
            checked={isConsent}
            onCheckedChange={(checked) => onConsentChange(!!checked)}
            disabled={isCheckboxDisabled}
            className="mt-1"
          />
          <Label
            htmlFor="consent"
            className={`text-sm cursor-pointer leading-relaxed ${
              isCheckboxDisabled
                ? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            {checkboxLabel}
          </Label>
        </div>
      </div>

      {/* Consent Modal */}
      <ConsentForm
        isOpen={isConsentModalOpen}
        onClose={handleCloseConsentModal}
        onConsentChange={handleConsentModalChange}
        onConsentViewed={handleConsentViewed}
        initialConsent={isConsent}
      />
    </>
  );
};

export default ConsentFormViewCheck;
