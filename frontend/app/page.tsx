"use client";
import { useEffect, useState, useMemo } from "react";
import { getTodos, createTodos, deleteTodos, updateTodos } from "@/lib/api";

export default function Home() {
  const [Todos, setTodos] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<any | null>(null);

  const [search, setSearch] = useState("");

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // ini dipakai utk fetch todos sekali saat komponen mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // helper kecil buat normalisasi nilai completed dari API
  const normalizeCompleted = (val: any) => {
    return val === true || val === "true" || val === 1 || val === "1";
  };

  // panggil API dan simpan hasil ke state
  const fetchTodos = async () => {
    const data = await getTodos();
    const normalized = Array.isArray(data)
      ? data.map((t: any) => ({ ...t, completed: normalizeCompleted(t.completed) }))
      : [];
    setTodos(normalized);
  };

  // tambah todo baru lewat API lalu refresh list
  const handleAdd = async () => {
    if (!title) return;
    await createTodos(title, description);
    setTitle("");
    setDescription("");
    // setelah menambah, pindah ke halaman 1 supaya user melihat item baru
    setCurrentPage(1);
    fetchTodos();
  };

  // hapus todo lalu refresh, jika modal buka untuk todo ini tutup modal
  const handleDelete = async (id: number) => {
    await deleteTodos(id);
    fetchTodos();
    if (selectedTodo?.id === id) {
      handleCloseModal();
    }
  };

  // toggle completed lewat API lalu refresh, update selectedTodo jika perlu
  const handleToggleComplete = async (id: number, completed: boolean) => {
    await updateTodos(id, { completed: !completed });
    fetchTodos();
    if (selectedTodo?.id === id) {
      setSelectedTodo({ ...selectedTodo, completed: !completed });
    }
  };

  // buka modal detail
  const openModal = (todo: any) => {
    setSelectedTodo(todo);
    setModalOpen(true);
  };

  // tutup modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedTodo(null);
  };

  // format tanggal 
  const formatDate = (d?: string) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleString();
  };

  // filter todos berdasarkan title 
  const filteredTodos = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return Todos;
    return Todos.filter((t) => ((t.title || "") as string).toLowerCase().includes(q));
  }, [Todos, search]);

  // total pages derived from filtered results and pageSize
  const totalPages = Math.max(1, Math.ceil(filteredTodos.length / pageSize));

  // ensure currentPage is valid whenever filteredTodos or pageSize change
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    if (currentPage < 1) {
      setCurrentPage(1);
    }
  }, [filteredTodos, pageSize, totalPages, currentPage]);

  // reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // slice the filtered todos for current page
  const paginatedTodos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTodos.slice(start, start + pageSize);
  }, [filteredTodos, currentPage, pageSize]);

  const handleChangePageSize = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // reset to first page on page size change
  };

  const goToPage = (p: number) => {
    const page = Math.max(1, Math.min(totalPages, p));
    setCurrentPage(page);
  };

  // helper to render a compact range of page buttons around current page
  const getPageNumbersToShow = () => {
    const maxButtons = 7;
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const window = Math.floor(maxButtons / 2);
    let start = Math.max(1, currentPage - window);
    let end = Math.min(totalPages, currentPage + window);

    // adjust if near boundaries
    if (start === 1) {
      end = Math.min(totalPages, start + maxButtons - 1);
    } else if (end === totalPages) {
      start = Math.max(1, end - maxButtons + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    // UI utama
    <main className="min-h-screen bg-gray-100 flex flex-col items-center p-10">
      <h1 className="text-2xl font-bold mb-6">Todo Tracker</h1>

      {/* Form tambah todo */}
      <div className="w-full max-w-md mb-6 bg-white p-4 rounded shadow">
        <label className="block mb-2">
          <span className="text-sm font-medium">Title</span>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full border p-2 rounded"
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Description</span>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1 block w-full border p-2 rounded resize-vertical"
          />
        </label>

        <div className="flex justify-end">
          <button
            onClick={handleAdd}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
      </div>

      {/* Search + page size */}
      <div className="w-full max-w-md mb-4 flex items-center gap-3">
        <input
          type="text"
          placeholder="Search todos by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 p-2 border rounded shadow-sm"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Per page:</label>
          <select
            value={pageSize}
            onChange={(e) => handleChangePageSize(Number(e.target.value))}
            className="p-2 border rounded"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>

      {/* Daftar todos */}
      <ul className="w-full max-w-md bg-white shadow rounded p-4">
        {paginatedTodos.map((todo) => {
          const created = todo.createdAt ?? todo.created_at ?? todo.created ?? todo.date;
          return (
            <li key={todo.id} className="flex justify-between items-center border-b py-3">
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <h2
                    className={`font-semibold ${
                      todo.completed === true ? "line-through text-gray-500" : ""
                    }`}
                  >
                    {todo.title}
                  </h2>
                  <span className="text-xs text-gray-400 ml-3">
                    {todo.completed ? "Done" : "Open"}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{todo.description}</p>
                <p className="text-xs text-gray-400 mt-1">Created: {formatDate(created)}</p>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleToggleComplete(todo.id, todo.completed)}
                  className="text-green-600 hover:underline text-sm"
                >
                  {todo.completed ? "Undo" : "Done"}
                </button>
                <button
                  onClick={() => handleDelete(todo.id)}
                  className="text-red-500 hover:underline text-sm"
                >
                  Delete
                </button>
                <button
                  aria-label="Open details"
                  onClick={() => openModal(todo)}
                  className="text-gray-600 hover:bg-gray-100 rounded px-2 py-1"
                >
                  ⋯
                </button>
              </div>
            </li>
          );
        })}

        {filteredTodos.length === 0 && (
          <li className="py-4 text-center text-sm text-gray-500">No todos match your search.</li>
        )}

        {filteredTodos.length > 0 && paginatedTodos.length === 0 && (
          <li className="py-4 text-center text-sm text-gray-500">No todos on this page.</li>
        )}
      </ul>

      {/* Pagination controls */}
      {filteredTodos.length > 0 && (
        <div className="w-full max-w-md flex flex-col items-center gap-2 mt-4">
          <div className="text-sm text-gray-600">
            Showing {(filteredTodos.length === 0) ? 0 : ( (currentPage - 1) * pageSize + 1 )}
            {" - "}
            {Math.min(currentPage * pageSize, filteredTodos.length)}
            {" of "}{filteredTodos.length}
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${currentPage === 1 ? "bg-gray-200 text-gray-400" : "bg-white border"}`}
            >
              Prev
            </button>

            {getPageNumbersToShow().map((p) => (
              <button
                key={p}
                onClick={() => goToPage(p)}
                className={`px-3 py-1 rounded ${p === currentPage ? "bg-blue-500 text-white" : "bg-white border"}`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${currentPage === totalPages ? "bg-gray-200 text-gray-400" : "bg-white border"}`}
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Modal detail */}
      {modalOpen && selectedTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleCloseModal} />
          <div className="relative bg-white rounded shadow-lg max-w-lg w-full mx-4 z-10">
            <div className="flex justify-between items-start p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold">{selectedTodo.title}</h3>
                <p className="text-xs text-gray-500">Created: {formatDate(selectedTodo.createdAt ?? selectedTodo.created_at ?? selectedTodo.created ?? selectedTodo.date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleComplete(selectedTodo.id, selectedTodo.completed)} className="text-green-600 hover:underline text-sm">
                  {selectedTodo.completed ? "Undo" : "Done"}
                </button>
                <button onClick={() => handleDelete(selectedTodo.id)} className="text-red-500 hover:underline text-sm">
                  Delete
                </button>
                <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 text-xl leading-none" aria-label="Close dialog">
                  ×
                </button>
              </div>
            </div>

            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-700">Description</h4>
              <p className="mt-2 text-gray-600">{selectedTodo.description}</p>

              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700">Details</h4>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>Status: <span className="font-medium">{selectedTodo.completed ? "Completed" : "Open"}</span></li>
                  <li>Created: {formatDate(selectedTodo.createdAt ?? selectedTodo.created_at ?? selectedTodo.created ?? selectedTodo.date)}</li>
                  {selectedTodo.id && <li>ID: {selectedTodo.id}</li>}
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-4 border-t">
              <button onClick={handleCloseModal} className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}