'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem
} from '@/components/ui/form'
import { RotateCcw, Copy, Check, Code, AlignLeft, FileText, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGenerateJsonBody } from '@/modules/ai/hooks/ai-suggestion'
import { validateGeneratedJson } from '@/lib/ai-agents'
import { toast } from 'sonner'

import { useWorkspaceStore } from '@/modules/layout/store'
import { useRequestPlaygroundStore } from '../store/useRequestStore'
import MonacoEditor from '@/components/monaco-editor'
import {
  BODY_TYPES,
  isFieldBody,
  monacoLanguageFor,
  parseBodyFields,
  type BodyType,
} from '@/lib/body-types'
import KeyValueFormEditor from './key-value-form'
import { copyToClipboard } from '@/lib/clipboard'




const bodyEditorSchema = z.object({
  contentType: z.enum(['application/json', 'text/plain']),
  body: z.string().optional(),
})

type BodyEditorFormData = z.infer<typeof bodyEditorSchema>

interface BodyEditorProps {
  initialData?: {
    contentType?: 'application/json' | 'text/plain'
    body?: string
  }
  /** Drives the editor language, the Content-Type, and the editor shape. */
  bodyType?: BodyType
  onBodyTypeChange?: (next: BodyType) => void
  onSubmit: (data: BodyEditorFormData) => void
  className?: string
}

