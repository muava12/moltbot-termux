import { describe, expect, it } from "vitest";
import { stripReasoningTagsFromText } from "./reasoning-tags.js";

describe("stripReasoningTagsFromText", () => {
  it("strips basic thinking tags", () => {
    const input = "<think>reasoning</think>hello";
    expect(stripReasoningTagsFromText(input)).toBe("hello");
  });

  it("strips basic thought tags", () => {
    const input = "<thought>reasoning</thought>hello";
    expect(stripReasoningTagsFromText(input)).toBe("hello");
  });

  it("strips basic antthinking tags", () => {
    const input = "<antthinking>reasoning</antthinking>hello";
    expect(stripReasoningTagsFromText(input)).toBe("hello");
  });

  it("strips final tags but keeps content", () => {
    const input = "<final>final answer</final>";
    expect(stripReasoningTagsFromText(input)).toBe("final answer");
  });

  it("preserves tags inside fenced code blocks", () => {
    const input = "Here is some code:\n```\n<think>not reasoning</think>\n```\nOutside.";
    // It should preserve the content inside ```
    expect(stripReasoningTagsFromText(input, { trim: "none" })).toBe(input);
  });

  it("preserves tags inside inline code", () => {
    const input = "Use `<think>` for reasoning.";
    expect(stripReasoningTagsFromText(input)).toBe(input);
  });

  it("strips tags outside but preserves inside code", () => {
    const input = "<think>internal</think>code: ` <think> ` outside";
    expect(stripReasoningTagsFromText(input)).toBe("code: ` <think> ` outside");
  });

  it("handles mixed case tags", () => {
    const input = "<THINK>reasoning</THINK>hello";
    expect(stripReasoningTagsFromText(input)).toBe("hello");
  });

  it("handles whitespace inside tags", () => {
    const input = "<  think  >reasoning</  think  >hello";
    expect(stripReasoningTagsFromText(input)).toBe("hello");
  });

  it("handles unclosed tags in strict mode (default)", () => {
    const input = "<think>reasoning";
    expect(stripReasoningTagsFromText(input)).toBe("");
  });

  it("preserves content of unclosed tags in preserve mode", () => {
    const input = "<think>reasoning";
    expect(stripReasoningTagsFromText(input, { mode: "preserve" })).toBe("reasoning");
  });

  it("handles multiple code blocks", () => {
    const input = "```\n<think>1</think>\n```\n<think>strip</think>\n` <think>2 </think> `";
    expect(stripReasoningTagsFromText(input)).toBe("```\n<think>1</think>\n```\n\n` <think>2 </think> `");
  });

  it("handles different fencing characters", () => {
    const input = "~~~\\n<think>1</think>\n~~~";
    expect(stripReasoningTagsFromText(input)).toBe("~~~\\n<think>1</think>\n~~~");
  });
});