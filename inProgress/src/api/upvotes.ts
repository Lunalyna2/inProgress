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
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to load upvotes");
  }

  return res.json();
};

export const addUpvote = async (projectId: number): Promise<UpvoteResponse> => {
  const res = await fetch(`${API_URL}/projects/${projectId}/upvotes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to upvote");
  }

  return res.json();
};

export const removeUpvote = async (projectId: number): Promise<UpvoteResponse> => {
  const res = await fetch(`${API_URL}/projects/${projectId}/upvotes`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || "Failed to remove upvote");
  }

  return res.json();
};

// added - toggle
export const toggleUpvote = (projectId: number, hasUpvoted: boolean) =>
  hasUpvoted ? removeUpvote(projectId) : addUpvote(projectId);