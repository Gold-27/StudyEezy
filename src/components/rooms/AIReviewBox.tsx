"use client";

import React from "react";
import { AIReview } from "@/types";
import { CheckCircle2, XCircle, Lightbulb, GraduationCap, Award } from "lucide-react";

interface AIReviewBoxProps {
  review: AIReview;
  onClose?: () => void;
}

export default function AIReviewBox({ review, onClose }: AIReviewBoxProps) {
  return (
    <div className="bg-surface border border-primary/20 rounded-lg p-5 shadow-2 flex flex-col gap-4 text-on-surface">
      <div className="flex items-center justify-between border-b border-outline/10 pb-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <h4 className="text-title-medium font-bold text-primary">Tutor Evaluation Report</h4>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-body-small text-on-surface-variant hover:underline font-medium"
          >
            Close
          </button>
        )}
      </div>

      {/* Score Section */}
      <div className="flex items-center gap-3 bg-primary-container/20 p-3 rounded-md border border-primary/10">
        <Award className="w-8 h-8 text-primary" />
        <div>
          <span className="text-body-small font-semibold text-on-surface-variant">Answer Quality Score</span>
          <p className="text-title-medium font-bold text-primary">{review.score} / 10</p>
        </div>
      </div>

      {/* Strengths */}
      {review.strengths?.length > 0 && (
        <div>
          <span className="text-body-small font-bold text-success flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="w-4 h-4" /> Correct Concepts Covered
          </span>
          <ul className="list-disc list-inside text-body-medium text-on-surface-variant/90 space-y-0.5 pl-1">
            {review.strengths.map((str, idx) => (
              <li key={idx}>{str}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Gaps */}
      {review.missingConcepts?.length > 0 && (
        <div className="border-t border-outline/5 pt-3">
          <span className="text-body-small font-bold text-error flex items-center gap-1.5 mb-1.5">
            <XCircle className="w-4 h-4" /> Omitted Key Concepts
          </span>
          <ul className="list-disc list-inside text-body-medium text-on-surface-variant/90 space-y-0.5 pl-1">
            {review.missingConcepts.map((mis, idx) => (
              <li key={idx}>{mis}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {review.improvements?.length > 0 && (
        <div className="border-t border-outline/5 pt-3">
          <span className="text-body-small font-bold text-secondary flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-4 h-4" /> Suggested Improvements
          </span>
          <ul className="list-disc list-inside text-body-medium text-on-surface-variant/90 space-y-0.5 pl-1">
            {review.improvements.map((imp, idx) => (
              <li key={idx}>{imp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Model Answer */}
      {review.modelAnswer && (
        <div className="border-t border-outline/10 pt-3 mt-1 bg-surface-variant/30 p-4 rounded-md border border-outline/5">
          <span className="block text-body-small font-bold text-primary mb-1">Model Study Answer</span>
          <p className="text-body-medium leading-relaxed italic text-on-surface-variant">
            "{review.modelAnswer}"
          </p>
        </div>
      )}
    </div>
  );
}
