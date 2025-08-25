import { Link } from "react-router-dom";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { CLOVER, Header, Paragraph, Title } from "../components/ui/text";
import { Button } from "../components/ui/button";

/**
 * Landing component for the CLOVER website.
 * @returns {JSX.Element} The landing page component.
 *
 */

export const Landing = () => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center width-container mx-auto px-8">
      {/* Hero Section */}
      <section className="max-w-6xl mt-24 flex flex-col items-center justify-center text-center px-6 pb-12">
        <br />
        <Title>
          Welcome to <CLOVER />
        </Title>
        <Paragraph>
          CLOVER is an AI-powered code assistant designed to help beginner
          programmers improve their skills. Unlike traditional tools, CLOVER
          tracks mistakes, encourages reflection, and reduces over-reliance on
          AI-generated code.
        </Paragraph>

        <br />

        {/* Features Section */}
        <Header>Why Choose CLOVER?</Header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10 text-center">
          <Card>
            <CardTitle>Smart Inline Suggestions</CardTitle>
            <CardContent>
              Get real-time coding suggestions, including correct and incorrect
              options to encourage critical thinking.
            </CardContent>
          </Card>
          <Card>
            <CardTitle>AI-Powered Learning</CardTitle>
            <CardContent>
              Ask questions about code snippets, get explanations, and track
              learning patterns in real time.
            </CardContent>
          </Card>
          <Card>
            <CardTitle>Mistake Recognition & Insights</CardTitle>
            <CardContent>
              Monitor response times, correctness, and frequently asked
              questions to track progress.
            </CardContent>
          </Card>
          <Card>
            <CardTitle>Instructor Dashboard</CardTitle>
            <CardContent>
              Instructors can review student progress, identify common errors,
              and provide targeted interventions.
            </CardContent>
          </Card>
          <Card>
            <CardTitle>Seamless IDE Integration</CardTitle>
            <CardContent>
              CLOVER works directly inside Visual Studio Code with minimal
              disruption to workflow.
            </CardContent>
          </Card>
          <Card>
            <CardTitle>Statistics Portal</CardTitle>
            <CardContent>
              Users can review their coding habits, improve performance, and
              refine problem-solving skills.
            </CardContent>
          </Card>
        </div>

        <br />

        {/* Call-to-Action */}
        <Header>Start Learning with AI Today</Header>
        <Paragraph>
          Whether you're a beginner learning to code or an instructor looking
          for insights, CLOVER is the perfect tool for guided AI-assisted
          learning.
        </Paragraph>

        <Button className="p-6 mt-6 text-text">
          <Link to="/download" className="text-lg">
            Download CLOVER
          </Link>
        </Button>
      </section>
    </div>
  );
};

export default Landing;
