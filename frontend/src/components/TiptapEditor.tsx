"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Sparkles, Wand2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface TiptapEditorProps {
  content: string; // The HTML or Markdown content
}

export default function TiptapEditor({ content }: TiptapEditorProps) {
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
          <div className="flex items-center gap-1 bg-zinc-900 border border-white/10 shadow-2xl rounded-lg p-1">
            <button
              onClick={() => simulateAiAction('Rewriting')}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-md text-xs font-medium text-zinc-300 transition-colors"
            >
              <RefreshCw size={14} /> Rewrite
            </button>
            <button
              onClick={() => simulateAiAction('Making Professional')}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-white/10 rounded-md text-xs font-medium text-zinc-300 transition-colors"
            >
              <Wand2 size={14} /> Make Professional
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={() => simulateAiAction('Ask AI')}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-md text-xs font-medium transition-colors"
            >
              <Sparkles size={14} /> Ask AI
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
