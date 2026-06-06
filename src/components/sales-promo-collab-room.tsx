"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useReloadOnTenantChange } from "@/lib/use-tenant-session"
import type { JSONContent } from "@tiptap/core"
import { EditorContent, useEditor, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import { Color, TextStyle } from "@tiptap/extension-text-style"
import TextAlign from "@tiptap/extension-text-align"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Underline from "@tiptap/extension-underline"
import { TableKit } from "@tiptap/extension-table/kit"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArrowLeftIcon,
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  HighlighterIcon,
  ImagePlusIcon,
  ItalicIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  Loader2Icon,
  PaletteIcon,
  RedoIcon,
  StrikethroughIcon,
  Table2Icon,
  UnderlineIcon,
  UndoIcon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { sanitizeRichPasteHtml } from "@/lib/tiptap-paste-html"

const EMPTY_DOC: JSONContent = { type: "doc", content: [] }

function isDocJson(v: unknown): v is JSONContent {
  return typeof v === "object" && v !== null && (v as JSONContent).type === "doc"
}

function normalizeDocContent(raw: unknown): JSONContent {
  return isDocJson(raw) ? raw : EMPTY_DOC
}

async function uploadPromoImage(docId: string, file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch(`/api/sales-promo/documents/${docId}/upload-image`, {
    method: "POST",
    body: fd,
    credentials: "same-origin",
  })
  const j = (await res.json()) as { ok?: boolean; url?: string; error?: string }
  if (!res.ok || !j.ok || !j.url) throw new Error(j.error ?? "Upload failed")
  return j.url
}

const HIGHLIGHT_PRESETS: { label: string; color: string }[] = [
  { label: "Yellow", color: "#fef08a" },
  { label: "Green", color: "#bbf7d0" },
  { label: "Blue", color: "#bfdbfe" },
  { label: "Pink", color: "#fbcfe8" },
  { label: "Orange", color: "#fed7aa" },
  { label: "Purple", color: "#e9d5ff" },
]

const TEXT_PRESETS: { label: string; color: string }[] = [
  { label: "Default", color: "" },
  { label: "Red", color: "#dc2626" },
  { label: "Blue", color: "#2563eb" },
  { label: "Green", color: "#16a34a" },
  { label: "Purple", color: "#9333ea" },
  { label: "Orange", color: "#ea580c" },
]

function ToolbarButton({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon-sm"
      className="shrink-0"
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

function PromoEditorToolbar({
  editor,
  docId,
}: {
  editor: Editor
  docId: string
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)

  async function insertImageFiles(files: FileList | File[]) {
    const list = Array.from(files)
    const images = list.filter((f) => f.type.startsWith("image/"))
    if (!images.length) return
    setUploading(true)
    try {
      for (const file of images) {
        const url = await uploadPromoImage(docId, file)
        editor.chain().focus().setImage({ src: url }).run()
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Image upload failed")
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const fl = e.target.files
          if (fl?.length) void insertImageFiles(fl)
          e.target.value = ""
        }}
      />
      <div className="flex w-max max-w-none flex-nowrap items-center gap-0.5">
        <ToolbarButton
          title="Undo"
          disabled={!editor.can().undo()}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <UndoIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Redo"
          disabled={!editor.can().redo()}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <RedoIcon className="size-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <ToolbarButton
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <BoldIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <ItalicIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <StrikethroughIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Inline code"
          active={editor.isActive("code")}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <CodeIcon className="size-3.5" />
        </ToolbarButton>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant={editor.getAttributes("textStyle").color ? "secondary" : "ghost"}
                size="icon-sm"
                className="shrink-0"
                title="Text color"
              />
            }
          >
            <PaletteIcon className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-[min(100vw-1rem,280px)] p-2" align="start">
            <p className="text-muted-foreground px-0.5 pb-1.5 text-[10px] font-semibold tracking-wide uppercase">
              Text color
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_PRESETS.map((p) => (
                <Button
                  key={p.label + p.color}
                  type="button"
                  variant="outline"
                  size="xs"
                  className="h-7 gap-1 px-2"
                  onClick={() => {
                    if (!p.color) {
                      editor.chain().focus().unsetColor().run()
                      return
                    }
                    editor.chain().focus().setColor(p.color).run()
                  }}
                >
                  {p.color ? (
                    <span
                      className="size-3.5 rounded-sm border border-border"
                      style={{ backgroundColor: p.color }}
                      aria-hidden
                    />
                  ) : (
                    <span className="border-border bg-background size-3.5 rounded-sm border" aria-hidden />
                  )}
                  {p.label}
                </Button>
              ))}
            </div>
            <label className="text-muted-foreground mt-2 flex cursor-pointer items-center gap-2 text-xs">
              <span className="shrink-0">Custom</span>
              <input
                type="color"
                className="border-input h-8 w-full min-w-0 flex-1 cursor-pointer rounded border bg-background"
                onInput={(e) => {
                  const v = (e.target as HTMLInputElement).value
                  editor.chain().focus().setColor(v).run()
                }}
              />
            </label>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <ToolbarButton
          title="Heading 1"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1Icon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2Icon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3Icon className="size-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <ToolbarButton
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrderedIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Task list"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        >
          <ListTodoIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <span className="text-xs font-semibold">“</span>
        </ToolbarButton>
        <ToolbarButton
          title="Horizontal rule"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <span className="text-[10px] font-bold">HR</span>
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <ToolbarButton
          title="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeftIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenterIcon className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRightIcon className="size-3.5" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <ToolbarButton
          title="Link"
          active={editor.isActive("link")}
          onClick={() => {
            const previous = editor.getAttributes("link").href as string | undefined
            const next = window.prompt("Link URL", previous ?? "https://")
            if (next === null) return
            const trimmed = next.trim()
            if (trimmed === "") {
              editor.chain().focus().extendMarkRange("link").unsetLink().run()
              return
            }
            editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run()
          }}
        >
          <Link2Icon className="size-3.5" />
        </ToolbarButton>

        <ToolbarButton
          title={uploading ? "Uploading image…" : "Upload image"}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <ImagePlusIcon className="size-3.5" />
          )}
        </ToolbarButton>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant={editor.isActive("highlight") ? "secondary" : "ghost"}
                size="icon-sm"
                className="shrink-0"
                title="Highlight color"
              />
            }
          >
            <HighlighterIcon className="size-3.5" />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <p className="text-muted-foreground px-0.5 pb-1.5 text-[10px] font-semibold tracking-wide uppercase">
              Highlight
            </p>
            <div className="flex flex-wrap gap-1.5">
              {HIGHLIGHT_PRESETS.map((p) => (
                <Button
                  key={p.color}
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  title={p.label}
                  className="size-8 border-2 p-0"
                  style={{ backgroundColor: p.color }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: p.color }).run()}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="mt-2 w-full"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              Remove highlight
            </Button>
            <label className="text-muted-foreground mt-2 flex cursor-pointer items-center gap-2 text-xs">
              <span className="shrink-0">Custom</span>
              <input
                type="color"
                className="border-input h-8 w-full min-w-0 flex-1 cursor-pointer rounded border bg-background"
                defaultValue="#fef08a"
                onInput={(e) => {
                  const v = (e.target as HTMLInputElement).value
                  editor.chain().focus().setHighlight({ color: v }).run()
                }}
              />
            </label>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-0.5 h-6" />

        <ToolbarButton
          title="Insert table"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
        >
          <Table2Icon className="size-3.5" />
        </ToolbarButton>
      </div>
    </>
  )
}