const BodyEditor: React.FC<BodyEditorProps> = ({
  initialData = { contentType: 'application/json', body: '' },
  bodyType = 'JSON',
  onBodyTypeChange,
  onSubmit,
  className
}) => {
  const [copied, setCopied] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [prompt, setPrompt] = useState('')
  const {selectedWorkspace} = useWorkspaceStore()

  const {tabs, activeTabId} = useRequestPlaygroundStore();

  const {mutateAsync , data , isPending , isError} = useGenerateJsonBody()

  const form = useForm<BodyEditorFormData>({
    resolver: zodResolver(bodyEditorSchema),
    defaultValues: {
      contentType: initialData.contentType || 'application/json',
      body: initialData.body || ''
    },
  })

  const bodyValueWatch = form.watch('body')
  const bodyValue = form.watch('body')

  // Handle editor value changes
  const handleEditorChange = (value?: string) => {
    form.setValue('body', value || '', { shouldValidate: true })
  }

  // Handle copy
  const handleCopy = async () => {
    if (bodyValue) {
      try {
        await copyToClipboard(bodyValue, "Body copied")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const handleGenerateClick = () => {
    setShowGenerateDialog(true);
  }

  const onGenerateBody = async (promptText: string) => {
    try {
     
    
      if (bodyValue) {
        try {
          JSON.parse(bodyValue);
        } catch (e) {
          
          console.log('Invalid existing JSON, generating new schema');
        }
      }

      const result = await mutateAsync({
        prompt: promptText,
        method: tabs.find(t => t.id === activeTabId)?.method || 'POST',
        endpoint: tabs.find(t => t.id === activeTabId)?.url || '/',
        context: `Generate a JSON body with the following requirements: ${promptText}`,
       
      });

      if (result?.jsonBody) {
        form.setValue('body', JSON.stringify(result.jsonBody, null, 2));

        // A model can return JSON that parses but is not a usable request body
        // - empty, or full of nulls. Say so now rather than letting the user
        // discover it from a 400 later.
        const check = validateGeneratedJson(
          result.jsonBody as Record<string, unknown>
        );
        if (!check.isValid) {
          toast.warning(check.errors[0] ?? 'The generated body looks incomplete');
        } else if (check.suggestions.length) {
          toast.info(check.suggestions[0]);
        }
      }
      setShowGenerateDialog(false);
      setPrompt('');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not generate a body'
      );
    }
  }


  const handleFormat = () => {
    if (bodyType === 'JSON' && bodyValue) {
      try {
        const formatted = JSON.stringify(JSON.parse(bodyValue), null, 2)
        form.setValue('body', formatted)
      } catch (error) {
        console.error('Invalid JSON format')
      }
    }
  }

  // Reset
  const handleReset = () => {
    form.setValue('body', '')
  }

  return (
    <div className={cn("w-full", className)}>
      <Form {...form}>
        <div className="border border-line rounded-lg overflow-hidden bg-canvas">
          {/* Header */}
          <div className="bg-canvas border-b border-line px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-600">Body</span>
              <div className="flex items-center gap-2 text-[12px] text-zinc-400">
                                <Select
                  value={bodyType}
                  onValueChange={(next) => onBodyTypeChange?.(next as BodyType)}
                >
                  <SelectTrigger className="h-7 w-[132px] text-[12px]">
                    {BODY_TYPES.find((o) => o.value === bodyType)?.label ?? bodyType}
                  </SelectTrigger>
                  <SelectContent className="bg-surface-raised border-line">
                    {BODY_TYPES.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="text-[12px] hover:bg-line focus:bg-line"
                      >
                        <div className="flex flex-col items-start">
                          <span>{option.label}</span>
                          <span className="text-[10px] text-zinc-500">{option.hint}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {bodyType === 'JSON' && (
                
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateClick}
                  disabled={isPending}
                  className="h-7 px-2 text-[12px] text-zinc-400 hover:text-zinc-200 hover:bg-line"
                  title="Generate JSON Body"
                >
                  <Sparkles className={cn('h-3 w-3', isPending ? 'animate-spin text-zinc-400' : 'text-green-400')} />
                </Button>
              )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleFormat}
                  className="h-7 px-2 text-[12px] text-zinc-400 hover:text-zinc-200 hover:bg-line"
                  title="Format JSON"
                >
                  <AlignLeft className="h-3 w-3" />
                </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-7 px-2 text-[12px] text-zinc-400 hover:text-zinc-200 hover:bg-line"
                title="Copy content"
              >
                {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-[12px] text-zinc-400 hover:text-zinc-200 hover:bg-line"
                title="Clear content"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Editor - shape depends on the body type */}
          {bodyType === 'NONE' ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-[12px] text-zinc-600 italic">
                This request will be sent without a body.
              </p>
            </div>
          ) : isFieldBody(bodyType) ? (
            <div className="p-3">
              <KeyValueFormEditor
                initialData={
                  parseBodyFields(form.getValues('body')).length
                    ? parseBodyFields(form.getValues('body'))
                    : [{ key: '', value: '', enabled: true }]
                }
                onSubmit={(fields) => {
                  const serialized = JSON.stringify(
                    fields.filter((f) => f.key.trim() || f.value.trim())
                  )
                  form.setValue('body', serialized)
                  onSubmit({ contentType: 'text/plain', body: serialized })
                }}
                placeholder={{
                  key: 'Field Name',
                  value: 'Field Value',
                  description: bodyType === 'FORM_DATA' ? 'Form field' : 'Encoded field',
                }}
              />
              <p className="text-[11px] text-zinc-600 mt-3">
                {bodyType === 'FORM_DATA'
                  ? 'Sent as multipart/form-data. Text fields only - file uploads are not supported yet.'
                  : 'Sent as application/x-www-form-urlencoded.'}
              </p>
            </div>
          ) : (
          <div className="relative h-80">
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <MonacoEditor
                      height="320px"
                      value={field.value}
                      language={monacoLanguageFor(bodyType)}
                      theme="vs-dark"
                      options={{
                        automaticLayout: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 18,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        padding: { top: 16, bottom: 16 },
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                          useShadows: false,
                        }
                      }}
                      onChange={handleEditorChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          )}

          {/* Footer */}
          <div className="bg-canvas border-t border-line px-3 py-2.5 flex items-center justify-between">
            <div className="text-[12px] text-zinc-400">
              Lines: {bodyValue?.split('\n').length || 0} | 
              Characters: {bodyValue?.length || 0}
            </div>
            <Button
              type="button"
              size="sm"
              className="bg-brand hover:bg-brand text-white h-7"
              onClick={() => form.handleSubmit(onSubmit)()}
            >
              Update Body
            </Button>
          </div>
        </div>
      </Form>

      {/* Generate JSON Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="sm:max-w-[425px] bg-zinc-900 text-zinc-100 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Generate JSON Body</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="prompt">What kind of JSON body do you need?</Label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
                placeholder="e.g., Create a user registration body with email and password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGenerateDialog(false)}
              className="border-zinc-700 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={() => onGenerateBody(prompt)}
              disabled={!prompt.trim() || isPending}
              className="bg-brand hover:bg-brand"
            >
              {isPending ? 'Generating...' : 'Generate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BodyEditor