import { describe, it, expect, beforeEach, vi } from "vitest";

// Capture toast calls so the tests can reach into the "Undo" action and
// trigger it the same way a user tapping the toast button would.
vi.mock("sonner", () => {
  const toast = vi.fn();
  toast.success = vi.fn();
  toast.error = vi.fn();
  return { toast };
});

import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import {
  deleteWithUndo,
  deleteArrayItemWithUndo,
  deleteAllWithUndo,
} from "@/lib/undoableDelete";

// Pull the Undo handler out of the most recent toast(...) call.
function lastUndoAction() {
  const calls = toast.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  const opts = calls[calls.length - 1][1];
  expect(opts).toBeTruthy();
  expect(opts.action).toBeTruthy();
  expect(typeof opts.action.onClick).toBe("function");
  return opts.action.onClick;
}

beforeEach(() => {
  localStorage.clear();
  toast.mockClear();
  toast.success.mockClear();
  toast.error.mockClear();
});

describe("deleteArrayItemWithUndo (single chat message)", () => {
  it("restores a deleted message to its original position on undo", async () => {
    const session = await base44.entities.ChatSession.create({
      title: "Session",
      messages: [
        { role: "user", content: "first" },
        { role: "assistant", content: "second" },
        { role: "user", content: "third" },
      ],
    });

    await deleteArrayItemWithUndo({
      entity: "ChatSession",
      recordId: session.id,
      field: "messages",
      index: 1,
    });

    // The middle message is gone after delete.
    let current = await base44.entities.ChatSession.get(session.id);
    expect(current.messages.map((m) => m.content)).toEqual(["first", "third"]);

    // Undo brings it back at the same index.
    await lastUndoAction()();

    current = await base44.entities.ChatSession.get(session.id);
    expect(current.messages.map((m) => m.content)).toEqual([
      "first",
      "second",
      "third",
    ]);
    expect(current.messages[1]).toEqual({ role: "assistant", content: "second" });
  });

  it("keeps the message deleted when undo is never triggered", async () => {
    const session = await base44.entities.ChatSession.create({
      title: "Session",
      messages: [
        { role: "user", content: "keep" },
        { role: "assistant", content: "remove" },
      ],
    });

    await deleteArrayItemWithUndo({
      entity: "ChatSession",
      recordId: session.id,
      field: "messages",
      index: 1,
    });

    // Grace window passes with no undo click — the message stays gone.
    const current = await base44.entities.ChatSession.get(session.id);
    expect(current.messages.map((m) => m.content)).toEqual(["keep"]);
  });

  it("restores to the right place even if other messages change during the grace window", async () => {
    const session = await base44.entities.ChatSession.create({
      title: "Session",
      messages: [
        { role: "user", content: "a" },
        { role: "assistant", content: "b" },
        { role: "user", content: "c" },
      ],
    });

    await deleteArrayItemWithUndo({
      entity: "ChatSession",
      recordId: session.id,
      field: "messages",
      index: 2,
    });

    // Simulate the surrounding array shrinking before undo is clicked.
    await base44.entities.ChatSession.update(session.id, {
      messages: [{ role: "user", content: "a" }],
    });

    await lastUndoAction()();

    const current = await base44.entities.ChatSession.get(session.id);
    expect(current.messages.map((m) => m.content)).toEqual(["a", "c"]);
  });
});

describe("deleteWithUndo (whole chat session)", () => {
  it("restores a deleted session with its original id and fields on undo", async () => {
    const session = await base44.entities.ChatSession.create({
      title: "My session",
      last_message: "hello there",
      messages: [{ role: "user", content: "hi" }],
    });

    await deleteWithUndo({
      entity: "ChatSession",
      item: session,
      label: "Chat session",
    });

    // The session is gone after delete.
    expect(await base44.entities.ChatSession.get(session.id)).toBeNull();
    expect(await base44.entities.ChatSession.list()).toHaveLength(0);

    // Undo brings the whole record back intact.
    await lastUndoAction()();

    const restored = await base44.entities.ChatSession.get(session.id);
    expect(restored).not.toBeNull();
    expect(restored.id).toBe(session.id);
    expect(restored.title).toBe("My session");
    expect(restored.last_message).toBe("hello there");
    expect(restored.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("keeps the session deleted when undo is never triggered", async () => {
    const session = await base44.entities.ChatSession.create({
      title: "Doomed session",
    });

    await deleteWithUndo({
      entity: "ChatSession",
      item: session,
      label: "Chat session",
    });

    // Grace window passes with no undo click — the session stays gone.
    expect(await base44.entities.ChatSession.get(session.id)).toBeNull();
    expect(await base44.entities.ChatSession.list()).toHaveLength(0);
  });
});

describe("deleteAllWithUndo (bulk delete)", () => {
  it("restores every deleted record on undo", async () => {
    const a = await base44.entities.Character.create({ name: "Alpha" });
    const b = await base44.entities.Character.create({ name: "Beta" });

    await deleteAllWithUndo({
      entity: "Character",
      items: [a, b],
      label: "characters",
    });

    expect(await base44.entities.Character.list()).toHaveLength(0);

    await lastUndoAction()();

    const restored = await base44.entities.Character.list("name");
    expect(restored.map((c) => c.name).sort()).toEqual(["Alpha", "Beta"]);
    expect(restored.map((c) => c.id).sort()).toEqual([a.id, b.id].sort());
  });

  it("keeps everything deleted when undo is never triggered", async () => {
    const a = await base44.entities.Character.create({ name: "Alpha" });
    const b = await base44.entities.Character.create({ name: "Beta" });

    await deleteAllWithUndo({
      entity: "Character",
      items: [a, b],
      label: "characters",
    });

    expect(await base44.entities.Character.list()).toHaveLength(0);
  });
});
