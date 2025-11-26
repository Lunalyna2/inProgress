  const API_URL = "http://localhost:5000/api";

  export const getComments = async (projectId: number) => {
    const token = localStorage.getItem("userToken");
    const res = await fetch(`${API_URL}/projects/${projectId}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch comments");
    return res.json();
  };

  export const postComment = async (projectId: number, text: string) => {
    const token = localStorage.getItem("userToken");
    const res = await fetch(`${API_URL}/projects/${projectId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Failed to post comment");
    return res.json();
  };

  export const deleteComment = async (commentId: number) => {
    const token = localStorage.getItem("userToken");
    const res = await fetch(`${API_URL}/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete comment");
    return res.json();
  };
  
  