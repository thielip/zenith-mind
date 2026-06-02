/** @jest-environment jsdom */

import {
  clearAdminSessionHint,
  getAdminEmailHint,
  persistAdminSessionHint,
} from "@/lib/auth/client-session";

describe("client-session storage guards", () => {
  it("returns empty hint when storage get throws", () => {
    const storageProto = Object.getPrototypeOf(window.localStorage) as Storage;
    const getSpy = jest
      .spyOn(storageProto, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    expect(getAdminEmailHint()).toBe("");
    getSpy.mockRestore();
  });

  it("does not throw when storage set/remove throws", () => {
    const storageProto = Object.getPrototypeOf(window.localStorage) as Storage;
    const setSpy = jest
      .spyOn(storageProto, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const removeSpy = jest
      .spyOn(storageProto, "removeItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });

    expect(() => persistAdminSessionHint("a@b.com")).not.toThrow();
    expect(() => clearAdminSessionHint()).not.toThrow();

    setSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
