import React, { useEffect } from "react";
import { useForm, useSelector } from "@tanstack/react-form";
import { ArrowRight, Fingerprint } from "lucide-react";

import { Button } from "@vidcastx/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@vidcastx/ui/components/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@vidcastx/ui/components/field";
import { Input } from "@vidcastx/ui/components/input";

import { AvatarUploader } from "#app/components/avatar-uploader";
import { createOrganization } from "#app/features/onboarding/api/create-organization";

import { organizationSchema } from "../validators/schema";

interface StepProps {
  onComplete: () => void;
}

function getInitials(name: string) {
  if (!name) return "OR";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const second = parts[1]?.[0] ?? "";
    return (first + second).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const Step2Organization: React.FC<StepProps> = ({ onComplete }) => {
  const form = useForm({
    defaultValues: {
      orgName: "",
      orgIdentifier: "",
      orgAvatarUrl: "",
    },
    validators: { onChange: organizationSchema },
    onSubmit: async ({ value }) => {
      await createOrganization(value);
      onComplete();
    },
  });

  // Watch orgName to generate identifier and avatar initials
  const orgName = useSelector(form.store, (state) => state.values.orgName);

  useEffect(() => {
    if (orgName) {
      const slug = orgName
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, "-")
        .replaceAll(/^-+|-+$/g, "");
      form.setFieldValue("orgIdentifier", slug);
    }
  }, [orgName, form]);

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Create your Organization</CardTitle>
        <CardDescription>This will be your shared workspace for collaboration.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void form.handleSubmit();
          }}
          className="space-y-6"
        >
          <form.Field name="orgAvatarUrl">
            {(field) => (
              <div className="flex flex-col items-center gap-4">
                <AvatarUploader
                  value={field.state.value || ""}
                  onChange={field.handleChange}
                  fallbackInitials={getInitials(orgName)}
                />
                <div className="text-center">
                  <p className="text-sm font-medium">Organization Logo</p>
                  <p className="text-muted-foreground text-xs">Upload a logo to make your workspace recognizable.</p>
                </div>
              </div>
            )}
          </form.Field>

          <form.Field name="orgName">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>Organization Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    placeholder="Acme Inc."
                    aria-invalid={isInvalid}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="orgIdentifier">
            {(field) => {
              const isInvalid = field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <Field>
                  <FieldLabel htmlFor={field.name}>Organization ID</FieldLabel>
                  <div className="relative">
                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Fingerprint className="h-4 w-4" />
                    </div>
                    <Input
                      id={field.name}
                      name={field.name}
                      className="pl-9"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => {
                        field.handleChange(e.target.value);
                      }}
                      placeholder="acme-inc"
                      aria-invalid={isInvalid}
                    />
                  </div>
                  <FieldDescription>This unique ID will be used to identify your organization.</FieldDescription>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} className="w-full">
                {isSubmitting ? "Saving..." : "Next Step"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
};
