export function useCreateConversation() {
  const createConversation = async (props: { title?: string } = {}) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(props),
    });
    const data = await res.json();
    return data;
  };
  return { createConversation };
}
