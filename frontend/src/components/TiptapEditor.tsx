"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Sparkles, Wand2, RefreshCw, Bold, Italic } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface TiptapEditorProps {
  content: string;
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
        class: 'doc-prose focus:outline-none w-full max-w-none text-zinc-300 min-h-[420px]',
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML(), editor.getText());
    },
  });

  useEffect(() => {
    if (editor && content) {
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const simulateAiAction = (action: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: `${action}...`,
        success: `${action} complete`,
        error: 'Failed to complete action',
      }
    );
  };

  return (
    <div className="relative w-full h-full">
      {editor && (
        <BubbleMenu editor={editor}>
          <div className="flex items-center gap-1 bg-[#18181b] border border-[#27272a] shadow-xl rounded-md p-1 backdrop-blur-md">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded text-xs transition-colors ${editor.isActive('bold') ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              title="Bold"
            >
              <Bold size={12} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded text-xs transition-colors ${editor.isActive('italic') ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
              title="Italic"
            >
              <Italic size={12} />
            </button>
            <div className="w-px h-3.5 bg-[#27272a] mx-0.5" />
            <button
              onClick={() => simulateAiAction('Rewriting section')}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RefreshCw size={11} /> Rewrite
            </button>
            <button
              onClick={() => simulateAiAction('Polishing executive tone')}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Wand2 size={11} /> Polish
            </button>
            <button
              onClick={() => simulateAiAction('Adding case proof point')}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Sparkles size={11} /> Expand Proof
            </button>
          </div>
        </BubbleMenu>
      )}
      
      <div className="w-full pb-20">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
