import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import type { HostContext } from "../app/host-context";
import {
  publicAnalyticsEventNames,
  trackPaperBinderEvent,
  trackPaperBinderPageview,
  type PublicAnalyticsEventName
} from "./goatcounter";

export function GoatCounterRouteTracker({ hostContext }: { hostContext: HostContext }) {
  const location = useLocation();

  useEffect(() => {
    trackPaperBinderPageview(hostContext, location.pathname);
  }, [hostContext, location.pathname]);

  return null;
}

const allowedPublicAnalyticsEvents = new Set(Object.values(publicAnalyticsEventNames));

export function isPublicAnalyticsEventName(value: string): value is PublicAnalyticsEventName {
  return allowedPublicAnalyticsEvents.has(value as PublicAnalyticsEventName);
}

export function PublicAnalyticsEventTracker({ hostContext }: { hostContext: HostContext }) {
  useEffect(() => {
    if (hostContext.kind !== "root") {
      return;
    }

    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const analyticsElement = target.closest<HTMLElement>("[data-paperbinder-analytics-event]");
      const eventName = analyticsElement?.dataset.paperbinderAnalyticsEvent;
      if (eventName === undefined || !isPublicAnalyticsEventName(eventName)) {
        return;
      }

      trackPaperBinderEvent(hostContext, eventName);
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [hostContext]);

  return null;
}
