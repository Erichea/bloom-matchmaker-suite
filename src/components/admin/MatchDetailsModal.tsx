import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X } from "lucide-react";
import type { ProfileAnswers } from "@/utils/compatibilityCalculator";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  primary_photo_url?: string | null;
}

interface Question {
  id: string;
  question_text_en: string;
  question_type: string;
}

interface MatchDetailsModalProps {
  open: boolean;
  onClose: () => void;
  clientProfile: Profile;
  matchProfile: Profile;
  compatibilityScore: number;
  clientAnswers: ProfileAnswers;
  matchAnswers: ProfileAnswers;
  questions: Question[];
  onAddMatch?: () => void;
}

export default function MatchDetailsModal({
  open,
  onClose,
  clientProfile,
  matchProfile,
  compatibilityScore,
  clientAnswers,
  matchAnswers,
  questions,
  onAddMatch,
}: MatchDetailsModalProps) {
  const clientName = `${clientProfile.first_name ?? ""} ${clientProfile.last_name ?? ""}`.trim() || "Client";
  const matchName = `${matchProfile.first_name ?? ""} ${matchProfile.last_name ?? ""}`.trim() || "Match";

  const clientInitials = clientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const matchInitials = matchName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === "") return "—";
    if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Get important questions to compare
  const importantQuestions = [
    "gender",
    "date_of_birth",
    "ethnicity",
    "religion",
    "education_level",
    "height",
    "relationship_values",
    "marriage",
    "children",
    "smoking",
    "alcohol",
    "interests",
  ];

  const comparisons = importantQuestions
    .map((questionId) => {
      const question = questions.find((q) => q.id === questionId);
      if (!question) return null;

      const clientValue = clientAnswers[questionId];
      const matchValue = matchAnswers[questionId];

      // Simple match check
      const isMatch = clientValue && matchValue && formatValue(clientValue) === formatValue(matchValue);

      return {
        questionId,
        questionText: question.question_text_en,
        clientValue,
        matchValue,
        isMatch,
      };
    })
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Match Comparison</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-4 pr-4">
            {/* Compatibility Score */}
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  {clientProfile.primary_photo_url ? (
                    <AvatarImage src={clientProfile.primary_photo_url} alt={clientName} />
                  ) : (
                    <AvatarFallback>{clientInitials}</AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm font-medium">{clientName}</span>
                <span className="text-xs text-muted-foreground">vs</span>
                <Avatar className="h-10 w-10">
                  {matchProfile.primary_photo_url ? (
                    <AvatarImage src={matchProfile.primary_photo_url} alt={matchName} />
                  ) : (
                    <AvatarFallback>{matchInitials}</AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm font-medium">{matchName}</span>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={compatibilityScore} className="h-2 w-32" />
                <span className="text-lg font-bold text-primary w-12 text-right">{compatibilityScore}%</span>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Criteria</TableHead>
                    <TableHead>{clientName}</TableHead>
                    <TableHead className="w-[60px] text-center">Match</TableHead>
                    <TableHead>{matchName}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                        No data available for comparison
                      </TableCell>
                    </TableRow>
                  ) : (
                    comparisons.map((comparison: any, index: number) => (
                      <TableRow
                        key={index}
                        className={comparison.isMatch ? "bg-green-50/50" : ""}
                      >
                        <TableCell className="font-medium text-xs">
                          {comparison.questionText}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatValue(comparison.clientValue)}
                        </TableCell>
                        <TableCell className="text-center">
                          {comparison.isMatch ? (
                            <Check className="h-4 w-4 text-green-600 mx-auto" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mx-auto" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatValue(comparison.matchValue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onAddMatch && (
            <Button onClick={onAddMatch}>
              Add as Active Match
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
