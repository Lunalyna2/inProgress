const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeader = () => {
  const token = localStorage.getItem("userToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface Comment {
  id: number;
  project_id: number;
  user_id: number;
  username: string;
  avatar?: string | null;
  text: string;
  created_at: string;
  updated_at?: string;
}

export const getComments = (projectId: number): Promise<Comment[]> => {
  return fetch(`${API_URL}/projects/${projectId}/comments`, {
    method: "GET",
    headers: getAuthHeader(),
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to fetch comments:", text);
      return Promise.reject(new Error("Failed to fetch comments"));
    }
    return res.json();
  });
};

export const postComment = (projectId: number, text: string): Promise<Comment> => {
  return fetch(`${API_URL}/projects/${projectId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ text }),
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to post comment:", text);
      return Promise.reject(new Error("Failed to post comment"));
    }
    return res.json();
  });
};

export const editComment = (commentId: number, text: string): Promise<Comment> => {
  return fetch(`${API_URL}/comments/${commentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify({ text }),
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to edit comment:", text);
      return Promise.reject(new Error("Failed to edit comment"));
    }
    return res.json();
  });
};

export const deleteComment = (commentId: number): Promise<boolean> => {
  return fetch(`${API_URL}/comments/${commentId}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  }).then(async (res) => {
    if (!res.ok) {
      const text = await res.text();
      console.error("Failed to delete comment:", text);
      return Promise.reject(new Error("Failed to delete comment"));
    }
    return true;
  });
};
