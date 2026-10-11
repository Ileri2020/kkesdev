import { StudentAIAssistant } from "@/components/student/ai-assistant";
import { StudentLayout, StudentSection } from "@/components/student/student-layout";

export default function StudentAIAssistantPage() {
  return (
    <StudentLayout title="AI study assistant">
      <StudentSection
        eyebrow="Personalised study support"
        title="Learn with an AI tutor"
        description="Get clear, step-by-step help with school subjects and exam preparation."
      >
        <StudentAIAssistant />
      </StudentSection>
    </StudentLayout>
  );
}
