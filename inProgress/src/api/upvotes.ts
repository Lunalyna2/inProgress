const API_URL = process.env.REACT_APP_API_URL;

const getAuthHeader = () => {
  const token = localStorage.getItem("userToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface UpvoteResponse {
  success: boolean;
  projectId: number;
  upvotes: number;
  hasUpvoted: boolean;
}

export const getUpvotes = async (projectId: number): Promise<UpvoteResponse> => {
  const res = await fetch(`${API_URL}/projects/${projectId}/upvotes`, {
    method: "GET",
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to fetch upvotes:", text);
    throw new Error("Failed to fetch upvotes");
  }
  return res.json();
};

export const addUpvote = async (projectId: number): Promise<UpvoteResponse> => {
  const res = await fetch(`${API_URL}/projects/${projectId}/upvotes`, {
    method: "POST",
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to add upvote:", text);
    throw new Error("Failed to add upvote");
  }
  return res.json();
};

export const removeUpvote = async (projectId: number): Promise<UpvoteResponse> => {
  const res = await fetch(`${API_URL}/projects/${projectId}/upvotes`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Failed to remove upvote:", text);
    throw new Error("Failed to remove upvote");
  }
  return res.json();
};
