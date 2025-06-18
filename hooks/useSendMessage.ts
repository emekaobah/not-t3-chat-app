export function useSendMessage() {
  const sendMessage = async ({
    conversation_id,
    model,
    role,
    content,
  }: {
    conversation_id: string;
    model: string;
    role: string;
    content: string;
  }) => {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id, model, role, content }),
    });
    return res.json();
  };
  return sendMessage;
}
