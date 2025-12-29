export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export const apiRequest = async (endpoint, options = {}) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const isAuthRoute = endpoint.includes("/login");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token &&
        !isAuthRoute && {
          Authorization: `Bearer ${token}`,
        }),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    let errorMessage = "Something went wrong";
    try {
      const errorData = await response.json();
<<<<<<< HEAD
     errorMessage =
  errorData?.error?.message ||
  errorData?.message ||
  errorMessage;


=======
      errorMessage =
        errorData.error?.message || errorData.message || errorMessage;
>>>>>>> 0095b1b (updated filter with UI)
    } catch {}
    throw new Error(errorMessage);
  }

  return response.json();
};
