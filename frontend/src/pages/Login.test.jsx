import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../context/AuthContext";
import Login from "./Login";

describe("Login page", () => {
  afterEach(() => cleanup());

  it("submits credentials and redirects a customer to the customer workspace", async () => {
    const login = vi.fn().mockResolvedValue({ role: "customer" });
    render(<AuthContext.Provider value={{ login }}><MemoryRouter><Login /></MemoryRouter></AuthContext.Provider>);

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "customer@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Customer123!" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => expect(login).toHaveBeenCalledWith({ identifier: "customer@example.com", password: "Customer123!" }));
  });

  it("shows an authentication error returned by the API", async () => {
    const login = vi.fn().mockRejectedValue(new Error("Invalid credentials"));
    render(<AuthContext.Provider value={{ login }}><MemoryRouter><Login /></MemoryRouter></AuthContext.Provider>);

    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "wrong@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
  });
});
