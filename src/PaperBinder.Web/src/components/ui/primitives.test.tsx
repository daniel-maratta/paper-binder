import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { Alert, AlertBody, AlertTitle } from "./alert";
import { Banner } from "./banner";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "./dialog";
import { Field } from "./field";
import { StatusBadge } from "./status-badge";
import { DataTable } from "./table";
import { Toast, ToastViewport } from "./toast";

function PrimitivePlayground() {
  return (
    <div className="space-y-6">
      <Button isLoading type="button">
        Primary action
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Foundation card</CardTitle>
          <CardDescription>Card content baseline.</CardDescription>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
      <Banner variant="warning">Lease slot reserved for later countdown work.</Banner>
      <Field hint="Shared field hint" label="Email">
        <input type="email" />
      </Field>
      <DataTable
        caption="Example table"
        columns={[
          { key: "name", header: "Name" },
          { key: "status", header: "Status" }
        ]}
        emptyMessage="No rows yet."
        rows={[]}
      />
      <Alert variant="danger">
        <AlertTitle>Problem details</AlertTitle>
        <AlertBody>Safe error messaging.</AlertBody>
      </Alert>
      <StatusBadge variant="warning">warning</StatusBadge>
      <ToastViewport>
        <Toast
          body="Mutation feedback stays visible until the reviewer clears it."
          onDismiss={() => undefined}
          title="Toast notification"
          variant="success"
        />
      </ToastViewport>
      <Dialog>
        <DialogTrigger asChild>
          <Button type="button" variant="secondary">
            Open dialog
          </Button>
        </DialogTrigger>
        <DialogContent
          description="Shared dialog description."
          title="Dialog title"
        >
          <p>Dialog body</p>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close dialog body
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

describe("ui primitives", () => {
  it("Should_RenderAccessibleButtonCardBannerFormTableAlertDialogStatusBadgeAndToastPrimitives", async () => {
    render(<PrimitivePlayground />);

    expect(screen.getByRole("button", { name: "Primary action" })).toBeInTheDocument();
    expect(screen.getByText("Foundation card")).toBeInTheDocument();
    expect(screen.getByText("Lease slot reserved for later countdown work.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByText("No rows yet.")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Problem details");
    expect(screen.getByText("warning")).toBeInTheDocument();
    expect(screen.getByText("Toast notification")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dismiss notification: Toast notification" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveTextContent("Dialog title");
    expect(within(dialog).queryByRole("button", { name: "Close dialog" })).not.toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole("button", { name: "Close dialog body" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Should_ForceReadableTextColorClasses_When_ButtonRendersAsChildLink", () => {
    render(
      <MemoryRouter>
        <div>
          <Button asChild type="button">
            <a href="/dark">Dark action</a>
          </Button>
          <Button asChild type="button" variant="secondary">
            <a href="/light">Light action</a>
          </Button>
        </div>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Dark action" }).className).toContain("!text-white");
    expect(screen.getByRole("link", { name: "Light action" }).className).toContain(
      "!text-[var(--pb-action-secondary-text)]"
    );
  });
});
