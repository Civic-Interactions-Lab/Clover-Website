import { getConsentForm } from "@/api/consent";
import ModalContainer from "@/components/ModalContainer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ConsentFormPreview from "./ConsentFormPreview";
import { toast } from "sonner";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConsentChange: (consented: boolean) => void;
  onConsentViewed: () => void;
  initialConsent: boolean;
}

const ConsentForm = ({
  isOpen,
  onClose,
  onConsentChange,
  onConsentViewed,
  initialConsent,
}: ConsentModalProps) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [localConsent, setLocalConsent] = useState(initialConsent);
  const [consentFormData, setConsentFormData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConsentForm = async () => {
      if (!isOpen) return;

      setLoading(true);

      try {
        const { consentForm, error } = await getConsentForm();

        if (error) {
          toast.error("Failed to load consent form");
          console.error("Error fetching consent form:", error);
          onClose(); // Close modal if there's an error
          return;
        }

        if (!consentForm) {
          toast.error("No consent form available");
          onClose();
          return;
        }

        setConsentFormData(consentForm);
        console.log("Consent Form:", JSON.stringify(consentForm, null, 2));
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        toast.error(errorMessage);
        console.error("Unexpected error:", err);
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchConsentForm();
  }, [isOpen, onClose]);

  // Reset scroll state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setLocalConsent(initialConsent);
    }
  }, [isOpen, initialConsent]);

  // Show loading state
  if (loading || !consentFormData) {
    return (
      <ModalContainer
        isOpen={isOpen}
        onClose={onClose}
        className="!bg-transparent"
      >
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" />
          </div>
        </div>
      </ModalContainer>
    );
  }

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleConsentToggle = (checked: boolean) => {
    if (!hasScrolledToBottom) return;
    setLocalConsent(checked);
  };

  const handleConfirm = () => {
    onConsentViewed();
    onConsentChange(localConsent);
    onClose();
  };

  return (
    <ModalContainer isOpen={isOpen} onClose={onClose}>
      <Card className="max-w-2xl w-full max-h-[80vh] flex flex-col shadow-xl py-0 overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-row justify-between items-start space-y-0 pb-6">
          <div className="flex-1">
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              {consentFormData.title}
            </CardTitle>
            <CardDescription className="mt-1">
              {consentFormData.subtitle}
            </CardDescription>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 ml-4"
          >
            <X size={20} />
          </button>
        </CardHeader>

        {/* Scrollable Content */}
        <CardContent
          className="flex-1 overflow-y-auto p-0 bg-white dark:bg-transparent"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          <div className="h-full overflow-y-auto p-6">
            <ConsentFormPreview
              consentFormData={consentFormData}
              showHeader={false}
            />
          </div>
        </CardContent>

        {/* Footer with consent checkbox and buttons */}
        <CardFooter className="border-t border-gray-200 dark:border-gray-700 flex-col space-y-4 p-6">
          {!hasScrolledToBottom && (
            <div className="w-full text-center text-sm text-amber-600 dark:text-amber-400">
              Please read through the entire consent form above to continue.
            </div>
          )}

          <div className="w-full flex items-start space-x-3">
            <Checkbox
              id="modal-consent"
              checked={localConsent}
              onCheckedChange={handleConsentToggle}
              disabled={!hasScrolledToBottom}
              className="mt-1"
            />
            <Label
              htmlFor="modal-consent"
              className={`text-sm leading-relaxed cursor-pointer ${
                hasScrolledToBottom
                  ? "text-gray-700 dark:text-gray-300"
                  : "text-gray-400 dark:text-gray-600 cursor-not-allowed"
              }`}
            >
              I have read and understood the consent form above. I consent to
              Clover using the data collected from my usage for research
              purposes only.
            </Label>
          </div>

          <div className="w-full flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="px-6">
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!hasScrolledToBottom}
              className="px-6"
            >
              Confirm
            </Button>
          </div>
        </CardFooter>
      </Card>
    </ModalContainer>
  );
};

export default ConsentForm;
