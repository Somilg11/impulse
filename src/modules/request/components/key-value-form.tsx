"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const keyValueSchema = z.object({
  items: z.array(
    z.object({
      key: z.string().min(1, "Key is required"),
      value: z.string().min(1, "Value is required"),
      enabled: z.boolean().default(true).optional(),
    })
  ),
});

type KeyValueFormData = z.infer<typeof keyValueSchema>;

export interface KeyValueItem {
  key: string;
  value: string;
  enabled?: boolean;
}

interface KeyValueFormEditorProps {
  initialData?: KeyValueItem[];
  onSubmit: (data: KeyValueItem[]) => void;
  placeholder?: {
    key?: string;
    value?: string;
    description?: string;
  };
  className?: string;
}

const KeyValueFormEditor: React.FC<KeyValueFormEditorProps> = ({
  initialData = [],
  onSubmit,
  placeholder = {
    key: "Key",
    value: "Value",
    description: "Description",
  },
  className,
}) => {
  const form = useForm<KeyValueFormData>({
    resolver: zodResolver(keyValueSchema),
    defaultValues: {
      items:
        initialData.length > 0
          ? initialData.map((item) => ({
              ...item,
              enabled: item.enabled ?? true,
            }))
          : [{ key: "", value: "", enabled: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const handleSubmit = (data: KeyValueFormData) => {
    const filteredItems = data.items
      .filter((item) => item.enabled && (item.key.trim() || item.value.trim()))
      .map(({ key, value }) => ({ key, value }));

    onSubmit(filteredItems);
  };

  const addNewRow = () => {
    append({ key: "", value: "", enabled: true });
  };

  const toggleEnabled = (index: number) => {
    const currentValue = form.getValues(`items.${index}.enabled`);
    form.setValue(`items.${index}.enabled`, !currentValue);
  };

  const removeRow = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // Autosave on changes with debounce
  // We'll serialize the filtered items and only call onSubmit when it changes.
  const lastSavedRef = useRef<string | null>(null);

  const getFilteredItemsFromValues = (items: KeyValueItem[]) =>
    items
      .filter(
        (item) => item.enabled && (item.key?.trim() || item.value?.trim())
      )
      .map(({ key, value }) => ({ key, value }));

  // Simple debounce implementation
  const debounce = <TArgs extends unknown[]>(fn: (...args: TArgs) => void, wait = 500) => {
    let t: ReturnType<typeof setTimeout> | null = null;
    return (...args: TArgs) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  const saveIfChanged = useCallback(
    (items: KeyValueItem[]) => {
      const filtered = getFilteredItemsFromValues(items);
      const serialized = JSON.stringify(filtered);
      if (serialized !== lastSavedRef.current) {
        lastSavedRef.current = serialized;
        onSubmit(filtered);
      }
    },
    [onSubmit]
  );

  const debouncedSaveRef = useRef(saveIfChanged);
  // keep ref up to date when saveIfChanged changes
  useEffect(() => {
    debouncedSaveRef.current = saveIfChanged;
  }, [saveIfChanged]);

  const debouncedInvokerRef = useRef<((items: KeyValueItem[]) => void) | null>(
    null
  );
  useEffect(() => {
    debouncedInvokerRef.current = debounce((items: KeyValueItem[]) => {
      debouncedSaveRef.current(items);
    }, 500);
  }, []);

  // Watch form values and trigger debounced save
  useEffect(() => {
    const subscription = form.watch((value) => {
      const items = (value as KeyValueFormData)?.items || [];
      debouncedInvokerRef.current?.(items as KeyValueItem[]);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  return (
    <div className={cn("w-full", className)}>
      <Form {...form}>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-zinc-400">
              Query Parameters
            </h3>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addNewRow}
                className="h-8 w-8 p-0 hover:bg-line"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className={cn(
                  // A table row with a divider, not a card. Key/value pairs are a list
                  // you scan down; boxing each one makes six headers look like six
                  // separate sections.
                  "grid grid-cols-12 items-center gap-2 border-b border-line px-1 transition-colors duration-[--duration-fast] ease-[--ease-ios] last:border-b-0 hover:bg-white/[0.02]",
                  !form.watch(`items.${index}.enabled`) && "opacity-45"
                )}
              >
                {/* Key Input */}
                <div className="col-span-5 md:col-span-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.key`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={placeholder.key}
                            className="h-8 rounded-none border-0 bg-transparent px-1.5 font-mono text-[12.5px] text-zinc-200 placeholder:font-sans placeholder:text-zinc-600 focus-visible:border-0"
                            disabled={!form.watch(`items.${index}.enabled`)}
                          />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Value Input */}
                <div className="col-span-5 md:col-span-4">
                  <FormField
                    control={form.control}
                    name={`items.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={placeholder.value}
                            className="h-8 rounded-none border-0 bg-transparent px-1.5 font-mono text-[12.5px] text-zinc-200 placeholder:font-sans placeholder:text-zinc-600 focus-visible:border-0"
                            disabled={!form.watch(`items.${index}.enabled`)}
                          />
                        </FormControl>
                        <FormMessage className="text-[12px]" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="col-span-1 flex items-center justify-center">
                  <FormField
                    control={form.control}
                    name={`items.${index}.enabled`}
                    render={({ field: checkboxField }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex items-center justify-center">
                            {/* A row is either included in the request or it is
                                not - a checkbox, not a green confirm button.
                                Red for "off" read as an error rather than a
                                state, so unchecked is simply empty. */}
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={Boolean(checkboxField.value)}
                              aria-label={
                                checkboxField.value ? "Included in request" : "Excluded from request"
                              }
                              onClick={() => toggleEnabled(index)}
                              className={cn(
                                "flex h-[15px] w-[15px] items-center justify-center rounded-[5px] border transition-colors duration-[--duration-fast] ease-[--ease-ios]",
                                checkboxField.value
                                  ? "border-brand bg-brand text-white"
                                  : "border-line-strong bg-transparent hover:border-zinc-500"
                              )}
                            >
                              {checkboxField.value && (
                                <Check className="h-2.5 w-2.5" strokeWidth={3} />
                              )}
                            </button>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                {/* Remove Button */}
                <div className="col-span-1 flex items-center justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    disabled={fields.length <= 1}
                    className={cn(
                      "h-5 w-5 p-0 transition-colors duration-[--duration-fast] ease-[--ease-ios]",
                      fields.length <= 1
                        ? "text-zinc-600 cursor-not-allowed"
                        : "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    )}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Autosave enabled — changes are saved automatically */}
          <div className="flex justify-end pt-4">
            <span className="text-[12px] text-zinc-500">
              Changes saved automatically
            </span>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default KeyValueFormEditor;