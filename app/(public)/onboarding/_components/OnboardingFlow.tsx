"use client";

import { useState } from "react";
import { InviteGateForm } from "./InviteGateForm";
import { OnboardingForm } from "./OnboardingForm";

type Props = { inviteOnly?: boolean };

/** When inviteOnly: code was already validated before magic link (cookie). Show form only. Else: gate then profile form. */
export function OnboardingFlow({ inviteOnly = false }: Props) {
  const [step, setStep] = useState<"gate" | "form">(inviteOnly ? "form" : "gate");
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
    />
  );
}
