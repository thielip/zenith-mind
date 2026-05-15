jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));
jest.mock("@/env", () => ({
  env: require("@/test-utils/env-mock").env,
}));

import { revalidatePath, revalidateTag } from "next/cache";
import { POST } from "../route";

describe("POST /api/revalidate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env["REVALIDATE_SECRET"] = "revalidate-secret-revalidate-secret";
  });

  it("rejects missing bearer token", async () => {
    const response = await POST(new Request("http://localhost/api/revalidate", { method: "POST" }) as never);
    expect(response.status).toBe(401);
  });

  it("revalidates a path", async () => {
    const response = await POST(
      new Request("http://localhost/api/revalidate", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env["REVALIDATE_SECRET"]}` },
        body: JSON.stringify({ type: "path", value: "/zh-TW/blog" }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/zh-TW/blog");
  });

  it("revalidates a tag", async () => {
    const response = await POST(
      new Request("http://localhost/api/revalidate", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env["REVALIDATE_SECRET"]}` },
        body: JSON.stringify({ type: "tag", value: "posts" }),
      }) as never
    );

    expect(response.status).toBe(200);
    expect(revalidateTag).toHaveBeenCalledWith("posts");
  });

  it("rejects invalid token", async () => {
    const response = await POST(
      new Request("http://localhost/api/revalidate", {
        method: "POST",
        headers: { Authorization: "Bearer wrong" },
        body: JSON.stringify({ value: "/zh-TW" }),
      }) as never
    );

    expect(response.status).toBe(401);
  });
});
