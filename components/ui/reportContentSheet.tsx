import React from "react";
import ReportReasonSheet from "@/components/chat/reportReasonSheet";
import { reportService, ReportableContentType } from "@/service/report.service";
import { showError, showSuccess } from "@/components/ui/toast";

interface ReportContentSheetProps {
  visible: boolean;
  targetType: ReportableContentType;
  targetId: string | undefined;
  /** Shown in the title, e.g. "story" or "listing". */
  subject: string;
  onClose: () => void;
}

/** Reason picker that files a report for a story, listing or document. */
export default function ReportContentSheet({
  visible,
  targetType,
  targetId,
  subject,
  onClose,
}: ReportContentSheetProps) {
  const handleSelect = async (reason: string) => {
    onClose();
    if (!targetId) return;
    try {
      await reportService.reportContent(targetType, targetId, reason);
      showSuccess("Report sent. Thanks, our team will review it.");
    } catch (err: any) {
      showError(err?.response?.data?.message || "Couldn't send the report. Please try again.");
    }
  };

  return (
    <ReportReasonSheet visible={visible} subject={subject} onSelect={handleSelect} onClose={onClose} />
  );
}
