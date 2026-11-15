import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { AppRoutes } from "./App";
import { getCustomerProfile } from "./services/dashboardService";
import { apiRequest } from "./services/adminService";

// Keep the real exports (API_URL etc.), replace only the network calls.
vi.mock("./services/dashboardService", async (importOriginal) => ({
  ...(await importOriginal()),
  getCustomerProfile: vi.fn(),
}));

vi.mock("./services/adminService", async (importOriginal) => ({
  ...(await importOriginal()),
  apiRequest: vi.fn(),
}));

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const loginPage = () => screen.findByRole("heading", { name: /welcome back/i });
const adminLoginPage = () =>
  screen.findByRole("button", { name: /enter admin portal/i });

describe("Infinity Pixel - Application Routing", () => {
  it("TC-001: should render the home page at /", async () => {
    renderAt("/");
    expect(
      await screen.findByRole("heading", { level: 1, name: /every moment/i }),
    ).toBeInTheDocument();
  });

  it("TC-002: should render the login page at /login", async () => {
    renderAt("/login");
    expect(await loginPage()).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("TC-003: should render the signup page at /signup", async () => {
    renderAt("/signup");
    expect(
      await screen.findByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("TC-004: should render the forgot password page at /forgot-password", () => {
    renderAt("/forgot-password");
    expect(screen.getByText(/Forgot Password/i)).toBeInTheDocument();
  });

  it("TC-006: should render the admin login page at /admin/login", async () => {
    renderAt("/admin/login");
    expect(await adminLoginPage()).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /infinity pixel studios/i }),
    ).toBeInTheDocument();
  });

  it("TC-008: should render nothing for an unknown route", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderAt("/unknown-page");
    expect(document.body.textContent.trim()).toBe("");
    warn.mockRestore();
  });
});

describe("Customer dashboard route (/customer/dashboard)", () => {
  it("TC-005a: redirects to /login when there is no customer session", async () => {
    renderAt("/customer/dashboard");
    expect(await loginPage()).toBeInTheDocument();
    expect(getCustomerProfile).not.toHaveBeenCalled();
  });

  it("TC-005b: renders the dashboard for a logged-in customer", async () => {
    localStorage.setItem("customerId", "c1");
    localStorage.setItem("customerToken", "token-123");
    getCustomerProfile.mockResolvedValue({
      customer: { _id: "c1", name: "Test Customer" },
    });

    renderAt("/customer/dashboard");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: /welcome back test customer/i,
      }),
    ).toBeInTheDocument();
    expect(getCustomerProfile).toHaveBeenCalledWith("c1", "token-123");
  });
});

describe("Admin dashboard route (/admin/dashboard)", () => {
  it("TC-007a: redirects to /admin/login when there is no admin token", async () => {
    renderAt("/admin/dashboard");
    expect(await adminLoginPage()).toBeInTheDocument();
    expect(apiRequest).not.toHaveBeenCalled();
  });

  it("TC-007b: renders the dashboard for a logged-in admin", async () => {
    localStorage.setItem("adminToken", "admin-token");
    apiRequest.mockResolvedValue({ customers: [] });

    renderAt("/admin/dashboard");

    expect(
      await screen.findByRole("heading", { name: /studio dashboard/i }),
    ).toBeInTheDocument();
    expect(apiRequest).toHaveBeenCalledWith("/api/admin/customers");
  });
});
