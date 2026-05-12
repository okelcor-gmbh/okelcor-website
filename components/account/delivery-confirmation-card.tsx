import { CheckCircle2, PackageCheck } from "lucide-react";

interface Props {
  declarationRequired?: boolean | null;
  declarationStatus?: "pending" | "signed" | "acknowledged" | null;
}

export default function DeliveryConfirmationCard({ declarationRequired, declarationStatus }: Props) {
  const euPending =
    declarationRequired === true &&
    declarationStatus !== "signed" &&
    declarationStatus !== "acknowledged";

  if (euPending) {
    return (
      <div className="rounded-[18px] border border-amber-200 bg-amber-50 p-4 sm:rounded-[22px] sm:p-5 lg:p-6">
        <div className="flex items-start gap-3">
          <PackageCheck
            size={18}
            strokeWidth={2}
            className="mt-0.5 shrink-0 text-amber-600"
          />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700 sm:text-[11px]">
              Delivery Confirmation Required
            </p>
            <p className="mt-1 text-[0.83rem] leading-relaxed text-amber-800">
              Your shipment has been delivered. As a reverse-charge B2B delivery,
              please complete the EU Entry Certificate below to confirm receipt and
              unlock your final invoice.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[18px] border border-green-200 bg-green-50 p-4 sm:rounded-[22px] sm:p-5 lg:p-6">
      <div className="flex items-center gap-3">
        <CheckCircle2
          size={18}
          strokeWidth={2}
          className="shrink-0 text-green-600"
        />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-green-700 sm:text-[11px]">
            Order Delivered
          </p>
          <p className="mt-0.5 text-[0.83rem] text-green-800">
            Your order has been delivered. A delivery note is available in your documents below.
          </p>
        </div>
      </div>
    </div>
  );
}