function SaveStatusChip({
  status,
}: {
  status: "idle" | "saving" | "saved" | "error"
}) {
  const label =
    status === "saving" ? "Saving…" : status === "saved" ? "Saved" : status === "error" ? "Save failed" : ""

  if (!label) return null

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "saving"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100"
          : status === "error"
            ? "border-destructive/35 bg-destructive/10 text-destructive"
            : "border-border/60 bg-background/60 text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "saving"
            ? "bg-amber-500"
            : status === "error"
              ? "bg-destructive"
              : "bg-emerald-500",
        )}
        aria-hidden
      />
      <span className="text-foreground/80">{label}</span>
    </div>
  )
}

function SalesPromoEditor({
  docId,
  initialContent,
  onSaveStatus,
  readOnly = false,
}: {
  docId: string
  initialContent: JSONContent
  onSaveStatus?: (s: "idle" | "saving" | "saved" | "error") => void
  readOnly?: boolean
}) {
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = React.useRef<Editor | null>(null)
  const docIdRef = React.useRef(docId)
  docIdRef.current = docId

  const [saveStatus, setSaveStatus] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")

  const relayStatus = React.useCallback(
    (s: typeof saveStatus) => {
      setSaveStatus(s)
      onSaveStatus?.(s)
    },
    [onSaveStatus],
  )

  const editor = useEditor({
    immediatelyRender: false,
    content: initialContent,
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      TextStyle,
      Color.configure({ types: ["textStyle"] }),
      TableKit.configure({
        table: { resizable: true },
      }),
      Placeholder.configure({ placeholder: "Start writing your promo…" }),
      Highlight.configure({ multicolor: true }),
      Underline,
      Image.configure({
        allowBase64: true,
        HTMLAttributes: { class: "rounded-md border border-border" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    editorProps: {
      transformPastedHTML(html) {
        return sanitizeRichPasteHtml(html)
      },
      handlePaste(_view, event) {
        const ed = editorRef.current
        if (!ed) return false
        const cd = event.clipboardData
        if (!cd) return false
        const html = cd.getData("text/html") ?? ""
        // Prefer HTML paste when the clipboard is rich (Docs/Word/web) so tables and inline images survive.
        if (html.replace(/\s/g, "").length > 80) {
          return false
        }
        for (const item of cd.items) {
          if (item.kind === "file" && item.type.startsWith("image/")) {
            const file = item.getAsFile()
            if (file) {
              event.preventDefault()
              void (async () => {
                try {
                  const url = await uploadPromoImage(docIdRef.current, file)
                  ed.chain().focus().setImage({ src: url }).run()
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Could not paste image")
                }
              })()
              return true
            }
          }
        }
        return false
      },
    },
  })

  React.useEffect(() => {
    if (!editor) return
    editor.setEditable(!readOnly)
  }, [editor, readOnly])

  React.useEffect(() => {
    editorRef.current = editor
  }, [editor])

  React.useEffect(() => {
    if (!editor || readOnly) return

    const scheduleSave = () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      relayStatus("idle")
      saveTimer.current = setTimeout(async () => {
        saveTimer.current = null
        relayStatus("saving")
        try {
          const res = await fetch(`/api/sales-promo/documents/${docId}`, {
            method: "PATCH",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: editor.getJSON() }),
          })
          const data = (await res.json()) as { ok?: boolean; error?: string }
          if (!res.ok || !data.ok) {
            relayStatus("error")
            toast.error(data.error ?? "Could not save document")
            return
          }
          relayStatus("saved")
          window.setTimeout(() => relayStatus("idle"), 2000)
        } catch {
          relayStatus("error")
          toast.error("Network error while saving")
        }
      }, 1100)
    }

    editor.on("update", scheduleSave)
    return () => {
      editor.off("update", scheduleSave)
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [docId, editor, relayStatus, readOnly])

  if (!editor) {
    return (
      <div className="text-muted-foreground flex min-h-[min(60vh,900px)] items-center justify-center gap-2 px-6 py-16 text-sm">
        <Loader2Icon className="size-4 animate-spin" />
        Preparing editor…
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[min(60vh,900px)] flex-col">
      {readOnly ? null : (
        <div className="border-border/80 bg-background/80 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 flex min-h-10 items-stretch border-b backdrop-blur">
          <div className="min-h-10 min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
            <div className="flex h-full min-w-max items-center py-1 pr-1 pl-2 sm:pl-3 md:pl-4">
              <PromoEditorToolbar editor={editor} docId={docId} />
            </div>
          </div>
          <div className="bg-background/95 flex min-h-10 w-[6.25rem] shrink-0 items-center justify-end border-l border-border/60 px-2">
            <SaveStatusChip status={saveStatus} />
          </div>
        </div>
      )}
      <EditorContent
        editor={editor}
        className={cn(
          "max-w-none px-4 py-6 sm:px-8 sm:py-10",
          "[&_.ProseMirror]:min-h-[min(52vh,820px)] [&_.ProseMirror]:text-[15px] [&_.ProseMirror]:leading-7",
          "[&_.ProseMirror]:text-foreground/90 [&_.ProseMirror]:outline-none",
          "[&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-semibold [&_.ProseMirror_h1]:tracking-tight",
          "[&_.ProseMirror_h2]:mt-6 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-semibold",
          "[&_.ProseMirror_h3]:mt-4 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-semibold",
          "[&_.ProseMirror_p]:my-2",
          "[&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ol]:my-3",
          "[&_.ProseMirror_ul[data-type=taskList]]:list-none [&_.ProseMirror_ul[data-type=taskList]]:pl-0",
          "[&_.ProseMirror_li[data-type=taskItem]]:flex [&_.ProseMirror_li[data-type=taskItem]]:items-start [&_.ProseMirror_li[data-type=taskItem]]:gap-2",
          "[&_.ProseMirror_li[data-type=taskItem]>label]:flex [&_.ProseMirror_li[data-type=taskItem]>label]:items-start [&_.ProseMirror_li[data-type=taskItem]>label]:gap-2 [&_.ProseMirror_li[data-type=taskItem]>label]:pt-0.5",
          "[&_.ProseMirror_li[data-type=taskItem]>div]:min-w-0 [&_.ProseMirror_li[data-type=taskItem]>div]:flex-1",
          "[&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-border [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-muted-foreground",
          "[&_.ProseMirror_img]:mx-auto [&_.ProseMirror_img]:my-4 [&_.ProseMirror_img]:max-h-[480px] [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:object-contain",
          "[&_.ProseMirror_table]:w-full [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:overflow-hidden [&_.ProseMirror_table]:rounded-lg [&_.ProseMirror_table]:border [&_.ProseMirror_table]:border-border",
          "[&_.ProseMirror_td]:min-w-[3rem] [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:p-2 [&_.ProseMirror_td]:align-top",
          "[&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:bg-muted/45 [&_.ProseMirror_th]:p-2 [&_.ProseMirror_th]:text-left [&_.ProseMirror_th]:font-semibold",
          "[&_.ProseMirror_table_colgroup]:hidden",
        )}
      />
    </div>
  )
}

function PromoDocWorkspace({ docId }: { docId: string }) {
  const router = useRouter()
  const [title, setTitle] = React.useState("")
  const [docContent, setDocContent] = React.useState<JSONContent>(EMPTY_DOC)
  const [canManage, setCanManage] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [headerSave, setHeaderSave] = React.useState<
    "idle" | "saving" | "saved" | "error"
  >("idle")

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/sales-promo/documents/${docId}`, {
          credentials: "same-origin",
          cache: "no-store",
        })
        const data = (await res.json()) as {
          ok?: boolean
          error?: string
          document?: { title: string; content?: unknown }
          canManage?: boolean
        }
        if (!res.ok || !data.ok || !data.document || cancelled) {
          toast.error(data.error ?? "Could not load this document")
          return
        }
        setTitle(data.document.title)
        setDocContent(normalizeDocContent(data.document.content))
        setCanManage(!!data.canManage)
      } catch {
        if (!cancelled) toast.error("Network error loading document")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [docId])

  useReloadOnTenantChange(() => {
    toast.message("Store changed", {
      description: "Sales Promo documents are per store. Returning to the list.",
    })
    router.push("/dashboard/sales-promo")
  })

  async function saveTitle(next: string) {
    try {
      const res = await fetch(`/api/sales-promo/documents/${docId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Could not rename")
        return
      }
    } catch {
      toast.error("Network error")
    }
  }

  return (
    <div className={cn("bg-muted/20 flex min-h-0 flex-1 flex-col")}>
      <header className="border-border/80 sticky top-0 z-30 shrink-0 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto grid w-full max-w-[1600px] gap-4 px-3 py-4 sm:px-5 lg:[grid-template-columns:1fr_auto] lg:items-center lg:gap-8 lg:px-8">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <Link
              href="/dashboard/sales-promo"
              aria-label="Back to Sales Promo"
              className="border-border/80 hover:bg-muted/65 focus-visible:ring-ring inline-flex size-10 shrink-0 items-center justify-center self-center rounded-xl border bg-background shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
            >
              <ArrowLeftIcon className="size-4" />
            </Link>

            <div className="min-w-0 flex-1 py-0.5">
              <div className="text-muted-foreground mb-2 text-[11px] font-semibold tracking-widest uppercase">
                Sales Promo
              </div>
              <Input
                value={title}
                disabled={loading || !canManage}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => void saveTitle(title.trim() || "Untitled promo")}
                className="focus-visible:ring-ring h-11 w-full max-w-full rounded-lg border border-transparent bg-muted/25 px-3 text-lg font-semibold tracking-tight shadow-none transition-colors focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-offset-0 sm:text-xl md:max-w-[720px] md:text-2xl"
                placeholder="Untitled promo"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2 sm:hidden">
              <SaveStatusChip status={headerSave} />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[1600px] flex-1 grid-cols-1 gap-0">
        <main className="min-h-0 overflow-y-auto px-3 py-4 sm:px-4 lg:px-6">
          <div className="border-border/80 bg-card mx-auto w-full max-w-[min(100%,1200px)] overflow-hidden rounded-xl border shadow-sm">
            {loading ? (
              <div className="text-muted-foreground flex items-center gap-2 px-6 py-12 text-sm">
                <Loader2Icon className="size-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <>
                {!canManage ? (
                  <div className="border-border/80 bg-muted/30 text-muted-foreground border-b px-4 py-2.5 text-xs leading-relaxed">
                    <span className="font-medium text-foreground">View only.</span> You can read this promo
                    document but cannot edit it. Ask an admin if changes are needed.
                  </div>
                ) : null}
                <SalesPromoEditor
                  docId={docId}
                  initialContent={docContent}
                  readOnly={!canManage}
                  onSaveStatus={(s) => setHeaderSave(s)}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export function SalesPromoCollabRoom({ docId }: { docId: string }) {
  return <PromoDocWorkspace docId={docId} />
}
