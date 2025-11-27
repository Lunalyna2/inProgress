

const API_URL = process.env.REACT_APP_API_URL;

export const getComments = async (projectId: number) => {
  const token = localStorage.getItem("userToken");
  const res = await fetch(`${API_URL}/projects/${projectId}/comments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch comments:", text);
    throw new Error("Failed to fetch comments");
  }
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
  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to post comment:", text);
    throw new Error("Failed to post comment");
  }
  return res.json();
};

export const editComment = async (commentId: number, text: string) => {
  const token = localStorage.getItem("userToken");
  const res = await fetch(`${API_URL}/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to edit comment:", text);
    throw new Error("Failed to edit comment");
  }
  return res.json();
};

export const deleteComment = async (commentId: number) => {
  const token = localStorage.getItem("userToken");

  const res = await fetch(`${API_URL}/comments/${commentId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to delete comment:", text);
    throw new Error("Failed to delete comment");
  }

  return true;
};
