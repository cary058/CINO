import { describe, it, expect } from "vitest";
import { hasPermission, isAdminOrSuperAdmin, isStaff } from "../src/lib/rbac";
import { generateAnonymousId } from "../src/lib/auth";

describe("RBAC & Auth Utilities", () => {
  it("generates correct anonymous ID format (e.g. SINO-XXXXXX)", () => {
    const id = generateAnonymousId();
    expect(id).toMatch(/^SINO-[A-Z0-9]{6}$/);
  });

  it("restricts admin dashboard to authorized roles", () => {
    expect(hasPermission("USER", "admin:dashboard")).toBe(false);
    expect(hasPermission("VOLUNTEER", "admin:dashboard")).toBe(false);
    expect(hasPermission("ADMIN", "admin:dashboard")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "admin:dashboard")).toBe(true);
  });

  it("restricts coordinator assign permission", () => {
    expect(hasPermission("USER", "coordinator:assign")).toBe(false);
    expect(hasPermission("VOLUNTEER", "coordinator:assign")).toBe(false);
    expect(hasPermission("COORDINATOR", "coordinator:assign")).toBe(true);
  });

  it("verifies staff roles correctly", () => {
    expect(isStaff("USER")).toBe(false);
    expect(isStaff("VOLUNTEER")).toBe(true);
    expect(isStaff("COORDINATOR")).toBe(true);
    expect(isStaff("PROFESSIONAL")).toBe(true);
  });
});