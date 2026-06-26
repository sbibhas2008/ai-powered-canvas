import { streamText, UIMessage, convertToModelMessages } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { isRateLimited } from "@/lib/agent/rateLimit";
import { getIp, parseJsonBody } from "@/lib/api/request";
import { rateLimited, serverError } from "@/lib/api/errors";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const SYSTEM_PROMPT = `You are a helpful AI assistant for a collaborative canvas application.
You help users with their questions and tasks. Keep responses concise and helpful.`;

export async function POST(request: Request) {
  try {
    const ip = getIp(request);
    if (isRateLimited(ip)) return rateLimited();

    const body = await parseJsonBody(request);
    const { messages } = body as { messages: UIMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: SYSTEM_PROMPT,
      messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[/api/agent] Error:", error);
    return serverError();
  }
}
