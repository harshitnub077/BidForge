"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface TiptapEditorProps {
  content: string; // The HTML or Markdown content
  onChange?: (html: string, text: string) => void;
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-p:text-sm prose-headings:font-medium focus:outline-none w-full max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML(), editor.getText());
    },
  });


  useEffect(() => {
    if (editor && content) {
      // If we regenerate the proposal completely, we want to update the editor content.
      // Checking if content is substantially different to avoid cursor jumps when typing?
      // Since it's generated via AI on a button click, setting it directly here is fine.
      if (editor.getHTML() !== content) {
        // Tiptap accepts HTML directly. Our `renderMarkdown` provides HTML.
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const simulateAiAction = (action: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1500)),
      {
        loading: `${action}...`,
        success: `${action} completed (Mock)`,
        error: 'Failed',
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      {editor && (
        <BubbleMenu editor={editor}>
          <div className="flex items-center gap-1.5 shadow-xl rounded-xl p-1.5 border backdrop-blur-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface-1) 80%, transparent)', borderColor: 'var(--color-hairline)', boxShadow: 'var(--glass-shadow-hover)' }}>
            <button
              onClick={() => simulateAiAction('Rewriting')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all hover:bg-[var(--color-surface-3)] group"
              style={{ color: 'var(--color-ink)' }}
            >
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Rewrite
            </button>
            <button
              onClick={() => simulateAiAction('Making Professional')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all hover:bg-[var(--color-surface-3)] group"
              style={{ color: 'var(--color-ink)' }}
            >
              <Wand2 size={14} className="group-hover:rotate-12 transition-transform" /> Professional
            </button>
            <div className="w-px h-5 mx-1" style={{ backgroundColor: 'var(--color-hairline-strong)' }} />
            <button
              onClick={() => simulateAiAction('Ask AI')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 hover:text-indigo-400 group relative overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent group-hover:animate-shimmer" />
              <Sparkles size={14} className="group-hover:scale-110 transition-transform" /> Ask AI
            </button>
          </div>
        </BubbleMenu>
      )}
      
      <div className="doc-prose-container w-full pb-32">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
