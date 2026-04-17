import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppRouter } from "../App";
import { PaperBinderApiError, type PaperBinderApiClient } from "../api/client";
import {
  createApiClientStub,
  createProvisionResponse,
  createRootHostContext
} from "../test/test-helpers";

type TurnstileRenderOptions = {
  callback?: (token: string) => void;
};

function installTurnstileStub(token = "paperbinder-test-challenge-pass") {
  const widgets = new Map<
    string,
    {
      button: HTMLButtonElement;
      container: HTMLElement;
      options: TurnstileRenderOptions;
    }
  >();
  let widgetCount = 0;

  const renderMock = vi.fn((container: HTMLElement, options: TurnstileRenderOptions) => {
    const widgetId = `widget-${widgetCount += 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Complete challenge";
    button.addEventListener("click", () => {
      button.textContent = "Challenge complete";
      options.callback?.(token);
    });

    container.replaceChildren(button);
    widgets.set(widgetId, { button, container, options });
    return widgetId;
  });

  const resetMock = vi.fn((widgetId: string) => {
    const widget = widgets.get(widgetId);
    if (!widget) {
      return;
    }

    widget.button.textContent = "Complete challenge";
  });

  const removeMock = vi.fn((widgetId: string) => {
    const widget = widgets.get(widgetId);
    if (!widget) {
      return;
    }

    widget.container.replaceChildren();
    widgets.delete(widgetId);
  });

  window.turnstile = {
    render: renderMock,
    reset: resetMock,
    remove: removeMock
  };

  return {
    renderMock,
    resetMock,
    removeMock
  };
}

function renderRootRoute({
  route = "/",
  apiClient,
  navigator = vi.fn<(redirectUrl: string) => void>()
}: {
  route?: "/" | "/login";
  apiClient?: PaperBinderApiClient;
  navigator?: (redirectUrl: string) => void;
}) {
  const resolvedApiClient = apiClient ?? createApiClientStub();

  render(
    <MemoryRouter initialEntries={[route]}>
      <AppRouter
        apiClient={resolvedApiClient}
        hostContext={createRootHostContext(route)}
        rootHostNavigator={navigator}
      />
    </MemoryRouter>
  );

  return {
    apiClient: resolvedApiClient,
    navigator
  };
}

afterEach(() => {
  delete window.turnstile;
});

describe("root-host flows", () => {
  it("Should_SubmitProvisionRequest_WithTenantNameAndChallengeToken_When_RootHostProvisionFormIsValid", async () => {
    installTurnstileStub();
    const provisionMock = vi.fn(async () => createProvisionResponse());

    renderRootRoute({
      route: "/",
      apiClient: createApiClientStub({
        provision: provisionMock as PaperBinderApiClient["provision"]
      })
    });

    fireEvent.change(screen.getByLabelText("Tenant name"), {
      target: { value: " Acme Demo " }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Provision new demo tenant and log in" }));

    await waitFor(() =>
      expect(provisionMock).toHaveBeenCalledWith({
        tenantName: "Acme Demo",
        challengeToken: "paperbinder-test-challenge-pass"
      })
    );

    expect(await screen.findByDisplayValue("owner@acme-demo.local")).toBeInTheDocument();
  });

  it("Should_ShowProvisionedCredentialsOnce_AndRedirectUsingServerProvidedUrl_When_ProvisionSucceeds", async () => {
    installTurnstileStub();
    const navigator = vi.fn();

    renderRootRoute({
      route: "/",
      navigator
    });

    fireEvent.change(screen.getByLabelText("Tenant name"), {
      target: { value: "Acme Demo" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Provision new demo tenant and log in" }));

    expect(await screen.findByRole("heading", { name: "Tenant provisioned." })).toBeInTheDocument();
    expect(navigator).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Continue to tenant" }));
    expect(navigator).toHaveBeenCalledWith("https://acme-demo.paperbinder.example.test/app");
  });

  it("Should_SubmitLoginRequest_AndRedirectUsingServerProvidedUrl_When_RootHostLoginSucceeds", async () => {
    installTurnstileStub();
    const loginMock = vi.fn(async () => ({
      redirectUrl: "https://acme-demo.paperbinder.example.test/app"
    }));
    const navigator = vi.fn();

    renderRootRoute({
      route: "/login",
      navigator,
      apiClient: createApiClientStub({
        login: loginMock as PaperBinderApiClient["login"]
      })
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@acme-demo.local" }
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "generated-password" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith({
        email: "owner@acme-demo.local",
        password: "generated-password",
        challengeToken: "paperbinder-test-challenge-pass"
      })
    );
    await waitFor(() =>
      expect(navigator).toHaveBeenCalledWith("https://acme-demo.paperbinder.example.test/app")
    );
  });

  it("Should_RenderSafeRootHostErrors_When_ProvisionOrLoginReturnsProblemDetails", async () => {
    installTurnstileStub();
    const error = new PaperBinderApiError({
      message: "Conflict",
      status: 409,
      errorCode: "TENANT_NAME_CONFLICT",
      detail: "That tenant name is already in use.",
      correlationId: "corr-conflict",
      retryAfterSeconds: null,
      traceId: null,
      validationErrors: null
    });

    renderRootRoute({
      route: "/",
      apiClient: createApiClientStub({
        provision: vi.fn(async () => {
          throw error;
        }) as PaperBinderApiClient["provision"]
      })
    });

    fireEvent.change(screen.getByLabelText("Tenant name"), {
      target: { value: "Acme Demo" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Provision new demo tenant and log in" }));

    expect(await screen.findByRole("heading", { name: "Tenant name already exists." })).toBeInTheDocument();
    expect(screen.getAllByText("That tenant name is already in use.")).toHaveLength(2);
    expect(screen.getByText(/corr-conflict/i)).toBeInTheDocument();
  });

  it("Should_ResetChallengeState_When_PreAuthSubmissionFails_AndRetryIsAllowed", async () => {
    const turnstile = installTurnstileStub();
    const loginMock = vi.fn(async () => {
      throw new PaperBinderApiError({
        message: "Invalid credentials",
        status: 401,
        errorCode: "INVALID_CREDENTIALS",
        detail: "The supplied email or password is invalid.",
        correlationId: "corr-invalid",
        retryAfterSeconds: null,
        traceId: null,
        validationErrors: null
      });
    });

    renderRootRoute({
      route: "/login",
      apiClient: createApiClientStub({
        login: loginMock as PaperBinderApiClient["login"]
      })
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "owner@acme-demo.local" }
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong-password" }
    });
    fireEvent.click(await screen.findByRole("button", { name: "Complete challenge" }));
    fireEvent.click(screen.getByRole("button", { name: "Log in" }));

    await screen.findByRole("heading", { name: "Credentials were not accepted." });
    await waitFor(() => expect(turnstile.resetMock).toHaveBeenCalledTimes(1));
  });
});
