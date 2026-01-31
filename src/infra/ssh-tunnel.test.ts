import { describe, expect, it } from "vitest";
import { parseSshTarget } from "./ssh-tunnel.js";

describe("parseSshTarget", () => {
  it("parses user@host", () => {
    const result = parseSshTarget("alice@example.com");
    expect(result).toEqual({ user: "alice", host: "example.com", port: 22 });
  });

  it("parses host only", () => {
    const result = parseSshTarget("example.com");
    expect(result).toEqual({ user: undefined, host: "example.com", port: 22 });
  });

  it("parses user@host:port", () => {
    const result = parseSshTarget("alice@example.com:2222");
    expect(result).toEqual({ user: "alice", host: "example.com", port: 2222 });
  });

  it("parses host:port", () => {
    const result = parseSshTarget("example.com:2222");
    expect(result).toEqual({ user: undefined, host: "example.com", port: 2222 });
  });

  it("strips leading ssh prefix", () => {
    const result = parseSshTarget("ssh alice@example.com");
    expect(result).toEqual({ user: "alice", host: "example.com", port: 22 });
  });

  it("rejects targets starting with '-'", () => {
    expect(parseSshTarget("-oProxyCommand=calc")).toBeNull();
    expect(parseSshTarget("ssh -oProxyCommand=calc")).toBeNull();
  });

  it("rejects hosts starting with '-'", () => {
    expect(parseSshTarget("user@-badhost")).toBeNull();
    expect(parseSshTarget("-badhost:2222")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(parseSshTarget("")).toBeNull();
    expect(parseSshTarget("   ")).toBeNull();
  });
});
