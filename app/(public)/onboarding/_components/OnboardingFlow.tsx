"use client";

import { useState } from "react";
import { InviteGateForm } from "./InviteGateForm";
import { OnboardingForm } from "./OnboardingForm";

type Props = { inviteOnly?: boolean; skipInviteCode?: boolean };

/** When inviteOnly or skipInviteCode: show form only (no invite gate). Else: gate then profile form. */
export function OnboardingFlow({ inviteOnly = false, skipInviteCode = false }: Props) {
  const [step, setStep] = useState<"gate" | "form">(inviteOnly || skipInviteCode ? "form" : "gate");
  const [inviteCode, setInviteCode] = useState("");

  if (step === "gate") {
    return (
      <InviteGateForm
        onContinue={(code) => {
          setInviteCode(code);
          setStep("form");
        }}
      />
    );
  }

  return (
    <OnboardingForm
      initialInviteCode={inviteCode}
      inviteOnly={inviteOnly}
      skipInviteCode={skipInviteCode}
    />
  );
}
