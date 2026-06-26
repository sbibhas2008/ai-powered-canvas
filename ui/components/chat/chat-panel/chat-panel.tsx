"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Send, Square, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useCallback, useRef, useEffect, useState, type KeyboardEvent } from "react";

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-lg bg-secondary px-4 py-3 text-sm">
        {content}
      </div>
    </div>
  );
}

function AssistantMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] rounded-lg bg-muted px-4 py-3 text-sm whitespace-pre-wrap">
        {content}
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/agent" }),
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim()) {
          sendMessage({ text: input });
          setInput("");
        }
      }
    },
    [input, sendMessage],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim()) {
        sendMessage({ text: input });
        setInput("");
      }
    },
    [input, sendMessage],
  );

  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-full w-96 flex-col border-l">
      <div className="border-b px-4 py-3">
        <h2 className="font-semibold text-sm">AI Assistant</h2>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col gap-4 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <MessageSquare className="size-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-medium text-sm">No messages yet</p>
                <p className="text-muted-foreground text-xs">
                  Start a conversation to see messages here
                </p>
              </div>
            </div>
          )}
          {messages.map((message) => {
            const text = getMessageText(message);
            return message.role === "user" ? (
              <UserMessage key={message.id} content={text} />
            ) : (
              <AssistantMessage key={message.id} content={text} />
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI assistant..."
            rows={1}
            className="min-h-10 max-h-32 resize-none"
          />
          {isStreaming ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={stop}
              className="shrink-0"
            >
              <Square className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="shrink-0"
            >
              <Send className="size-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
