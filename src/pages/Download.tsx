import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { CLOVER, Header, Paragraph, Title } from "../components/ui/text";
import {
  ArrowRight,
  Check,
  Copy,
  DownloadIcon,
  ExternalLink,
} from "lucide-react";
import Footer from "@/components/Footer";

/**
 * CopyButton component that allows users to copy text to the clipboard.
 * @param text - The text to be copied to the clipboard.
 * @returns {JSX.Element} The CopyButton component.
 */
export const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500); // Reset after 1.5s
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm 
                 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                 border border-gray-300 dark:border-gray-600 rounded-lg 
                 text-gray-700 dark:text-gray-300 font-mono transition-all duration-200
                 hover:scale-105 active:scale-95"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
      <span className="select-all">{copied ? "Copied!" : text}</span>
    </button>
  );
};

/**
 * Download component that provides options for downloading the CLOVER extension.
 * Includes a link to a getting started guide
 * and options for installation from the VS Code, VS Code Marketplace or manual installation.
 * @returns {JSX.Element} The Download component.
 */
const Download = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-32 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Hero Content */}
          <div className="mb-12">
            <Title
              className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-[#50B498] to-[#F59E0B] 
                           bg-clip-text text-transparent mb-6"
            >
              Download <CLOVER />
            </Title>
            <Paragraph className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Get started with CLOVER, the AI-powered coding assistant for
              Visual Studio Code. Choose the installation method that works best
              for you.
            </Paragraph>
          </div>

          {/* Getting Started Link */}
          <div className="mb-16">
            <a
              href="/getting-started"
              className="inline-flex items-center gap-2 px-6 py-3 
                         text-[#50B498] dark:text-[#9CDBA6] hover:text-[#3a8a73] dark:hover:text-[#50B498]
                         bg-[#50B498]/10 dark:bg-[#50B498]/20 hover:bg-[#50B498]/20 dark:hover:bg-[#50B498]/30
                         border border-[#50B498]/30 dark:border-[#50B498]/50 rounded-xl
                         transition-all duration-200 hover:scale-105 font-medium"
            >
              <span>Need help? View the full setup guide</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          {/* Download Options */}
          <div className="mb-12">
            <Header className="text-3xl font-semibold text-gray-900 dark:text-white mb-4">
              Download Options
            </Header>
            <div className="w-24 h-1 bg-gradient-to-r from-[#50B498] to-[#F59E0B] rounded-full mx-auto"></div>
          </div>

          {/* Installation Cards */}
          <div className="grid gap-8 max-w-4xl mx-auto">
            {/* VS Code Installation Card */}
            <Card
              className="relative overflow-hidden border-0 shadow-xl 
                           bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                           hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#50B498]/5 to-[#F59E0B]/5"></div>
              <div className="relative p-8">
                <div
                  className="flex items-center justify-center w-16 h-16 mx-auto mb-6
                               bg-gradient-to-r from-[#50B498] to-[#9CDBA6] rounded-2xl"
                >
                  <DownloadIcon className="w-8 h-8 text-white" />
                </div>

                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Install for VS Code
                </CardTitle>

                <CardContent className="space-y-6">
                  <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                    Install CLOVER directly from VS Code or the VS Code
                    Marketplace.
                  </CardDescription>

                  <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                    <Button
                      className="w-full sm:w-auto bg-gradient-to-r from-[#50B498] to-[#9CDBA6] 
                                     hover:from-[#3a8a73] hover:to-[#50B498] 
                                     text-white font-semibold py-3 px-8 rounded-xl
                                     transition-all duration-200 hover:scale-105 hover:shadow-lg
                                     border-0"
                    >
                      <Link
                        to="vscode:extension/capstone-team-2.temple-capstone-clover"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <span>Open in VS Code</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>

                    <Button
                      className="w-full sm:w-auto bg-gradient-to-r from-[#F59E0B] to-[#F59E0B] 
                                     hover:from-[#d97706] hover:to-[#d97706] 
                                     text-white font-semibold py-3 px-8 rounded-xl
                                     transition-all duration-200 hover:scale-105 hover:shadow-lg
                                     border-0"
                    >
                      <Link
                        to="https://marketplace.visualstudio.com/items?itemName=capstone-team-2.temple-capstone-clover"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <span>VS Code Marketplace</span>
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Manual Installation Card */}
            <Card
              className="relative overflow-hidden border-0 shadow-xl 
                           bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
                           hover:shadow-2xl transition-all duration-300 hover:scale-105
                           opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#9CDBA6]/5 to-[#50B498]/5"></div>
              <div className="relative p-8">
                <div
                  className="flex items-center justify-center w-16 h-16 mx-auto mb-6
                               bg-gradient-to-r from-[#9CDBA6] to-[#50B498] rounded-2xl"
                >
                  <DownloadIcon className="w-8 h-8 text-white" />
                </div>

                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Manual Installation
                </CardTitle>

                <CardContent className="space-y-6">
                  <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
                    Download the VSIX file and install it manually in VS Code.
                  </CardDescription>

                  <div className="text-center">
                    <span
                      className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-700 
                                   text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium"
                    >
                      Coming Soon
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      After downloading, install using:
                    </p>
                    <CopyButton text="code --install-extension clover.vsix" />
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Download;
