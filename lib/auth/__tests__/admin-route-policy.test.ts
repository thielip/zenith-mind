import {
  adminRouteRequiresAdminRole,
  canAccessAdminRoute,
  isAdminAuthenticatedApi,
  isAdminProtectedPage,
  isAdminPublicPage,
} from "@/lib/auth/admin-route-policy";

describe("admin-route-policy", () => {
  it("treats login and totp as public admin pages", () => {
    expect(isAdminPublicPage("/admin/login")).toBe(true);
    expect(isAdminPublicPage("/admin/totp")).toBe(true);
    expect(isAdminProtectedPage("/admin/login")).toBe(false);
  });

  it("protects dashboard and cms paths", () => {
    expect(isAdminProtectedPage("/admin/dashboard")).toBe(true);
    expect(isAdminProtectedPage("/admin/posts")).toBe(true);
    expect(isAdminProtectedPage("/admin/posts/abc/edit")).toBe(true);
  });

  it("flags admin-only pages and apis", () => {
    expect(adminRouteRequiresAdminRole("/admin/users")).toBe(true);
    expect(adminRouteRequiresAdminRole("/admin/posts/new")).toBe(true);
    expect(adminRouteRequiresAdminRole("/api/ai/jobs")).toBe(true);
    expect(adminRouteRequiresAdminRole("/api/admin/audit-log/export")).toBe(true);
    expect(adminRouteRequiresAdminRole("/api/admin/env-check")).toBe(true);
    expect(adminRouteRequiresAdminRole("/api/admin/integrations/probe")).toBe(true);
    expect(adminRouteRequiresAdminRole("/api/admin/realtime/stream")).toBe(true);
    expect(adminRouteRequiresAdminRole("/admin/dashboard/seo")).toBe(false);
  });

  it("allows guest on read routes and blocks admin-only", () => {
    expect(canAccessAdminRoute("/admin/dashboard", "GUEST")).toBe(true);
    expect(canAccessAdminRoute("/admin/users", "GUEST")).toBe(false);
    expect(canAccessAdminRoute("/admin/users", "ADMIN")).toBe(true);
    expect(canAccessAdminRoute("/api/ai/jobs", "GUEST")).toBe(false);
    expect(canAccessAdminRoute("/api/admin/env-check", "GUEST")).toBe(false);
    expect(canAccessAdminRoute("/api/admin/integrations/probe", "GUEST")).toBe(
      false
    );
    expect(canAccessAdminRoute("/api/admin/realtime/stream", "GUEST")).toBe(false);
  });

  it("covers authenticated api prefixes", () => {
    expect(isAdminAuthenticatedApi("/api/admin/env-check")).toBe(true);
    expect(isAdminAuthenticatedApi("/api/public/page-view")).toBe(false);
  });

  it("does not treat similar path prefixes as admin api", () => {
    expect(isAdminAuthenticatedApi("/api/administrator")).toBe(false);
    expect(isAdminAuthenticatedApi("/api/ai-generated")).toBe(false);
    expect(adminRouteRequiresAdminRole("/admin/user")).toBe(false);
    expect(adminRouteRequiresAdminRole("/admin/users-extra")).toBe(false);
  });

  it("blocks guest on nested ai job paths", () => {
    expect(canAccessAdminRoute("/api/ai/jobs/job-1", "GUEST")).toBe(false);
    expect(canAccessAdminRoute("/api/ai/worker", "GUEST")).toBe(false);
  });
});
