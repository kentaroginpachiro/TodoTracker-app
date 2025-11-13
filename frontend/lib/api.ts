//bridging api 

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error(
    "Missing NEXT_PUBLIC_API_URL environment variable. Add NEXT_PUBLIC_API_URL to .env (or .env.local) and restart the dev server."
  );
}



//get
export const getTodos = async () => {
  const response = await axios.get(`${API_URL}/todos`);
  return response.data;
};
//post
export const createTodos = async (title: string, description: string) => {
  const response = await axios.post(`${API_URL}/todos`, {
    title,
    description,
    completed: false,
  });
  return response.data;
};
//put
export const updateTodos = async (id: number, data: any) => {
  const response = await axios.put(`${API_URL}/todos/${id}`, data);
  return response.data;
};
//delete
export const deleteTodos = async (id: number) => {
  const response = await axios.delete(`${API_URL}/todos/${id}`);
  return response.data;
};